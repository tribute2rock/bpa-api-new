SELECT  count(*) total
FROM (
         select r.id,
                r.requestKey,
                f.name           request,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'All'            status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join workflow_masters wm on r.id = wm.requestId
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user
                  join workflow_levels wfl on wm.workflowLevelId = wfl.id         union

          select r.id,
                r.requestKey,
                f.name           form,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'Pending'        status
         from requests r

                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join workflow_masters wm on r.id = wm.requestId
                  join statuses s on r.statusId = s.id
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user
             and (wm.startedOn is not null and wm.completedOn is null)
             and r.statusId != 3         union

         select r.id,
                r.requestKey,
                f.name           form,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'Upcoming'       status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join
              (select * from workflow_masters where startedOn is null and completedOn is null) wm on r.id = wm.requestId
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user

                  join (select * from workflow_masters where startedOn is not null and completedOn is null) wmm
                       on wm.requestId = wmm.requestId
                  join workflow_levels wfl on wm.workflowLevelId = wfl.id
             and wmm.workflowLevelId in (select id
                                         from workflow_levels l
                                         where l.level =
                                               (select level from workflow_levels l2 where l2.id = wm.workflowLevelId) -
                                               1)
         union
         select r.id,
                r.requestKey,
                f.name           form,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'Forwarded'      status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join workflow_masters wm on r.id = wm.requestId
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user
             and (wm.startedOn is not null and wm.completedOn is not null)
                  join workflow_levels wfl on wm.workflowLevelId = wfl.id
         where r.statusId != 1 and r.statusId != 4
         union
         select r.id,
                r.requestKey,
                f.name           form,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'Approved'      status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join workflow_masters wm on r.id = wm.requestId
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user
             and (wm.startedOn is not null and wm.completedOn is not null)
                  join workflow_levels wfl on wm.workflowLevelId = wfl.id
         where r.statusId = 4 and r.statusId != 1
         union
         select r.id,
                r.requestKey,
                f.name           form,
                c.name           category,
                cu.accountName customer,
                cu.accountNumber account,
                cu.mobileNumber mobile,
                r.requestSenderType, 
                r.createdAt requestedDate,
                r.statusId statusId,
                'Returned'       status
         from requests r
                  join forms f on f.id = r.formId
                  join categories c on c.id = f.categoryId
                  JOIN customers cu ON cu.id = r.requestSenderId
                  join workflow_masters wm on r.id = wm.requestId
             and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = :user) = :user
             and (wm.startedOn is not null and wm.completedOn is null)
                  join
              (select *
               from (select *, row_number() over (partition by requestId order by workflow_logs.createdAt desc) rn
                     from workflow_logs where actionId = 2) as wlrn
               where rn = 1
              ) wl on r.id = wl.requestId and wl.nextGroupId = :user
     ) as rfcc2wwrfcc2w
WHERE statusId != 5 and status = ':status' and requestSenderType = 'customer'

