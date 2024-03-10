const { query } = require('express');

const LC_BucketFilterForm = process.env.LC_Form;
const BG_BucketFilterForm = process.env.BG_Form;
const LC_Dec_BucketFilterForm = process.env.LC_Form_Dec;
const BG_Dec_BucketFilterForm = process.env.BG_Form_Dec;

/**
 * assembling query for bucket request
 * @param {*} reqType
 * @param {*} offset
 * @param {*} limit
 * @param {*} search
 * @param {*} isCompleted
 * @param {*} startDate
 * @param {*} endDate
 * @returns
 */
function bucketRequestQueryInternal(
  reqType,
  userId,
  offset,
  limit,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch
) {
  return {
    query:
      `SELECT a.*, dbo.GetNameList(a.id) requestAt, dbo.GetBeneficiaryName(a.id) beneficiaryName FROM (` +
      bucketRequestTopQueryInternal(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleFilterQuery(reqType, search, searchkey, startDate, endDate) +
      handleBottomQuery(offset, limit),
    total:
      countQuery +
      bucketRequestTopQueryInternal(reqType, userId, uBranch, singleBranch) +
      `) as a ` +
      handleFilterQuery(reqType, search, searchkey, startDate, endDate),
  };
}
function bucketRequestQueryExternal(
  reqType,
  userId,
  offset,
  limit,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch
) {
  return {
    query1:
      `SELECT a.*, dbo.GetNameList(a.id) requestAt, dbo.GetBeneficiaryName(a.id) beneficiaryName FROM (` +
      bucketRequestTopQueryExternal(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleFilterQueryExternal(reqType, search, searchkey, startDate, endDate) +
      handleBottomQueryExternal(offset, limit),
    total:
      countQueryExternal +
      bucketRequestTopQueryExternal(reqType, userId, uBranch, singleBranch) +
      `) as a ` +
      handleFilterQueryExternal(reqType, search, searchkey, startDate, endDate),
  };
}

//----------- new bucket request + new bucket request user + bucket request count -----------------------
const bucketRequestTopQueryInternal = (reqType, userId, uBranch, selfBranch) =>
  `SELECT DISTINCT 
  r.id,
  r.requestKey,
  f.name request,
  c.name category,
  -- For customer or user requests
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.updatedAt actionDate,
  r.createdAt requestedDate,
  r.statusId statusId,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  wm.groupid,
  'Bucket' STATUS
FROM requests r
         JOIN forms f ON f.id = r.formId
         JOIN categories c ON c.id = f.categoryId
            JOIN users u ON u.id = r.requestSenderId
         JOIN workflow_masters wm ON r.id = wm.requestId
         JOIN statuses s ON r.statusId = s.id
         LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
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
          WHERE gu.userId in (${userId})
        )
      -- Below AND condition will check LC form 
      -- AND (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1    
      AND (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
      AND (CASE WHEN wm.groupId NOT IN (
        SELECT l.groupId
        FROM workflow_logs l
        WHERE l.requestId = r.id
          AND (l.actionId = 4 and l.requestId not in (select b.requestId from workflow_logs b where b.requestId = r.id and (b.actionId = 2 OR b.actionId = 6)) )
        ) THEN 1
        
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
          select groupId from group_users gu2 WHERE gu2.userId In (${userId}) and gu2.groupId = wl.groupId 
          ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker)
        THEN 1
        ELSE 0 END) = 1
      AND (
      (CASE 
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
            select groupId from group_users gu2 WHERE gu2.userId In (${userId}) and gu2.groupId = wl.groupId 
            ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker AND ${userId} NOT IN (
              SELECT l.currentUserId
              FROM workflow_logs l
              WHERE l.requestId = r.id
                AND 
                  l.actionId = 4
                  AND(
	                  l.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and (wl2.actionId = 2 OR wl2.actionId = 6) ORDER BY updatedAt DESC)
	                  OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2)
                    )
                  )
              )
          THEN 1
          WHEN 
          (wm.startedOn IS NULL)
          THEN 1
          ELSE 0 END) = 1 
          AND wm.completedOn IS NULL
        )
    AND r.statusId != 3 AND r.statusId != 6
    AND r.requestSenderType = 'user' AND r.formId=13
    `;

//filter query according to reqType, search and date
const handleFilterQueryExternal = (reqType, search, searchkey = '', startDate, endDate, isCompleted, switchCustomer) =>
  `${search ? `WHERE 1 = 1 ${search}` : ''}`;

// paginate request list
const handleBottomQueryExternal = (offset, limit) =>
  ` ORDER BY actionDate DESC OFFSET ${offset} ROWS
  FETCH NEXT ${limit} ROWS ONLY`;

// count query
const countQuery = `SELECT count(*) as total FROM (`;
//filter query according to reqType, search and date
const handleFilterQuery = (reqType, search, searchkey = '', startDate, endDate, isCompleted, switchCustomer) =>
  `${search ? `WHERE 1 = 1 ${search}` : ''}`;

// paginate request list
const handleBottomQuery = (offset, limit) =>
  ` ORDER BY actionDate DESC OFFSET ${offset} ROWS
  FETCH NEXT ${limit} ROWS ONLY`;

// count query
const countQueryExternal = `SELECT count(*) as total FROM (`;

function allRequestQueryInternal(
  reqType,
  userId,
  offset,
  limit,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch,
  switchCustomer
) {
  return {
    query:
      `SELECT a.*, dbo.GetNameList(a.id) requestAt, dbo.GetBeneficiaryName(a.id) beneficiaryName FROM (` +
      allReqeustSelectInternal() +
      allRequestTopQueryInternal(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQueryInternal(reqType, search, searchkey, startDate, endDate, switchCustomer) +
      handleAllBottomQueryInternal(offset, limit),
    total:
      countQuery +
      allReqeustSelectInternal(reqType) +
      allRequestTopQueryInternal(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQueryInternal(reqType, search, searchkey, startDate, endDate, switchCustomer),
  };
}

//----------- new other request + new other request user + other request count -----------------------
const allReqeustSelectInternal = () =>
  `SELECT id, requestKey, request, category, 
  requestSenderType, requestedBranch, requestedDate, actionDate, swiftUpload, guarantee, refNums, statusId
FROM (`;

const allRequestTopQueryInternal = (reqType, userId, uBranch, selfBranch) =>
  `
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
 JOIN users u ON u.id = r.requestSenderId
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id         
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  JOIN users u ON u.id = r.requestSenderId
  JOIN workflows w ON w.id = f.workflowId 
  JOIN group_users gu ON gu.groupId IN (w.workflowView) AND gu.userId = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
 u.name name,
      u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Pending'        status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  JOIN users u ON u.id = r.requestSenderId
  join workflow_masters wm on r.id = wm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join statuses s on r.statusId = s.id
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is null)
    and r.statusId not in (3, 6) 
  where r.statusId != 6 and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Upcoming'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  JOIN users u ON u.id = r.requestSenderId
  join
  (select * from workflow_masters where startedOn is null and completedOn is null) wm on r.id = wm.requestId
  and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  join (select * from workflow_masters where startedOn is not null and completedOn is null) wmm
    on wm.requestId = wmm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
    and wmm.workflowLevelId in 
  (select id from workflow_levels l
    where l.level = (select level from workflow_levels l2 where l2.id = wm.workflowLevelId) - 1)
  where r.statusId != 6 and
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union
                     
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Forwarded'      status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  JOIN users u ON u.id = r.requestSenderId
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is not null)
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId != 1 and r.statusId != 4 and r.statusId != 6
  and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union
  
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Approved'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    JOIN users u ON u.id = r.requestSenderId
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
      and (wm.startedOn is not null and wm.completedOn is not null)
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 4 and r.statusId != 1 and r.statusId != 6
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  u.name name,
  u.email email,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Closed'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    JOIN users u ON u.id = r.requestSenderId
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 6 and r.statusId != 1
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  u.name name,
  u.email email,
  cu.accountNumber account,
  cu.mobileNumber mobile,
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Returned'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  JOIN users u ON u.id = r.requestSenderId
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId = 3 and
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
) as r
WHERE statusId != 5 and status = ':status' 
and requestSenderType = 'internal'
`;

const handleAllFilterQueryInternal = (reqType, search, searchkey, startDate, endDate, switchCustomer, removeWhere) =>
  `${search ? (removeWhere ? `${search}` : `WHERE 1 = 1 ${search}`) : ''}`;

// paginate request list
const handleAllBottomQueryInternal = (offset, limit) =>
  ` ORDER BY actionDate DESC OFFSET ${offset} ROWS
FETCH NEXT ${limit} ROWS ONLY`;

//----------- new bucket request + new bucket request user + bucket request count -----------------------
const bucketRequestTopQueryExternal = (reqType, userId, uBranch, selfBranch) =>
  `SELECT DISTINCT 
  r.id,
  r.requestKey,
  f.name request,
  c.name category,
  -- For customer or user requests
  (CASE  WHEN cu.accountName='NEW CUSTOMER'
  then (select  value from request_values  where requestId=r.id and name= 'registration_account_name') 
  else cu.accountName END ) customer,
      cu.accountNumber account,
      cu.mobileNumber mobile,
  r.requestSenderType,
  r.requestedBranch,
  r.updatedAt actionDate,
  r.createdAt requestedDate,
  r.statusId statusId,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  wm.groupid,
  'Bucket' STATUS
FROM requests r
         JOIN forms f ON f.id = r.formId
         JOIN categories c ON c.id = f.categoryId
         JOIN customers cu ON cu.id = r.requestSenderId
         JOIN workflow_masters wm ON r.id = wm.requestId
         JOIN statuses s ON r.statusId = s.id
         LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
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
          WHERE gu.userId in (${userId})
        )
      -- Below AND condition will check LC form 
      -- AND (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1    
      AND (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    
      AND (CASE WHEN wm.groupId NOT IN (
        SELECT l.groupId
        FROM workflow_logs l
        WHERE l.requestId = r.id
          AND (l.actionId = 4 and l.requestId not in (select b.requestId from workflow_logs b where b.requestId = r.id and (b.actionId = 2 OR b.actionId = 6)) )
        ) THEN 1
        
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
          select groupId from group_users gu2 WHERE gu2.userId In (${userId}) and gu2.groupId = wl.groupId 
          ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker)
        THEN 1
        ELSE 0 END) = 1
      AND (
      (CASE 
        WHEN (wm.multiplePicker IS NOT NULL AND (SELECT COUNT(*) FROM workflow_logs wl WHERE wl.requestId = r.id AND wl.actionId = 4 AND wl.groupId = (
            select groupId from group_users gu2 WHERE gu2.userId In (${userId}) and gu2.groupId = wl.groupId 
            ) AND (wl.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2 ORDER BY updatedAt DESC) OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2))) < wm.multiplePicker AND ${userId} NOT IN (
              SELECT l.currentUserId
              FROM workflow_logs l
              WHERE l.requestId = r.id
                AND 
                  l.actionId = 4
                  AND(
	                  l.updatedAt > (SELECT TOP 1 updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and (wl2.actionId = 2 OR wl2.actionId = 6) ORDER BY updatedAt DESC)
	                  OR NOT EXISTS (SELECT updatedAt FROM workflow_logs wl2 WHERE wl2.requestId = r.id and actionId = 2)
                    )
                  )
              )
          THEN 1
          WHEN 
          (wm.startedOn IS NULL)
          THEN 1
          ELSE 0 END) = 1 
          AND wm.completedOn IS NULL
        )
    AND r.statusId != 3 AND r.statusId != 6
    AND r.requestSenderType = 'customer' AND r.formId=13`;

/**
 * assembling query for bucket request
 * @param {*} reqType
 * @param {*} offset
 * @param {*} limit
 * @param {*} search
 * @param {*} isCompleted
 * @param {*} startDate
 * @param {*} endDate
 * @returns
 */
function allRequestQueryCorporateOne(
  reqType,
  userId,
  offset,
  limit,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch,
  switchCustomer
) {
  return {
    query:
      `SELECT a.*, dbo.GetNameList(a.id) requestAt, dbo.GetBeneficiaryName(a.id) beneficiaryName FROM (` +
      allReqeustSelect(reqType) +
      allRequestTopQueryNEw(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQuery(reqType, search, searchkey, startDate, endDate, switchCustomer) +
      handleAllBottomQuery(offset, limit),
    total:
      countQuery +
      allReqeustSelect(reqType) +
      allRequestTopQueryNEw(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQuery(reqType, search, searchkey, startDate, endDate, switchCustomer),
  };
}
/**
 * @param {*} isCompleted
 * @param {*} startDate
 * @param {*} endDate
 * @returns
 */
function allRequestQueryCorporateTwo(
  reqType,
  userId,
  offset,
  limit,
  search,
  searchkey,
  startDate,
  endDate,
  uBranch,
  singleBranch,
  switchCustomer
) {
  return {
    query1:
      `SELECT a.*, dbo.GetNameList(a.id) requestAt, dbo.GetBeneficiaryName(a.id) beneficiaryName FROM (` +
      allReqeustSelect(reqType) +
      allRequestTopQuery(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQuery(reqType, search, searchkey, startDate, endDate, switchCustomer) +
      handleAllBottomQuery(offset, limit),
    total:
      countQuery +
      allReqeustSelect(reqType) +
      allRequestTopQuery(reqType, userId, uBranch, singleBranch) +
      `) a ` +
      handleAllFilterQuery(reqType, search, searchkey, startDate, endDate, switchCustomer),
  };
}
//----------- new other request + new other request user + other request count -----------------------
const allReqeustSelect = (reqType) =>
  `SELECT id, requestKey, request, category, ${
    reqType === 'internal' ? `name, email,` : `customer, account, mobile,`
  } requestSenderType, requestedBranch, requestedDate, actionDate, swiftUpload, guarantee, refNums, statusId
FROM (`;

const allRequestTopQuery = (reqType, userId, uBranch, selfBranch) =>
  `
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
${reqType === 'internal' ? ` JOIN users u ON u.id = r.requestSenderId` : ` JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id         
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
${reqType === 'internal' ? ` JOIN users u ON u.id = r.requestSenderId` : ` JOIN customers cu ON cu.id = r.requestSenderId`}
  JOIN workflows w ON w.id = f.workflowId 
  JOIN group_users gu ON gu.groupId IN (w.workflowView) AND gu.userId = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Pending'        status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join statuses s on r.statusId = s.id
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is null)
    and r.statusId not in (3, 6) 
  where r.statusId != 6 and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Upcoming'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join
  (select * from workflow_masters where startedOn is null and completedOn is null) wm on r.id = wm.requestId
  and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  join (select * from workflow_masters where startedOn is not null and completedOn is null) wmm
    on wm.requestId = wmm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
    and wmm.workflowLevelId in 
  (select id from workflow_levels l
    where l.level = (select level from workflow_levels l2 where l2.id = wm.workflowLevelId) - 1)
  where r.statusId != 6 and
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
                     
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Forwarded'      status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is not null)
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId != 1 and r.statusId != 4 and r.statusId != 6
  and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1 and r.formId=13
union
  
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Approved'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
      and (wm.startedOn is not null and wm.completedOn is not null)
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 4 and r.statusId != 1 and r.statusId != 6
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Closed'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 6 and r.statusId != 1
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1 and r.formId=13
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Returned'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId = 3 and
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1  and r.formId=13
) as r 
WHERE statusId != 5 and status = ':status' 
and requestSenderType = '${reqType === 'internal' ? 'user' : 'customer'}'`;

const allRequestTopQueryNEw = (reqType, userId, uBranch, selfBranch) =>
  `
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
${reqType === 'internal' ? ` JOIN users u ON u.id = r.requestSenderId` : ` JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id         
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1 and r.formId=13    
union
select r.id,
  r.requestKey,
  f.name           request,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'All'            status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
${reqType === 'internal' ? ` JOIN users u ON u.id = r.requestSenderId` : ` JOIN customers cu ON cu.id = r.requestSenderId`}
  JOIN workflows w ON w.id = f.workflowId 
  JOIN group_users gu ON gu.groupId IN (w.workflowView) AND gu.userId = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  where 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Pending'        status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join statuses s on r.statusId = s.id
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is null)
    and r.statusId not in (3, 6) 
  where r.statusId != 6 and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Upcoming'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join
  (select * from workflow_masters where startedOn is null and completedOn is null) wm on r.id = wm.requestId
  and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  join (select * from workflow_masters where startedOn is not null and completedOn is null) wmm
    on wm.requestId = wmm.requestId
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
    and wmm.workflowLevelId in 
  (select id from workflow_levels l
    where l.level = (select level from workflow_levels l2 where l2.id = wm.workflowLevelId) - 1)
  where r.statusId != 6 and
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union
                     
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Forwarded'      status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    and (wm.startedOn is not null and wm.completedOn is not null)
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId != 1 and r.statusId != 4 and r.statusId != 6
  and 
  -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1  and r.formId=13
union
  
select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Approved'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
      and (wm.startedOn is not null and wm.completedOn is not null)
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 4 and r.statusId != 1 and r.statusId != 6
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Closed'      status
from requests r
    join forms f on f.id = r.formId
    join categories c on c.id = f.categoryId
    ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
    join workflow_masters wm on r.id = wm.requestId
      and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
    LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
    join workflow_levels wfl on wm.workflowLevelId = wfl.id
    where r.statusId = 6 and r.statusId != 1
    and 
    -- (CASE WHEN((f.name IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}') AND ((r.requestedBranch = '${uBranch}' AND wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level in (0))) OR wm.workflowLevelId = (SELECT ID FROM workflow_levels wwwl where wwwl.id = wm.workflowLevelId and level > 0))) OR (f.name NOT IN ('${LC_BucketFilterForm}', '${BG_BucketFilterForm}', '${LC_Dec_BucketFilterForm}', '${BG_Dec_BucketFilterForm}'))) THEN 1 ELSE 0 END) = 1         
    (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1 and r.formId=13
union

select r.id,
  r.requestKey,
  f.name           form,
  c.name           category,
  ${
    reqType === 'internal'
      ? `u.name name,
      u.email email,`
      : customer_select_query +
        `,
      cu.accountNumber account,
      cu.mobileNumber mobile,`
  }
  r.requestSenderType,
  r.requestedBranch,
  r.createdAt requestedDate,
  r.updatedAt actionDate,
  r.swiftUpload swiftUpload,
  rv.value guarantee,
  REPLACE(r.identifier, '"', '') refNums,
  r.statusId statusId,
  'Returned'       status
  from requests r
  join forms f on f.id = r.formId
  join categories c on c.id = f.categoryId
  ${reqType === 'internal' ? `JOIN users u ON u.id = r.requestSenderId` : `JOIN customers cu ON cu.id = r.requestSenderId`}
  join workflow_masters wm on r.id = wm.requestId
    and (select userId from group_users gu where gu.groupId = wm.groupId and gu.userId = ${userId}) = ${userId}
  LEFT JOIN request_values rv ON rv.requestId = r.id and rv.name = 'type_of_guarantee'
  join workflow_levels wfl on wm.workflowLevelId = wfl.id
  where r.statusId = 3 and
  (CASE WHEN(('${selfBranch}' = 'true' AND r.requestedBranch = '${uBranch}') OR ('${selfBranch}' = 'false')) THEN 1 ELSE 0 END) = 1    and r.formId=13
) as r
WHERE statusId != 5 and status = ':status'
and requestSenderType = '${reqType === 'internal' ? 'user' : 'customer'}'`;

//filter query according to reqType, search and date
const handleAllFilterQuery = (reqType, search, searchkey, startDate, endDate, switchCustomer, removeWhere) =>
  `${search ? (removeWhere ? `${search}` : `WHERE 1 = 1 ${search}`) : ''}`;

// paginate request list
const handleAllBottomQuery = (offset, limit) =>
  ` ORDER BY actionDate DESC OFFSET ${offset} ROWS
FETCH NEXT ${limit} ROWS ONLY`;

const customer_select_query = `(CASE  WHEN cu.accountName='NEW CUSTOMER'
then (select  value from request_values  where requestId=r.id and name= 'registration_account_name') 
else cu.accountName END ) customer`;

module.exports = {
  bucketRequestQueryInternal,
  bucketRequestTopQueryExternal,
  bucketRequestQueryExternal,
  allRequestQueryCorporateOne,
  allRequestQueryCorporateTwo,
};
