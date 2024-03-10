select g.name,
       IIF(wm.startedOn is not null and wm.completedOn is null, 1, 0) as status,
       g.id as groupId
from workflow_masters wm
         join groups g on g.id = wm.groupId where requestId = :request;
