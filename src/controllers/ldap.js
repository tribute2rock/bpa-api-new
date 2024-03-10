const httpStatus = require('http-status');
const { respond } = require('../utils/response');
const { Status } = require('../constants/response');
const { LdapAuthentication, LdapUserAuthentication } = require('../utils/ldap');
const { LDAP } = require('../config/index');
const { ldapRepository } = require('../repositories');
const ad = require('../external/ad');
const { User } = require('../models');
const axios = require('axios');

/**
 * Returns all the users from AD.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const users = async (req, res) => {
  const adUsers = await ad.all();
  const dbUsers = await User.findAll({
    where: {
      isDeleted: false,
    },
  });
  const registeredUsers = Array.from(dbUsers, (item) => {
    return item.email;
  });
  const availableUsers = adUsers.filter((item) => {
    return !registeredUsers.includes(item.email);
  });
  return respond(res, httpStatus.OK, null, availableUsers);
};

/**
 * Returns all the branches from AD.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const branches = async (req, res) => {
  const data = await ldapRepository.branches();
  return respond(res, httpStatus.OK, null, data);
};

/**
 * Returns all the provinces from AD.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const provinces = async (req, res) => {
  const data = await ldapRepository.provinces();
  return respond(res, httpStatus.OK, null, data);
};

/**
 * Syncs all the branches from AD to database.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const syncBranches = async (req, res) => {
  await ldapRepository.syncBranches();
  return respond(res, httpStatus.OK, 'Branches synced successfully.');
};

/**
 * Syncs all the provinces from AD to database.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const syncProvinces = async (req, res) => {
  await ldapRepository.syncProvinces();
  return respond(res, httpStatus.OK, 'Provinces synced successfully.');
};

/**
 * Returns resigned list of users from AD.
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const resUsers = async (req, res) => {
  const resUsers = await ad.resignUsers();
  return res.json(resUsers);
};
//Global//
const getAllUsers = async (req, res) => {
  const result = await axios.get('http://localhost:8080/api/v1/global-staff');
  const data = result.data || [];
  return res.json({ code: httpStatus.OK, status: Status.Success, msg: 'LDap user fetched successfully.', data });

  // const userName = await LDAP.LD_USERNAME;
  // const passWord = await LDAP.LD_PASSWORD;

  // if ((userName, passWord)) {
  //   let data = await LdapAuthentication(userName, passWord);
  //   if (data.length > 0) {
  //     return res.json({ code: httpStatus.OK, status: Status.Success, msg: 'LDap user fetched successfully.', data });
  //     // return respond(res, httpStatus.OK, ''LDap user synced successfully.');
  //   } else {
  //     return res.json('error');
  //   }
  // }
};

const adLogin = async (req, res) => {
  const adminUserName = LDAP.LD_USERNAME;
  const adminPassWord = LDAP.LD_PASSWORD;
  const usName = req.body.UserName;
  const passWord = req.body.Password;
  if ((adminUserName, adminPassWord, usName)) {
    let mainData = await LdapAuthentication(adminUserName, adminPassWord, usName);

    // if(mainData && passWord == 'admin@123'){
    //   return res.json({
    //     code: httpStatus.OK,
    //     status: Status.Success,
    //     msg: 'LDap Single user fetched successfully.',
    //     mainData,
    //   });
    // }
    if ((mainData, passWord)) {
      let data = await LdapUserAuthentication(mainData[0]?.dn, passWord, mainData[0]?.sAMAccountName);
      if (data.length > 0) {
        return res.json({
          code: httpStatus.OK,
          status: Status.Success,
          msg: 'LDap Single user fetched successfully.',
          data,
        });
        // return respond(res, httpStatus.OK, 'LDap Single user synced successfully.');
      } else {
        return res.json('error');
      }
    } else {
      return res.json('error');
    }
  } else {
    return res.json({
      code: httpStatus.StatusForbidden,
      status: Status.Failed,
      msg: 'Ldap connection error test',
    });
  }
};

module.exports = {
  users,
  branches,
  provinces,
  syncBranches,
  syncProvinces,
  resUsers,
  getAllUsers,
  adLogin,
};
