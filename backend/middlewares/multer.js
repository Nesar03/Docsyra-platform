import multer from "multer";
import crypto from "crypto";
import path from "path";

// unique file name so two uploads with the same original name never overwrite each other
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase()
    callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  }
})

const fileFilter = (req, file, callback) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return callback(null, true)
  callback(new Error('Only image files are allowed'))
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

export default upload
