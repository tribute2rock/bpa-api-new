const fs = require('fs');
const { resolve } = require('path');

module.exports.userAuthorizationEmailTemplate = (data) => {
  const html =
    `<p>Dear ${data.name},</p>` +
    `<br/>` +
    `<p>Greetings from Global IME Bank!</p>` +
    `<p>Your Corporate registration login credential has been created/approved by bank with below information: </p>` +
    `<p>EMAIL: ${data.email} </p>` +
    `<strong>PASSWORD: ${data.password} </strong>` +
    `<br/>` +
    `<strong>Please do not share this password to any person.</strong>` +
    `<br/>` +
    `Thanking for choosing Global IME Bank Ltd.` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  return {
    to: data.email,
    subject: 'Global IME Bank - BPM Login Credentials',
    text: '',
    html: html,
  };
};

const ccListForSwift = [
  'Binod.Lamsal@gibl.com.np',
  'Shashi.Sharma@gibl.com.np',
  'Suman.Dahal@gibl.com.np',
  'Prakrishta.Shrestha@gibl.com.np',
  'Nishama.Pradhanang@gibl.com.np',
  'Aashna.Shrestha@gibl.com.np',
  'Bhuwan.Bhandari@gibl.com.np',
  'subhalaxmi.dangol@gibl.com.np',
  'Pooja.Sharma@gibl.com.np',
  'Jasmine.Pradhan@gibl.com.np',
  'Manish1.Bhandari@gibl.com.np',
];

module.exports.sendEmailTemplates = (data, subject) => {
  const html =
    `<p>Dear Sir/Madam,</p>` +
    `<br/>` +
    `<p>Please find the attached herewith soft copy and digitally signed LC copies for its immediate transmission.</p>` +
    `<p>Please mark the checkbox as "Uploaded to Swift" in BPM platform after completing its transmission.</p>` +
    `<p>Please revert back to CTO department via Email if there is any issue on its transmission.</p>` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  return {
    to: 'swift@gibl.com.np',
    subject: `LC/TRANSMIT_MT700_LC NUMBER: ${subject}`,
    text: '',
    html: html,
    cc: ccListForSwift,
    attachments: data.map((dta) => {
      return {
        path: dta.file,
        filename: dta.filename,
      };
    }),
  };
};

module.exports.customerPasswordResetEmailTemplate = (data) => {
  const html =
    `<p>Dear ${data.name},</p>` +
    `<br/>` +
    `Your reset password is:  </p>` +
    `<strong> ${data.password} </strong>` +
    `<br/>` +
    `<strong>Please change your password.</strong>` +
    `<br/>` +
    `Sincerely Yours,` +
    `<br/>` +
    `Global Bank .` +
    `</p>`;

  return {
    to: data.email,
    subject: 'Global Bank - BPM Login Credentials',
    text: '',
    html: html,
  };
};

module.exports.sendActionTemplates = (data) => {
  const html = '<p></p>';

  return {
    to: data.email,
    subject: 'Global Bank - BPM Login Credentials',
    text: '',
    html: html,
  };
};

//FormName, requestKey, customerEmail
module.exports.requestReturnEmailTemplate = (data) => {
  const html =
    `<p>Dear Sir/Madam,</p>` +
    `<br/>` +
    `<p>Greetings from Global IME Bank!</p>` +
    `<p>Your application ${data.key} has been returned to you with following comments, </p>` +
    `<br/>` +
    `${data?.comment}` +
    `<br/>` +
    `<p>Please address the comments/shortfalls and revert back to us for further process.</p>` +
    `<br/>` +
    `<p>Please stay with us.</p>` +
    `<br/>` +
    `Thanking for choosing Global IME Bank Ltd.` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  return {
    to: data.email,
    subject: 'Global IME Bank - ' + data.form + '_' + data.key + '_' + data.customer,
    text: '',
    html: html,
  };
};

module.exports.requestApproveEmailTemplate = (data) => {
  const html =
    `<p>Dear Sir/Madam,</p>` +
    `<br/>` +
    `<p>Greetings from Global IME Bank!</p>` +
    `<p>Your application ${data.key} has been successfully processed. Please collect your final copy of LC/BG from your respective branch. </p>` +
    `<br/>` +
    `Thanking for choosing Global IME Bank Ltd.` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  return {
    to: data.email,
    subject: 'Global IME Bank - ' + data.form + '_' + data.key + '_' + data.customer,
    text: '',
    html: html,
  };
};

module.exports.requestReturnEmailTemplateBranch = (data) => {
  let requestLink = `http://localhost:8080/#/requests/view/${data.request}`;
  const html =
    `<p>Dear Sir/Madam,</p>` +
    `<p>Greetings from Global IME Bank!</p>` +
    `<p>Your online LC/BG application ${data.key} is returned with following comments  </p>` +
    `<br/>` +
    `${data?.comment}` +
    `<p>Please comply all comment and reply to us for further process, Please stay with us</p>` +
    `<p>Click on this link to open the request:</p>` +
    `<a href="${requestLink}">${requestLink}</a>` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  return {
    to: data.email,
    subject: '' + data.form + '_' + data.key + ' : Returned ',
    text: '',
    html: html,
  };
};

module.exports.requestApproveEmailTemplateBranch = (data) => {
  let requestLink = `http://localhost:8080/#/requests/view/${data.request}`;
  let html =
    `<p>Dear Sir/Madam,</p>` +
    `<br/>` +
    `<p>Greetings from Global IME Bank!</p>` +
    `<p>Your application ${data.key} has been successfully processed. Please collect your final copy of LC from Conductor module at the end of the day. </p>` +
    `<p>Click on this link to open the request:</p>` +
    `<a href="${requestLink}">${requestLink}</a>` +
    `<br/>` +
    `Best Regards,` +
    `<br/>` +
    `Trade Operation Team` +
    `</p>`;

  if (data.id == 4 || data.id == 2) {
    html =
      `<p>Dear Sir/Madam,</p>` +
      `<br/>` +
      `<p>Greetings from Global IME Bank!</p>` +
      `<p>Your application ${data.key} has been successfully processed. Please download the final copy of Bank Guarantee from approved section of BPA module. </p>` +
      `<p>Click on this link to open the request:</p>` +
      `<a href="${requestLink}">${requestLink}</a>` +
      `<br/>` +
      `Best Regards,` +
      `<br/>` +
      `Trade Operation Team` +
      `</p>`;
  }

  return {
    to: data.email,
    subject: '' + data.form + '_' + data.key + ' : Approved ',
    text: '',
    html: html,
  };
};
