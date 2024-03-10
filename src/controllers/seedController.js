const { Action } = require('../models');
const { seedData } = require('../sql/seed');
const db = require('../config/database');
const handleSeed = async (req, res) => {
  let actions;
  actions = await Action.findAll();
  if (actions.length > 0) {
    res.send('ALREADY SEEDED!');
  } else {
    const results1 = await db.query(`CREATE TRIGGER [dbo].[workflow_masters_insert]
    ON [dbo].[requests]
    AFTER INSERT
    AS
  BEGIN
    insert into workflow_masters
        (isActive, isCompleted, requestId, workflowId, workflowLevelId, groupId, multiplePicker, startedOn, completedOn, createdAt,
        updatedAt)
    select 1         isactive,
        0         iscomplete,
        r.id,
        f.workflowId,
        wl.id,
        wl.groupId,
        wl.multiplePicker,
        null      startOn,
        null      completeON,
        getdate() cDate,
        getdate() cDate
    from inserted r
        join forms f on f.id = r.formId
        join workflow_levels wl on f.workflowId = wl.workflowId
  END`);
    console.log('first done!');
    const results2 = await db.query(seedData);
    console.log('second done');
    res.send('INSERT SUCCESS');
  }
};

module.exports = {
  handleSeed,
};
