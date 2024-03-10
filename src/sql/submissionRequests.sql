SELECT id, request, category, requestSenderType, requestedDate, statusId
FROM (
         select r.id,
                f.name           request,
                c.name           category,
                r.requestSenderType,
                r.createdAt requestedDate,
                r.statusId statusId,
                'Submitted'            status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  join users c2 on c2.id = r.requestSenderId and r.requestSenderId  = :user
                  and r.requestSenderType = 'user'
)
as rfcc2wwrfcc2w
WHERE statusId != 5 and status = ':status'
