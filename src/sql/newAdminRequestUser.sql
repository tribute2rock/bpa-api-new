SELECT DISTINCT
    r.id,
    r.requestKey,
    s.name status,
    f.name request,
    c.name category,
    u.name name,
    u.email email,
    r.requestSenderType,
    r.createdAt requestedDate FROM requests r
JOIN forms f ON f.id = r.formId
JOIN categories c ON c.id = f.categoryId
JOIN users u ON u.id = r.requestSenderId
JOIN workflow_masters wm ON r.id = wm.requestId
JOIN statuses s ON r.statusId = s.id
JOIN workflow_masters wmPre ON wmPre.requestId = wm.requestId where r.requestSenderType = 'user'
order by id desc
offset :offset rows fetch  next :limit rows only