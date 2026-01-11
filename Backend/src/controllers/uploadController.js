const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function ensureUploadsDir() {
  const dir = path.resolve(__dirname, '..', '..', 'uploads')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// Accepts { files: [{ fieldId, fileName, contentType, data }] } where data is base64 string
async function uploadBase64(req, res, next) {
  try {
    const { files } = req.body || {}
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' })
    }

    const uploadsDir = ensureUploadsDir()
    const results = []

    for (const f of files) {
      if (!f || !f.data) continue
  const id = crypto.randomUUID()
      const ext = (f.fileName && path.extname(f.fileName)) || ''
      const safeName = `${id}${ext}`
      const filePath = path.join(uploadsDir, safeName)

      const base64 = String(f.data).replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64, 'base64')
      fs.writeFileSync(filePath, buffer)

      results.push({
        fieldId: f.fieldId || null,
        url: `/uploads/${safeName}`,
        name: f.fileName || safeName,
        type: f.contentType || 'application/octet-stream'
      })
    }

    return res.json({ success: true, files: results })
  } catch (err) {
    next(err)
  }
}

module.exports = { uploadBase64 }
