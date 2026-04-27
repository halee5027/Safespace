const Alert = require('../models/Alert');
const Message = require('../models/Message');
const { suggestedActions } = require('../services/moderationEngine');

function inferRisk(flaggedInteractions) {
  const hasHigh = flaggedInteractions.some((m) => m.moderation?.severity === 'high');
  if (hasHigh || flaggedInteractions.length >= 4) return 'high';
  if (flaggedInteractions.length >= 2) return 'medium';
  return 'low';
}

async function getAlertsHandler(req, res, next) {
  try {
    const { userId } = req.params;

    const [alerts, flaggedInteractions] = await Promise.all([
      Alert.find({ userId }).sort({ createdAt: -1 }).limit(30),
      Message.find({
        receiverId: userId,
        'moderation.severity': { $in: ['medium', 'high'] },
        status: { $in: ['sent', 'blocked'] }
      })
        .sort({ createdAt: -1 })
        .limit(15)
    ]);

    const riskLevel = inferRisk(flaggedInteractions);

    res.json({
      alerts,
      flaggedInteractions,
      suggestedActions: suggestedActions(riskLevel),
      riskLevel
    });
  } catch (error) {
    next(error);
  }
}

async function markAlertReadHandler(req, res, next) {
  try {
    const { alertId } = req.params;
    const alert = await Alert.findByIdAndUpdate(alertId, { read: true }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAlertsHandler,
  markAlertReadHandler
};
