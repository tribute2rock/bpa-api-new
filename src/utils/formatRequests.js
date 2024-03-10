const formatRequests = async (data) => {
  let convertedData = [];

  data.forEach((form) => {
    // Internal data
    let internalData = {
      name: `${form.name} Internal`,
      type: 'internal',
      total: form.totalUser,
      pending: form.pendingUser,
      approved: form.approvedUser,
      returned: form.returnedUser,
      bucket: form.bucketUser,
      upcoming: form.totalUpcomingUser,
    };

    // Customer data
    let customerData = {
      name: `${form.name} Customer`,
      type: 'customer',
      total: form.totalCustomer,
      pending: form.pendingCustomer,
      approved: form.approvedCustomer,
      returned: form.returnedCustomer,
      bucket: form.bucketCustomer,
      upcoming: form.totalUpcomingCustomer,
    };

    convertedData.push(internalData, customerData);
  });

  return convertedData;
};

module.exports = formatRequests;
