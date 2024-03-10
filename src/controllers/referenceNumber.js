const httpStatus = require('http-status');
const { respond } = require('../utils/response');
const { ReferenceNumber } = require('../models');
const db = require('../config/database');

// Scheduler to reset reference number generation from 00001
const resetReferenceNumber = async () => {
  await db.query(`
  INSERT INTO referenceNumbers 
	        (isDeleted, unique_number, reference_Key, reference_Number, createdAt, updatedAt)
   VALUES 
          (0, 0, 'APG', 'APG0123NPR0000', getdate(), getdate()),
          (0, 0, 'BBG', 'BBG0123NPR0000', getdate(), getdate()),
          (0, 0, 'SCG', 'SCG0123NPR0000', getdate(), getdate()),
          (0, 0, 'CL', 'CL0123NPR0000', getdate(), getdate()),
          (0, 0, 'PBG', 'PBG0123NPR0000', getdate(), getdate());`);
};

const oldReference = async (gt, resData) => {
  const refNumber = await ReferenceNumber.findOne({ where: { reference_Key: gt }, order: [['id', 'DESC']] });
  preyy = refNumber.updatedAt.getFullYear().toString().substr(-2);
  let today = new Date();
  let yyyy = today.getFullYear().toString().substr(-2);
  let startnumber=refNumber.unique_number;
  //if (yyyy==preyy)
  // {
  //   startnumber = refNumber.unique_number;

  //  }
  
  if (refNumber && gt) {
    var newRef = '';
    if (resData.solId.length > 2) {
      newRef = gt + resData.solId + yyyy + resData.currency + String(parseInt(startnumber) + 1).padStart(4, '0');
    } else {
      newRef = gt + resData.solId + yyyy + resData.currency + String(parseInt(startnumber) + 1).padStart(5, '0');
    }
    const checkRequest = await ReferenceNumber.findOne({
      where: { requestId: resData.requestId },
      order: [['id', 'DESC']],
    });
    if (checkRequest) {
      return checkRequest.reference_Number;
    }
    //   const checkRef = await ReferenceNumber.findOne({
    //     where: { reference_Key: gt, unique_number: parseInt(refNumber.unique_number) + 1, reference_Number:  },
    //     order: [['id', 'DESC']],
    //   });
    //   if (checkRef) {
    //     return false;
    //   }
    await ReferenceNumber.create({
      unique_number: parseInt(startnumber) + 1,
      reference_Key: refNumber.reference_Key,
      reference_Number: newRef,
      requestId: resData.requestId,
    });
    return newRef;
  } else {
    return '10001';
  }
};

const validInput = (data) => {
  if (data.currency.trim() && data.typeOfGurantee.trim() && data.solId.trim()) {
    return true;
  } else {
    return false;
  }
};

const generateRefNumber = async (req, res) => {
  const data = req.body.value;
  const resData = JSON.parse(data);

  const result = await referenceNumber(resData);
  return res.json(result);
};

// const registerRefNumber = async (data) => {
//   // const data = req.body.value;
//   const resData = JSON.parse(data);

//   const result = await referenceNumber(resData, 'create');
//   return result;
// }

const referenceNumber = async (resData) => {
  if (!validInput(resData)) {
    return { msg: 'Provided Reference Number data is not valid', data: '' };
  }

  let reference_Number = '';

  switch (resData.typeOfGurantee) {
    case 'Bid Bond':
      reference_Number = await oldReference('BBG', resData);
      break;
    case 'Advance Payment':
      reference_Number = await oldReference('APG', resData);
      break;
    case 'Supply Credit Guarantee':
      reference_Number = await oldReference('SCG', resData);
      break;
    case 'Line of Credit Commitment':
      reference_Number = await oldReference('CL', resData);
      break;
    case 'Performance Bond':
    case 'Custom Guarantee':
      reference_Number = await oldReference('PBG', resData);
      break;
    default:
      break;
  }
  if (!reference_Number) {
    return { msg: 'Please generate the reference number.', data: reference_Number };
  }
  return { msg: 'Reference Number generated sucessfully', data: reference_Number };
};

const getReferenceNo = async (req, res) => {
  let typeOfGurantee = req.query.typeOfGurantee;
  console.log(typeOfGurantee, 'typeOfGurantee');
  switch (typeOfGurantee) {
    case 'Bid Bond':
      console.log('I own a Bid Bond');
      reference_Key = 'BBG';
      break;
    case 'Performance Bond':
      console.log('I own a Performance Bond');
      reference_Key = 'PBG';
      break;
    case 'Custom Guarantee':
      console.log('I own a Custom Guarantee');
      reference_Key = 'BBG';
      break;
    case 'Advance Payment':
      console.log('I own a Advance Payment');
      reference_Key = 'APG';
      break;
    case 'Supply Credit Guarantee':
      console.log('I own a Supply Credit Guarantee');
      reference_Key = 'SCG';
      break;
    case 'Line of Credit Commitment':
      console.log('I own a Line of Credit Commitment');
      reference_Key = 'CL';
      break;
    default:
      console.log("I don't own");
      break;
  }
  console.log('resdata', reference_Key);
  const RefNumber = await ReferenceNumber.findOne({
    where: {
      reference_Key: reference_Key,
      // reference_Number:params.id2
    },
    order: [['id', 'DESC']],
  });
  // console.log(RefNumber,"ReferenceNumber");
  if (RefNumber) {
    return res.json({ status: 'success', msg: 'ref no fetched sucessful', data: RefNumber });
  } else {
    return res.json({ status: 'failed', msg: 'already exist', data: 10001 });
  }
};

module.exports = {
  generateRefNumber,
  resetReferenceNumber,
};
