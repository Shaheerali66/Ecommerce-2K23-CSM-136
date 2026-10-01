const db = require('../db');
const { slugify } = require('../utils/slugify');
const { ApiError } = require('../middleware/errorHandler');

const MAX_SPEC_KEYS = 20;

// Validation rule for the JSONB `specifications` column (see docs/SPRINT_2.md
// "Specifications" decision): must be a flat object, at most 20 keys, and
// every value must be a string or number (no nested objects/arrays).
function validateSpecifications(specifications) {
  if (specifications === undefined) return {};
  if (typeof specifications !== 'object' || specifications === null || Array.isArray(specifications)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'specifications must be a flat JSON object.');
  }
  const keys = Object.keys(specifications);
  if (keys.length > MAX_SPEC_KEYS) {
    throw new ApiError(422, 'VALIDATION_ERROR', `specifications may have at most ${MAX_SPEC_KEYS} keys.`);
  }
  for (const key of keys) {
    const value = specifications[key];
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new ApiError(422, 'VALIDATION_ERROR', `specifications.${key} must be a string or number.`);
    }
  }
  return specifications;
}

async function list(req, res, next) {
  try {
    const products = await db('products').orderBy('created_at', 'desc');
    return res.status(200).json({ data: products });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description = null, category_id: categoryId, specifications, artisan_user_id: artisanUserId = null } = req.body;

    if (!name) throw new ApiError(422, 'VALIDATION_ERROR', 'name is required.');
    if (!categoryId) throw new ApiError(422, 'VALIDATION_ERROR', 'category_id is required.');

    const category = await db('categories').where({ id: categoryId }).first();
    if (!category) throw new ApiError(422, 'VALIDATION_ERROR', 'category_id does not reference an existing category.');

    const specs = validateSpecifications(specifications);

    // Products are always created as drafts — CAT01/CAT02: a draft product
    // may legitimately have no SKU yet (see docs/SPRINT_2.md Q1).
    const [product] = await db('products')
      .insert({
        name,
        slug: slugify(name),
        description,
        category_id: categoryId,
        artisan_user_id: artisanUserId,
        specifications: JSON.stringify(specs),
        status: 'draft',
      })
      .returning('*');

    return res.status(201).json({ data: product });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, category_id: categoryId, status, specifications } = req.body;

    const existing = await db('products').where({ id }).first();
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Product not found.');

    const updates = { updated_at: db.fn.now() };

    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (description !== undefined) updates.description = description;
    if (specifications !== undefined) updates.specifications = JSON.stringify(validateSpecifications(specifications));

    if (categoryId !== undefined) {
      const category = await db('categories').where({ id: categoryId }).first();
      if (!category) throw new ApiError(422, 'VALIDATION_ERROR', 'category_id does not reference an existing category.');
      updates.category_id = categoryId;
    }

    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'status must be draft, published, or archived.');
      }

      // A published product must have at least one sellable (active,
      // in-stock-capable) SKU — see docs/SPRINT_2.md Q1.
      if (status === 'published') {
        const sellableSku = await db('skus')
          .join('variants', 'skus.variant_id', 'variants.id')
          .where('variants.product_id', id)
          .andWhere('skus.is_active', true)
          .first();

        if (!sellableSku) {
          throw new ApiError(422, 'PUBLISH_REQUIRES_SKU', 'A product cannot be published without at least one active SKU.');
        }
      }

      updates.status = status;
    }

    const [product] = await db('products').where({ id }).update(updates).returning('*');
    return res.status(200).json({ data: product });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update, validateSpecifications };
