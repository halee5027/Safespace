const Report = require('../models/Report');

async function createReportHandler(req, res, next) {
  try {
    const {
      reporterId,
      targetUserId,
      messageId,
      postId,
      reason,
      anonymous = true
    } = req.body;

    if (!reporterId || !reason) {
      return res.status(400).json({ error: 'reporterId and reason are required' });
    }

    const report = await Report.create({
      reporterId,
      targetUserId,
      messageId,
      postId,
      reason,
      anonymous
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReportHandler
};
