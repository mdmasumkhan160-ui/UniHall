function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Body parser uses this for JSON payload limit errors
  if (err.type === "entity.too.large" || err.statusCode === 413) {
    status = 413;
    message = "Upload is too large. Please use a smaller file.";
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
