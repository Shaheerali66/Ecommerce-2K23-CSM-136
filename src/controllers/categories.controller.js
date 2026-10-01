const db = require('../db');
const { slugify } = require('../utils/slugify');
const { ApiError } = require('../middleware/errorHandler');

// Walks the parent chain of `candidateParentId` and throws if `categoryId`
// appears in it — i.e. prevents a category from becoming its own ancestor.
async function assertNoCycle(categoryId, candidateParentId) {
  if (!candidateParentId) return;
  if (categoryId && Number(candidateParentId) === Number(categoryId)) {
    throw new ApiError(422, 'CYCLIC_CATEGORY', 'A category cannot be its own parent.');
  }

  let currentId = candidateParentId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) break; // corrupt data safety net
    visited.add(currentId);

    if (categoryId && Number(currentId) === Number(categoryId)) {
      throw new ApiError(422, 'CYCLIC_CATEGORY', 'This parent assignment would make the category its own ancestor.');
    }

    const parent = await db('categories').where({ id: currentId }).first('parent_id');
    currentId = parent ? parent.parent_id : null;
  }
}

async function list(req, res, next) {
  try {
    const categories = await db('categories').orderBy(['parent_id', 'name']);
    return res.status(200).json({ data: categories });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, parent_id: parentId = null } = req.body;
    if (!name) throw new ApiError(422, 'VALIDATION_ERROR', 'name is required.');

    await assertNoCycle(null, parentId);

    const [category] = await db('categories')
      .insert({ name, slug: slugify(name), parent_id: parentId })
      .returning('*');

    return res.status(201).json({ data: category });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, parent_id: parentId } = req.body;

    const existing = await db('categories').where({ id }).first();
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Category not found.');

    if (parentId !== undefined) {
      await assertNoCycle(id, parentId);
    }

    const updates = { updated_at: db.fn.now() };
    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (parentId !== undefined) updates.parent_id = parentId;

    const [category] = await db('categories').where({ id }).update(updates).returning('*');
    return res.status(200).json({ data: category });
  } catch (err) {
    return next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const { id } = req.params;
    const [category] = await db('categories')
      .where({ id })
      .update({ is_active: false, updated_at: db.fn.now() })
      .returning('*');

    if (!category) throw new ApiError(404, 'NOT_FOUND', 'Category not found.');
    return res.status(200).json({ data: category });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update, deactivate, assertNoCycle };
