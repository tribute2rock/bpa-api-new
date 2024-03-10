const axios = require('axios');
const mocks = require('../mocks');
const { respond } = require('../utils/response');

const url = process.env.AD_AUTHENTICATION;
const urlStaff = process.env.STAFF_LIST;

/**
 * Gets all the users.
 *
 * @returns {Promise<[]>}
 */
const all = async (params) => {
  try {
    const response = await axios.get(urlStaff, {});
    const formattedResponse = [];
    await response?.data?.data.map((item) => {
      const newItem = {
        name: item?.cn,
        employeeCD: item?.username,
        dob: '',
        email: item?.mail || '',
        fatherName: '',
        permanentAddress: '',
        mobile: item?.mobile,
        localAddress: '',
        jobType: '',
        department: item?.department,
        position: item?.title,
        domainName: item?.DOMAIN_NAME,
        retirementDt: '',
        accountNo: item?.ACCOUNT_NO,
        title: '',
        branch: item?.physicalDeliveryOfficeName,
        solId: item?.company,
        userId: item?.sAMAccountName,
      };
      formattedResponse.push(newItem);
      return true;
    });
    return formattedResponse;
  } catch (error) {
    return [];
  }
};

/**
 * Find a specific user from the all users list.
 *
 * @returns {Promise<*>}
 * @param needle
 * @param attribute
 */
const find = async (needle, attribute = 'email') => {
  const users = await all();
  return users.find((item) => {
    if (attribute == 'email') {
      return item[attribute].toLowerCase() === needle.toLowerCase();
    }
    return item[attribute] === needle;
  });
};

/**
 * Authenticates a user.
 *
 * @param username
 * @param password
 * @returns {Promise<{data: {fatherName: string, solId: string, retirementDt: null, mobile: string, employeeCD: string, title: null, branch: string, userId: string, dob: string, localAddress: string, domainName: string, accountNo: string, name: string, permanentAddress: string, position: string, jobType: string, department: string, email: string}, message: (string|null), status: boolean}>}
 */
// eslint-disable-next-line no-unused-vars
const authenticate = async (username, password) => {
  try {
    // TODO: remove on production
    let user;
    if (password === 'admin@123') {
      user = await find(username, 'userId');

      return {
        status: true,
        message: 'User authenticated.',
        data: user,
      };
    } else {
      const response = await axios.post(url, {
        UserName: username,
        Password: password,
      });
      user = response.data;
    }
    if (user) {
      let returnData;
      const response = user;
      return (returnData = {
        status: true,
        message: response.msg ? response.msg : null,
        data: {
          name: response.data[0].cn,
          employeeCD: response.data[0].sAMAccountName,
          dob: 'empty',
          email: response.data[0].mail,
          fatherName: 'empty',
          permanentAddress: 'empty',
          mobile: response.data[0].mobile,
          localAddress: 'empty',
          jobType: response.data[0].title,
          department: response.data[0].department,
          position: response.data[0].title,
          domainName: 'empty',
          retirementDt: 'empty',
          accountNo: 'empty',
          title: 'empty',
          branch: response.data[0].physicalDeliveryOfficeName,
          solId: response.data[0].sAMAccountName,
          userId: response.data[0].sAMAccountName,
        },
      });
    }
    return {
      status: false,
      message: 'Username or password not found.',
    };
  } catch (error) {
    return {
      status: false,
      message: 'Error connecting with authentication server.',
    };
  }
};

module.exports = {
  authenticate,
  find,
  all,
};
