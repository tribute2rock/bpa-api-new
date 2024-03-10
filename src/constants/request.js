const actions = {
  Forward: 1,
  Return: 2,
  Approve: 3,
  Pick: 4,
  Refer: 5,
  Reassign: 6,
  SubForm: 7,
  Close: 8,
  RollBack: 9,
  Verification: 10,
  Comment: 11,
};
const actionName = {
  Forward: 'Forward',
  Return: 'Return',
  Approve: 'Approve',
  Reject: 'Reject',
  Pick: 'Pick',
  Refer: 'Refer',
  Reassign: 'Reassign',
  SubForm: 'SubForm',
  Close: 'Close',
  RollBack: 'RollBack',
  Verification: 'Verification',
  Comment: 'Comment',
};

const status = {
  Pending: 1,
  Processing: 2,
  Returned: 3,
  Completed: 4,
  Drafts: 5,
  Closed: 6,
};

module.exports = {
  actions,
  status,
  actionName,
};
