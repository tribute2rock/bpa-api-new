const getLevelData = async (workflowId, levels) => {
  let levelData = [];
  const length = levels.length;
  levels.map((level) => {
    const index = levels.indexOf(level);
    if (length - 1 === index) {
      // levelData.push({ ...level, workflowId: workflowId, isApprover: true });
      levelData.push({ ...level, workflowId: workflowId });
    } else {
      // levelData.push({ ...level, workflowId: workflowId, isApprover: false });
      levelData.push({ ...level, workflowId: workflowId });
    }
  });
  return levelData;
};

module.exports = { getLevelData };
