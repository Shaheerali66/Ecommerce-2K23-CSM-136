const db = require('../db');
const { comboKey } = require('../utils/slugify');
const { ApiError } = require('../middleware/errorHandler');

// Finds an existing variant with this exact option combination under the
// product, or creates one. Enforces CAT04 (no fake/duplicate combinations)
// via the DB-level unique(product_id, combo_key) constraint as the source
// of truth; this lookup just avoids unnecessary insert attempts.
async function findOrCreateVariant(trx, productId, optionValues = {}) {
  const key = comboKey(optionValues);

  const existing = await trx('variants').where({ product_id: productId, combo_key: key }).first();
  if (existing) return existing;

  const [variant] = await trx('variants')
    .insert({ product_id: productId, option_values: JSON.stringify(optionValues), combo_key: key })
    .returning('*');
  return variant;
}

async function createForProduct(req, res, next) {
  const trx = await db.transaction();
  try {
    const { id: productId } = req.params;
    const { variant_id: variantId, option_values: optionValues = {}, code, price_minor_unit: priceMinorUnit, currency = 'PKR', stock_quantity: stockQuantity = 0 } = req.body;

    if (!code) throw new ApiError(422, 'VALIDATION_ERROR', 'code is required.');
    if (!Number.isInteger(priceMinorUnit) || priceMinorUnit <= 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'price_minor_unit must be a positive integer (minor currency units).');
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'stock_quantity must be a non-negative integer.');
    }

    const product = await trx('products').where({ id: productId }).first();
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Product not found.');

    let variant;
    if (variantId) {
      variant = await trx('variants').where({ id: variantId, product_id: productId }).first();
      if (!variant) throw new ApiError(422, 'VALIDATION_ERROR', 'variant_id does not belong to this product.');
    } else {
      variant = await findOrCreateVariant(trx, productId, optionValues);
    }

    const [sku] = await trx('skus')
      .insert({
        variant_id: variant.id,
        code,
        price_minor_unit: priceMinorUnit,
        currency,
        stock_quantity: stockQuantity,
      })
      .returning('*');

    await trx.commit();
    return res.status(201).json({ data: { sku, variant } });
  } catch (err) {
    await trx.rollback();
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { price_minor_unit: priceMinorUnit, stock_quantity: stockQuantity, is_active: isActive } = req.body;

    const existing = await db('skus').where({ id }).first();
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'SKU not found.');

    const updates = { updated_at: db.fn.now() };

    if (priceMinorUnit !== undefined) {
      if (!Number.isInteger(priceMinorUnit) || priceMinorUnit <= 0) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'price_minor_unit must be a positive integer.');
      }
      updates.price_minor_unit = priceMinorUnit;
    }

    if (stockQuantity !== undefined) {
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'stock_quantity must be a non-negative integer.');
      }
      updates.stock_quantity = stockQuantity;
    }

    if (isActive !== undefined) updates.is_active = isActive;

    const [sku] = await db('skus').where({ id }).update(updates).returning('*');
    return res.status(200).json({ data: sku });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createForProduct, update, findOrCreateVariant };
