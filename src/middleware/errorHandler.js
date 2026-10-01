// Normalizes thrown errors (including Postgres unique/FK violations) into a
// consistent JSON error shape instead of leaking a stack trace to clients.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.status) {
    return res.status(err.status).json({ error: { code: err.code || 'ERROR', message: err.message } });
  }

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE',
        message: 'A record with this unique value already exists (duplicate slug or SKU code).',
        detail: err.detail,
      },
    });
  }

  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res.status(409).json({
      error: { code: 'FOREIGN_KEY_VIOLATION', message: 'This action would violate a data relationship.', detail: err.detail },
    });
  }

  // Postgres check_violation (e.g. negative stock, non-positive price)
  if (err.code === '23514') {
    return res.status(422).json({
      error: { code: 'CONSTRAINT_VIOLATION', message: 'This value violates a data integrity rule.', detail: err.detail },
    });
  }

  console.error(err); // eslint-disable-line no-console
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { errorHandler, ApiError };
