SELECT DISTINCT r.id,
                r.requestKey
              ,f.name request
              ,c.name category
              ,cu.accountName customer
              ,cu.accountNumber account
              ,cu.mobileNumber mobile
              ,r.requestSenderType
              ,r.createdAt requestedDate
              ,r.statusId statusId
              ,wm.groupid
              ,'Bucket' STATUS
FROM requests r
         JOIN forms f ON f.id = r.formId
         JOIN categories c ON c.id = f.categoryId
         JOIN customers cu ON cu.id = r.requestSenderId
         JOIN workflow_masters wm ON r.id = wm.requestId
         JOIN statuses s ON r.statusId = s.id
         JOIN workflow_masters wmPre ON wmPre.requestId = wm.requestId
    AND (
                                                (
                                                    CASE
                                                        WHEN (
                                                                     (
                                                                         SELECT [level]
                                                                         FROM workflow_levels wwl
                                                                         WHERE wwl.id = wmPre.workflowLevelId
                                                                     ) + 1
                                                                 ) = (
                                                                 SELECT [level]
                                                                 FROM workflow_levels wwl
                                                                 WHERE wwl.id = wm.workflowLevelId
                                                             ) AND wmPre.completedOn IS NOT NULL
                                                            THEN 1
                                                        WHEN wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level = 0)
                                                            THEN 1
                                                        ELSE 0
                                                        END
                                                    ) = 1
                                            )
    AND wm.groupId NOT IN (
        SELECT l.groupId
        FROM workflow_logs l
        WHERE l.requestId = r.id
          AND (l.actionId = 4 and l.requestId not in (select b.requestId from workflow_logs b where b.requestId = r.id and b.actionId = 2) )
    )
    AND wm.groupId IN (
        SELECT groupid
        FROM group_users gu
        WHERE gu.userId in (:user)
    )
    AND (
                                                wm.startedOn IS NULL
                                                AND wm.completedOn IS NULL
                                            )
    AND r.statusId != 3
    AND r.requestSenderType = 'customer'
    AND (r.requestKey like ':value%' or f.name like ':value%' or cu.accountName like ':value%' or cu.mobileNumber like ':value%' or cu.accountNumber like ':value%')
order by id desc
offset :offset rows fetch  next :limit rows only