const { slugify, comboKey } = require('../src/utils/slugify');

exports.seed = async function seed(knex) {
  await knex('skus').del();
  await knex('variants').del();
  await knex('products').del();

  const textiles = await knex('categories').where({ slug: 'textiles-embroidery' }).first();
  const pottery = await knex('categories').where({ slug: 'pottery' }).first();

  // --- Product 1: multiple variants, demonstrates CAT04 -----------------
  const [shawl] = await knex('products')
    .insert({
      name: 'Hand-Embroidered Ajrak Shawl',
      slug: slugify('Hand-Embroidered Ajrak Shawl'),
      description: 'Traditional block-printed Ajrak shawl, hand-finished by home-based artisans.',
      category_id: textiles.id,
      status: 'published',
      specifications: JSON.stringify({ material: 'Cotton', origin: 'Sindh' }),
    })
    .returning('*');

  const shawlSmallRed = { size: 'Small', color: 'Red' };
  const shawlLargeRed = { size: 'Large', color: 'Red' };
  // Intentionally NOT created: { size: 'Large', color: 'Green' } — this
  // combination is not offered by the artisan, so per CAT04 it must not
  // exist as a fake or zero-stock SKU. See docs/SPRINT_2.md.

  const [variantSmallRed] = await knex('variants')
    .insert({ product_id: shawl.id, option_values: JSON.stringify(shawlSmallRed), combo_key: comboKey(shawlSmallRed) })
    .returning('*');

  const [variantLargeRed] = await knex('variants')
    .insert({ product_id: shawl.id, option_values: JSON.stringify(shawlLargeRed), combo_key: comboKey(shawlLargeRed) })
    .returning('*');

  await knex('skus').insert([
    { variant_id: variantSmallRed.id, code: 'AJRAK-SHAWL-S-RED', price_minor_unit: 250000, currency: 'PKR', stock_quantity: 12 },
    { variant_id: variantLargeRed.id, code: 'AJRAK-SHAWL-L-RED', price_minor_unit: 290000, currency: 'PKR', stock_quantity: 5 },
  ]);

  // --- Product 2: single default variant ---------------------------------
  const [vase] = await knex('products')
    .insert({
      name: 'Blue Pottery Vase',
      slug: slugify('Blue Pottery Vase'),
      description: 'Hand-thrown and glazed blue pottery vase.',
      category_id: pottery.id,
      status: 'published',
      specifications: JSON.stringify({ material: 'Ceramic', height_cm: 25 }),
    })
    .returning('*');

  const vaseDefault = {};
  const [vaseVariant] = await knex('variants')
    .insert({ product_id: vase.id, option_values: JSON.stringify(vaseDefault), combo_key: comboKey(vaseDefault) })
    .returning('*');

  await knex('skus').insert({
    variant_id: vaseVariant.id,
    code: 'POTTERY-VASE-BLUE-STD',
    price_minor_unit: 180000,
    currency: 'PKR',
    stock_quantity: 8,
  });

  // --- Product 3: draft product, no SKU yet (demonstrates Q1) ------------
  await knex('products').insert({
    name: 'Sindhi Rilli Cushion Cover',
    slug: slugify('Sindhi Rilli Cushion Cover'),
    description: 'Patchwork Rilli cushion cover, still being priced by the artisan.',
    category_id: textiles.id,
    status: 'draft',
    specifications: JSON.stringify({ material: 'Cotton patchwork' }),
  });

  // A 4th SKU on a second cushion-cover-style product to satisfy the
  // "at least four valid SKUs" requirement without inventing a fifth product.
  const [cushionSold] = await knex('products')
    .insert({
      name: 'Sindhi Rilli Table Runner',
      slug: slugify('Sindhi Rilli Table Runner'),
      description: 'Patchwork Rilli table runner, ready for sale.',
      category_id: textiles.id,
      status: 'published',
      specifications: JSON.stringify({ material: 'Cotton patchwork' }),
    })
    .returning('*');

  const runnerDefault = {};
  const [runnerVariant] = await knex('variants')
    .insert({ product_id: cushionSold.id, option_values: JSON.stringify(runnerDefault), combo_key: comboKey(runnerDefault) })
    .returning('*');

  await knex('skus').insert({
    variant_id: runnerVariant.id,
    code: 'RILLI-RUNNER-STD',
    price_minor_unit: 120000,
    currency: 'PKR',
    stock_quantity: 0, // out-of-stock demonstration
  });
};
