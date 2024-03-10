SELECT DISTINCT r.id
              ,f.name form
              ,c.name category
              ,r.requestSenderType
              ,r.createdAt requestedDate
              ,r.statusId statusId
              ,wm.groupid
              ,'Bucket' STATUS
FROM requests r
         JOIN forms f ON f.id = r.formId
         JOIN categories c ON c.id = f.categoryId
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
        AND wm.groupId IN (
          SELECT groupid
          FROM group_users gu
          WHERE gu.userId in (:user)
        )
      AND (CASE WHEN((':singleBranch' = 'true' AND r.requestedBranch = ':uBranch') OR (':singleBranch' = 'false')) THEN 1 ELSE 0 END) = 1    
      AND (CASE WHEN wm.groupId NOT IN (
        SELECT l.groupId
        FROM workflow_logs l
        WHERE l.requestId = r.id
          AND (l.actionId = 4 and l.requestId not in (select b.requestId from workflow_logs b where b.requestId = r.id and (b.actionId = 2 OR b.actionId = 6)) )
        ) THEN 1
        
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
          select groupId from group_users gu2 WHERE gu2.userId In (:user) and gu2.groupId = wl.groupId 
          ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker)
        THEN 1
        ELSE 0 END) = 1
      AND (
      (CASE 
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
            select groupId from group_users gu2 WHERE gu2.userId In (:user) and gu2.groupId = wl.groupId 
            ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker AND :user NOT IN (
              SELECT l.currentUserId
              FROM workflow_logs l
              WHERE l.requestId = r.id
                AND (
                  l.actionId = 4
                  AND(
                  l.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and (wl2.actionId = 2 OR wl2.actionId = 6) ORDER BY updatedAt DESC)
	                  OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2)
                    )
                  )
              ))
          THEN 1
          WHEN 
          (wm.startedOn IS NULL)
          THEN 1
          ELSE 0 END) = 1 
          AND wm.completedOn IS NULL
        )
    AND r.statusId != 3
	 and r.id= :requestId
