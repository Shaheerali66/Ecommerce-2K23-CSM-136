const { slugify } = require('../src/utils/slugify');

exports.seed = async function seed(knex) {
  await knex('categories').del();

  const [handicrafts] = await knex('categories')
    .insert({ name: 'Handicrafts', slug: slugify('Handicrafts'), parent_id: null })
    .returning('*');

  await knex('categories').insert([
    { name: 'Textiles & Embroidery', slug: slugify('Textiles & Embroidery'), parent_id: handicrafts.id },
    { name: 'Pottery', slug: slugify('Pottery'), parent_id: null },
  ]);
};
