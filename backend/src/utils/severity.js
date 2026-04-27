function levelFromScore(score = 0) {
  if (score >= 0.85) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

function shouldBlock(level) {
  return level === 'high';
}

module.exports = {
  levelFromScore,
  shouldBlock
};
