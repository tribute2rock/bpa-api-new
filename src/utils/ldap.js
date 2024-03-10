const ldapjs = require('ldapjs');
const _ = require('lodash');
const { LDAP } = require('../config/index');
const { respond } = require('../utils/response');
const httpStatus = require('http-status');
const { x } = require('joi');
const user = require('../models/user');
const { default: axios } = require('axios');
const { Status } = require('../constants/response');

/**
 * <p>This method is used to parse user from the Active directory list. As the users
 * retrieved from the AD comes in buffer so this function parse that data into utf-8
 * and returns users easily understood by the end users.</p>
 * @method module:UserManagement#getUserFromADBuffer
 */
// function getUserFromADBuffer(user) {
//   const decodedUser = {};
//   user.attributes.map((attr, idx) => (decodedUser[attr.type] = Buffer.from(attr._vals[0], 'utf-8').toString()));
//   return decodedUser;
// }

/**
 * <p>This method is used to get all users from the Active directory of users called by getAllUsers</p>
 * <p>As the getAllUsers function gets the unformatted data and there might be some duplicate users, This function
 * is responsible for cleaning the users data.</p>
 * @method module:UserManagement#getUsers
 */
function getUsers(callback) {
  const nonDuplicateUsers = [];
  getAllUsers((users) => {
    users.forEach((user) => {
      const decodedUser = getUserFromADBuffer(user);
      const isContained = _.find(nonDuplicateUsers, {
        distinguishedName: decodedUser.distinguishedName,
      });
      if (!isContained) {
        decodedUser.telephoneNumber = decodedUser.mobile ? decodedUser.mobile : '';
        nonDuplicateUsers.push(decodedUser);
      }
    });
    callback(nonDuplicateUsers);
  });
}

/**
 * <p>This method is used to get all users from the Active directory for one suffix</p>
 * @method module:UserManagement#getUsersBySuffix
 */
async function getUsersBySuffix(client, suffix) {
  //var filter = `(&(objectCategory=person)(samaccountname=*))`;
  var filter = `(&(uid=*))`;
  const users = await new Promise((resolve, reject) => {
    client.search(suffix, { filter: filter, scope: 'sub' }, (err, searchRes) => {
      var searchList = [];
      if (err) {
        // result += "Search failed " + err;
        resolve(searchList);
      }
      searchRes.on('searchEntry', (entry) => {
        // result += "Found entry: " + entry + "\n";
        searchList.push(entry);
      });
      searchRes.on('error', (err) => {
        // result += "Search failed with " + err;
        resolve(searchList);
      });
      searchRes.on('end', (retVal) => {
        // result += "Search results length: " + searchList.length + "\n";
        resolve(searchList);
      }); // searchRes.on("end",...)
    }); // client.search
  });
  return users;
}

/**
 * <p>This method is used to get all users from the Active directory of users</p>
 * <p>As most of the bank has more than one OU groups so there is SUFFIX_ONE and SUFFIX_TWO to get the users.
 * If you want to get more than two then you have to use SUFFIX_THREE by creating it yourself.</p>
 * @method module:UserManagement#getAllUsers
 */
async function getAllUsers(callback) {
  var client = ldapjs.createClient({
    url: LDAP.LD_SERVER_URL,
  });
  client.on('error', (err) => {
    console.log(err);
    // handle connection error
  });
  let result;
  client.bind(LDAP.LD_USERNAME, LDAP.LD_PASSWORD, async function (err) {
    if (err) {
      result += 'Reader bind failed ' + err;
      callback([]);
    }
    result += 'Reader bind succeeded\n';
    //result += `LDAP filter: ${filter}\n`;
    const clientsOne = await getUsersBySuffix(client, LDAP.LD_SUFFIX_ONE);
    // const clientsTwo = await getUsersBySuffix(client, LDAP.suffixTwo);

//     //*********for nbb third suffix******** */
//     //   const clientsThree = await getUsersBySuffix(client, LDAP.suffixThree);
//     //   const clients = [...clientsOne, ...clientsTwo,...clientsThree];
//     //**********for nbb  */
    const clients = [...clientsOne, ...clientsTwo];
    callback(clients);
  }); // client.bind  (reader account)
}

/**
 * <p>This method is used by passport.js for the authentication of the users</p>
 * <p>This method is used for authentication of AD users by distinguishedName and password</p>
 * @method module:UserManagement#adUserSignInUsingLdap
 */
function signInLdap(distinguishedName, password, callback) {
  var result = ''; // To send back to the client
  var client = ldapjs.createClient({
    url: LDAP.LD_SERVER_URL,
  });
  client.on('error', (err) => {
    console.log(err);
    // handle connection error
  });
  client.bind(distinguishedName, password, function (err) {
    console.log('the result inside client.bind');
    if (err) {
      console.log('the result inside client.bind', err);
      result += 'Reader bind failed ' + err;
      callback(false);
      return;
    }
    callback(true);
  });
}

/**
 * <p>This method is used by passport.js for the authentication of the users</p>
 * <p>This method is used for authentication of AD users using username and password</p>
 * @method module:UserManagement#adUserSignIn
 */
function signIn(username, password, callback) {
  var client = ldap.createClient({
    url: LDAP.LD_SERVER_URL,
  });
  client.on('error', (err) => {
    console.log(err);
    // handle connection error
  });
  let result;
  client.bind(username, password, function (err, data) {
    if (err) {
      result = 'Bind failed ' + err;
    }
    result = 'Log on successful';
    callback(result);
  }); // client.bind
}

// Global function

// const client = ldapjs.createClient({
//   url: LDAP.LD_SERVER_URL,
// });
// client.on('error', (err) => {
//   console.log(err, "HTERE is error");
//   // handle connection error
// });

const LdapAuthentication = async (userName, password, mail) => {

  let result;
  let email;
  let userResultLists;
  var client = ldapjs.createClient({
      url: LDAP.LD_SERVER_URL,
    });
  if (userName && password) {
    userResultLists = await new Promise(async (resolve, reject) => {
      console.log(userName, "SDFDS")
      await client.bind(userName, password, async (err) => {
        if (err) {
          console.log('Error in New connnection' + err);
          await reject(err);
        } else {
          console.log('Ldap connnection success');
          result = {};
          // result = await SearchUser();
          if (mail) {
            console.log("LDAP : Find user")
            email = await getSingleUser(client, mail);
            await resolve(email);
          } else {
            console.log("LDAP : Mail not found")
            await resolve(result);
          }

          // AddUser();
          // UpdateUser('cn=shubham,ou=users,ou=system');
          // DeleteUser();
          // AddUsersToGroup('cn=Administrators,ou=groups,ou=system');
          // DeletUsersFromGroup('cn=Administrators,ou=groups,ou=system');
        }
      });
    });
    return userResultLists;
  }
  console.log("SUCCESS")
};

const LdapUserAuthentication = async (userName, password, mail) => {
  let singleUserAuth;
  let singleUserRes;
  const client = ldapjs.createClient({
      url: LDAP.LD_SERVER_URL,
    });
  if (userName && password) {
    singleUserAuth = await new Promise(async (resolve, reject) => {
      await client.bind(userName, password, async (err) => {
        if (err) {
          console.log('Error in New connnection' + err);
          resolve(err);
        } else {
          console.log('Ldap User connnection success');
          singleUserRes = await getSingleUser(client, mail);
          resolve(singleUserRes);
        }
      });
    });
    return singleUserAuth;
  }
};

const SearchUser = async () => {
  let output;
  let ldapUserList;
  let pushUserList = [];
  console.log(" USER search")

  const opts = {
    filter: '(objectClass=user)',
    scope: 'sub',
    attributes: [
      'uid',
      'sn',
      'cn',
      'sAMAccountName',
      'department',
      'mail',
      'physicalDeliveryOfficeName',
      'mobile',
      'ou',
      'st',
      'title',
    ],
    paged: {
      pageSize: 2000,
      pagePause: false,
    },
  };

  output = await new Promise((resolve, reject) => {

    client.search(LDAP.LD_SUFFIX_ONE, opts, async (err, res) => {
      if (err) {
        console.log('Error in New connnection' + err);
      } else {
        res.on('searchRequest', (searchRequest) => {
        });
        res.on('searchEntry', (entry) => {
          ldapUserList = entry.object;
          if (ldapUserList) {
            pushUserList.push(ldapUserList);
          }
        });
        res.on('page', (result, cb) => {

          
          console.log(result,"data");
          resolve(pushUserList);

        });

        res.on('searchReference', (referral) => {
          // console.log('referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('error: ' + err.message);
        });
        res.on('end', (result) => {
          // console.log('status: ' + result.status);
        });
      }
    });
  });
  console.log(pushUserList.length ,  "LISTSSDJ")
  const {email,cn,title,department}=pushUserList[0]
  console.log(email,cn,title,department);
  return await pushUserList;
};

const getSingleUser = async (client, mail) => {
  let output;
  let ldapUserList;
  let pushUserList = [];
console.log("GET SINGLE USER")
  const opts = {
    filter: `(sAMAccountName=${mail})`,
    scope: 'sub',
    attributes: [
      'uid',
      'sn',
      'cn',
      'department',
      'mail',
      'sAMAccountName',
      'physicalDeliveryOfficeName',
      'mobile',
      'ou',
      'st',
      'title',
    ],
    paged: {
      pageSize: 100,
      pagePause: false,
    },
  };
  
  output = await new Promise((resolve, reject) => {
    client.search(LDAP.LD_SUFFIX_ONE, opts, async (err, res) => {
      if (err) {
        console.log('Error in New connnection' + err);
      } else {
        res.on('searchRequest', (searchRequest) => {
          // console.log('searchRequest: ', searchRequest.messageID);
        });
        res.on('searchEntry', (entry) => {
          ldapUserList = entry.object;
          if (ldapUserList) {
            pushUserList.push(ldapUserList);
          }
        });
        res.on('page', (result, cb) => {
          // console.log('page end');
          resolve(pushUserList);
        });

        res.on('searchReference', (referral) => {
          // console.log('referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('error here: ' + err.message);
        });
        res.on('end', (result) => {
          // console.log('status: ' + result.status);
        });
      }
    });
  });
  return await pushUserList;
};

const SearchSingleUser = async (mail) => {
  let output;
  let ldapSingleUserList;
  let pushSingleUserList = [];
  console.log("SEARCH SINGLE USER")

  const opts = {
    filter: `(sAMAccountName=${mail})`,
    scope: 'sub',
    attributes: [
      'uid',
      'sn',
      'cn',
      'department',
      'employeeNumber',
      'mail',
      'sAMAccountName',
      'physicalDeliveryOfficeName',
      'mobile',
      'ou',
      'st',
      'title',
    ],
    paged: true,
  };
  const client = ldapjs.createClient({
    url: LDAP.LD_SERVER_URL,
  });
  output = await new Promise(async (resolve, reject) => {
    await client.search('ou=users,ou=system', opts, async (err, res) => {
      if (err) {
        console.log('Error in New connnection' + err);
      } else {
        res.on('searchRequest', (searchRequest) => {
          // console.log('searchRequest: ', searchRequest.messageID);
        });
        await res.on('searchEntry', async (entry) => {
          ldapSingleUserList = entry.object;

          if (ldapSingleUserList) {
            await pushSingleUserList.push(ldapSingleUserList);
          }
          await resolve(pushSingleUserList);
        });

        res.on('searchReference', (referral) => {
          // console.log('referral: ' + referral.uris.join());
        });
        res.on('error', (err) => {
          console.error('error: ' + err.message);
        });
        res.on('end', (result) => {
          // console.log('status: ' + result.status);
        });
      }
    });
  });
  return await pushSingleUserList;
};


const allLdapListCM = async(req, res) => {
  const result = await axios.get('http://localhost:9999/');
  const data = result.data || [];
  return res.json({ code: httpStatus.OK, status: Status.Success, msg: 'LDap user fetched successfully.', data });
  // console.log (result.data, "LENGHT")
}

module.exports = {
  getUsers,
  signIn,
  signInLdap,
  LdapAuthentication,
  LdapUserAuthentication,
  SearchUser,
  getSingleUser,
  SearchSingleUser,
  // AddUser,
  // UpdateUser,
  // DeleteUser,
  // AddUsersToGroup,
  // DeletUsersFromGroup,
  allLdapListCM,
};
