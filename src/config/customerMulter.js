const multer = require('multer');
const path = require('path');
const config = require('.');

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, config.BANK_ASSETS_DIRECTORY));
    cb(null, path.resolve(__dirname, config.CUSTOMER_ASSETS_DIRECTORY));
    cb(null, path.resolve(__dirname, config.INTERNAL_ASSETS_DIRECTORY));
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const customerUploader = multer({ storage: fileStorageEngine });

module.exports = customerUploader;
