/**
 * @param page
 * @param size
 * @returns {{offset: number, limit: number}}
 */

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

/**
 * @param data
 * @param page
 * @param limit
 * @param offset
 * @returns {{pagingData, totalItems, totalPages: number, currentPage: number}}
 */
const getPagingData = (data, page, limit, offset) => {
  const { count: totalItems, rows: pageData } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, pageData, totalPages, currentPage, offset };
};

module.exports = {
  getPagination,
  getPagingData,
};
