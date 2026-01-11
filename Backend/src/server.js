require("dotenv").config();

const createApp = require("./app");
const { testConnection } = require("../config/db");
const {
  startAllocationExpiryScheduler,
} = require("./services/allocationExpiryService");

const PORT = Number(process.env.PORT) || 5000;
const app = createApp();

async function start() {
  try {
    await testConnection();
    console.log("MySQL connection established");
  } catch (err) {
    console.error("Unable to connect to MySQL:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    startAllocationExpiryScheduler();
  });
}

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
  process.exit(1);
});
