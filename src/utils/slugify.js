function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Deterministic key for a set of variant option values, e.g.
// { size: 'M', color: 'red' } -> 'color=red&size=m'
function comboKey(optionValues = {}) {
  return Object.keys(optionValues)
    .sort()
    .map((key) => `${key.toLowerCase()}=${String(optionValues[key]).toLowerCase()}`)
    .join('&');
}

module.exports = { slugify, comboKey };
