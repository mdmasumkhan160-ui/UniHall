const mysql = require('mysql2/promise')

let pool

function getConfig() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
  } = process.env

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('Database configuration is incomplete. Check environment variables.')
  }

  return {
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
}

async function initPool() {
  if (!pool) {
    pool = mysql.createPool(getConfig())
  }
  return pool
}

async function testConnection() {
  const currentPool = await initPool()
  const connection = await currentPool.getConnection()
  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}

module.exports = {
  initPool,
  testConnection
}
