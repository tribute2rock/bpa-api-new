SELECT DISTINCT 
    r.id, 
    r.requestKey,
    s.name status, 
    f.name request, 
    c.name category, 
    cu.accountName customer, 
    cu.accountNumber account, 
    cu.mobileNumber mobile, 
    r.requestSenderType, 
    r.createdAt requestedDate FROM requests r 
JOIN forms f ON f.id = r.formId 
JOIN categories c ON c.id = f.categoryId 
JOIN customers cu ON cu.id = r.requestSenderId
JOIN workflow_masters wm ON r.id = wm.requestId 
JOIN statuses s ON r.statusId = s.id 
JOIN workflow_masters wmPre ON wmPre.requestId = wm.requestId where r.requestSenderType = 'customer' and (r.requestKey like ':value%' or f.name like ':value%' or cu.accountName like ':value%' or cu.mobileNumber like ':value%' or cu.accountNumber like ':value%' ) and s.name like ':completed%'
order by id desc
offset :offset rows fetch  next :limit rows only