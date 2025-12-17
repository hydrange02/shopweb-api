const validate = (schema, source = "body") => (req, _res, next) => {
  try {
    const data = schema.parse(req[source]);
    req[source] = data; // đã parse & transform
    next();
  } catch (err) {
    err.status = 400; // Bad Request
    next(err);
  }
};

module.exports = { validate };