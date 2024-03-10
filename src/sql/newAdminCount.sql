SELECT  count(*) total
FROM (SELECT DISTINCT 
    r.id, 
    r.requestKey,
    s.name status, 
    f.name request, 
    c.name category, 
    r.requestSenderType, 
    r.createdAt requestedDate FROM requests r 
JOIN forms f ON f.id = r.formId 
JOIN categories c ON c.id = f.categoryId 
JOIN customers cu ON cu.id = r.requestSenderId
JOIN workflow_masters wm ON r.id = wm.requestId 
JOIN statuses s ON r.statusId = s.id 
JOIN workflow_masters wmPre ON wmPre.requestId = wm.requestId where r.requestSenderType = ':reqType') as rfcc2wwrfcc2w
