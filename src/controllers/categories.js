const httpStatus = require('http-status');
const { getPagination } = require('../utils/pagination');
const { getPagingData } = require('../utils/pagination');
const { categoryRepository } = require('../repositories');
const { categoryService } = require('../services');
const { respond } = require('../utils/response');
const { Category } = require('../models');
const category = require('../models/category');

/**
 * Returns all the categorys available in the system.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const all = async (req, res) => {
  let categoryList;
  if (req.query.page) {
    const { page, pageSize } = req.query;
    const { limit, offset } = getPagination(page, pageSize);
    let category;
    // for searching category and paginating the search
    if (req.query?.search) {
      201;
      const search = req.query.search;
      category = await categoryRepository.searchPaginate(limit, offset, search);
    } else {
      category = await categoryRepository.allPaginate(limit, offset);
    }
    categoryList = getPagingData(category, page, limit, offset);
  } else {
    // categoryList = await categoryRepository.all();
    categoryList = await Category.findAll({
      where: {
        otherServices: false,
      },
    });
  }
  return respond(res, httpStatus.OK, null, categoryList);
};

const categoryForms = async (req, res) => {
  const categories = await categoryRepository.categoryForms();
  return respond(res, httpStatus.OK, null, categories);
};
/**
 * Create a new category.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const store = async (req, res) => {
  const jsonParse = JSON.parse(req.body.Category);
  const name = jsonParse.name;
  const serviceUrl = jsonParse.serviceUrl;
  const OtherServices = req.body.OtherServices;
  if (req.files.length < 1 || name.trim() == '') {
    return respond(res, httpStatus.NOT_FOUND, 'Please provide category name and icon.');
  }

  const categoryName = await Category.findOne({ where: { isDeleted: false, name: name } });
  if (categoryName) {
    return respond(res, httpStatus.NOT_FOUND, 'Category already exists.');
  } else {
    await categoryService.store({
      name: name,
      parentId: req.body.parentId,
      iconFile: req.files[0].originalname,
      otherServices: OtherServices,
      otherServicesUrl: serviceUrl,
    });
    respond(res, httpStatus.CREATED, 'New category created successfully.');
  }
};

/**
 * Gets a specific category.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const single = async (req, res) => {
  const { id } = req.params;
  const category = await categoryRepository.find(id);
  if (!category) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified category.');
  }
  respond(res, httpStatus.CREATED, null, category);
};

/**
 * Updates a specific category and its permissions.
 *
 * @param req
 * @param res
 */
const update = async (req, res) => {
  const { id } = req.params;
  const jsonParse = JSON.parse(req.body.Category);
  const name = jsonParse.name;
  const otherServicesUrl = jsonParse.otherServicesUrl;
  const originalFile = req.body.originalFile;
  const newFile = req.files[0] ? req.files[0].originalname : null;
  const OtherServices = req.body.OtherServices;

  const category = await categoryRepository.find(id);
  if (!category) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified category.');
  }
  const updated = await categoryService.update(category.id, {
    name: name,
    parentId: req.body.parentId,
    iconFile: newFile ? newFile : originalFile,
    otherServices: OtherServices,
    otherServicesUrl: otherServicesUrl,
  });
  if (!updated) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not update the category.');
  }
  return respond(res, httpStatus.OK, 'Category updated successfully.');
};

/**
 * Soft deletes a specific category.
 *
 * @param req
 * @param res
 */
const destroy = async (req, res) => {
  const { id } = req.params;
  const category = await categoryRepository.find(id);
  if (!category) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified category.');
  }
  const deleted = await categoryService.destroy(id);
  if (!deleted) {
    return respond(res, httpStatus.INTERNAL_SERVER_ERROR, 'Could not delete the category.');
  }
  respond(res, httpStatus.OK, 'Category deleted successfully.');
};

/**
 * Toggles the status of a category.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const toggleStatus = async (req, res) => {
  const { id } = req.params;
  const category = await categoryRepository.find(id);
  if (!category) {
    return respond(res, httpStatus.NOT_FOUND, 'Could not find the specified form.');
  }
  await categoryRepository.updateStatus(category.id, {
    isActive: !category.isActive,
  });
  return respond(res, httpStatus.OK, 'Category status updated successfully.');
};

module.exports = {
  all,
  categoryForms,
  store,
  update,
  destroy,
  single,
  toggleStatus,
};
