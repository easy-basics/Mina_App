const prisma = require('./prisma');
const { fail } = require('./response');

function parseSortItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('排序列表不能为空');
    err.status = 400;
    throw err;
  }
  return items.map((item, index) => ({
    id: Number(item.id),
    sort: item.sort !== undefined ? Number(item.sort) : index,
  }));
}

async function applySortUpdates(model, items, extraWhere = {}, sortField = 'sort') {
  const parsed = parseSortItems(items);
  for (const item of parsed) {
    if (!item.id) {
      const err = new Error('排序项 id 无效');
      err.status = 400;
      throw err;
    }
  }

  const ids = parsed.map((i) => i.id);
  const existing = await prisma[model].findMany({
    where: { id: { in: ids }, ...extraWhere },
    select: { id: true },
  });
  if (existing.length !== ids.length) {
    const err = new Error('部分记录不存在或不在可排序范围内');
    err.status = 400;
    throw err;
  }

  await prisma.$transaction(
    parsed.map((item) =>
      prisma[model].update({
        where: { id: item.id },
        data: { [sortField]: item.sort },
      })
    )
  );

  return parsed;
}

module.exports = { parseSortItems, applySortUpdates };
