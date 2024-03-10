const path = require('path');
const { RequestValue, WorkflowFiles } = require('../models');
const MULTER_FILE_PATH = process.env.MULTER_FILE_PATH;

const getCustomerFilePath = async (filename) => {
  try {
    return path.resolve(__dirname, `${MULTER_FILE_PATH}/${filename}`);
  } catch (e) {
    return null;
  }
};

/**
 * Gets the original file name from request values.
 *
 * @param id
 * @param type
 * @returns {Promise<null|*>}
 */
const getCustomerOriginalFileName = async (id, type) => {
  let fileInfo;
  switch (type) {
    case 'workflow':
      fileInfo = await WorkflowFiles.findOne({
        where: {
          id,
        },
      });
      break;
    default:
      fileInfo = await RequestValue.findOne({
        where: {
          id,
        },
      });
  }
  if (fileInfo) {
    switch (type) {
      case 'request':
        fileInfo = JSON.parse(fileInfo.value);
        break;
      default:
        break;
    }
    return {
      originalName: type === 'request' ? fileInfo.originalname : fileInfo.originalName,
      fileName: fileInfo.filename,
    };
  }
  return null;
};

module.exports = {
  getCustomerFilePath,
  getCustomerOriginalFileName,
};
