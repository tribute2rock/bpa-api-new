const bcryptJS = require('bcryptjs');
const { OtpEmailLogs } = require('../../models');

const EMAIL_STATUS = {
  FAILED: 'FAILED',
  SENT: 'SENT',
};

const EMAIL_TYPE = {
  EMAIL_REGISTER: 'REGISTER_REQUEST_VERIFICATION',
  EMAIL_SWIFT: 'SWIFT_REQUEST_VERIFICATION',
};

/**
 * Create email logs
 * @param  {...any} args
 */
module.exports.createRegistraionMailLogs = async (...args) => {
  const from = 'GLOBAL IME BANK';
  const to = args[0].to;
  const bodyFromForm = args[0].html;
  const body = findPassword(bodyFromForm)[0];
  let senderPassword = findPassword(body)[1];
  let salt = bcryptJS.genSaltSync(10);
  let hashedPassword = bcryptJS.hashSync(senderPassword, salt);
  const subject = args[0].subject;
  const text = args[0].text;
  const emailStatus = args.length > 1 ? EMAIL_STATUS.FAILED : EMAIL_STATUS.SENT;
  const cc = '';
  let errMessage = args[1];
  let type = EMAIL_TYPE.EMAIL_REGISTER;
  let isDeleted = 0;
  try {
    await OtpEmailLogs.create({
      sender: from,
      receiver: to,
      password: hashedPassword,
      subject: subject,
      body: body,
      text: text,
      emailStatus: emailStatus,
      cc: cc,
      message: errMessage,
      type: type,
      isDeleted: isDeleted,
    });
  } catch (err) {
    console.log(err.message);
  }
};

function findPassword(stringPassword) {
  const index = stringPassword.indexOf('PASSWORD:');
  const newString = stringPassword.slice(index);
  let i = newString.indexOf(':');
  let j = newString.indexOf('<');
  let password = newString.slice(i + 1, j);
  let a = stringWithOutWhiteSpace(password);
  let passwordHash = bcryptJS.hashSync(a, 10);
  // console.log(a, passwordHash);
  return [stringPassword.replace(a, passwordHash), a];
}

function stringWithOutWhiteSpace(s) {
  return s.trim();
}
