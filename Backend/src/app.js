const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use(cors());
  // Needed for base64 uploads (e.g., student ID card PDFs/images)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Serve uploaded files statically
  const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
  app.use("/uploads", express.static(uploadsDir));

  app.get("/", (req, res) => {
    res.json({ success: true, message: "UniHall API" });
  });

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
