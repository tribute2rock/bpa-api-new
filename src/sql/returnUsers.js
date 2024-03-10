const getQuery = (options) => {
  return `select distinct currentUserId as userId, name from(
    SELECT distinct u.name as name, wl.requestid,wl.groupId, wlvl.level, wl.currentuserid, wl.updatedAt
      FROM workflow_logs wl
       join workflow_masters wm
      on wl.requestId = wm.requestId and wl.groupId = wm.groupId
      join workflow_levels wlvl

      on wm.workflowLevelId = wlvl.id
	  join users u on wl.currentUserId = u.id
      where wl.requestId = ${options.requestId}
      ) allWM where  allWM.level <
      (select wlvl.level from workflow_masters wm
      join workflow_levels wlvl on wm.workflowLevelId = wlvl.id
      where wm.groupId = ${options.groupId} and requestId = ${options.requestId})`;
};
module.exports = { getQuery };
