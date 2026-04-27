const Message = require('../models/Message');
const User = require('../models/User');
const { analyzeText, analyzeBehavior } = require('../services/aiClient');
const { getMessageDecision } = require('../services/moderationEngine');
const { createAlert } = require('../services/alertService');

function buildActivityLogs(messages = []) {
  const targetCounts = {};
  return messages.map((msg) => {
    const targetKey = String(msg.receiverId);
    targetCounts[targetKey] = (targetCounts[targetKey] || 0) + 1;
    return {
      toxicity: msg.moderation?.toxicity || 0,
      repeatedTargeting: targetCounts[targetKey] >= 3,
      timestamp: msg.createdAt
    };
  });
}

async function updateBehaviorRisk(io, senderId, receiverId) {
  const recent = await Message.find({
    senderId,
    status: { $in: ['sent', 'blocked'] }
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const behaviorResult = await analyzeBehavior(buildActivityLogs(recent));

  await User.findByIdAndUpdate(senderId, {
    bullyScore: behaviorResult.bully_score || 0
  });

  if (behaviorResult.risk_level === 'high') {
    return createAlert({
      io,
      userId: receiverId,
      type: 'targeted_risk',
      title: 'You may be targeted',
      message: 'Our system detected repeated harmful targeting. Consider muting or reporting.',
      meta: {
        bully_score: behaviorResult.bully_score,
        pattern: behaviorResult.pattern
      }
    });
  }

  return null;
}

async function sendMessageHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    const {
      senderId,
      receiverId,
      text,
      confirmSend = false,
      pendingMessageId = null
    } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ error: 'senderId, receiverId, and text are required' });
    }

    const textResult = await analyzeText(text);
    const decision = getMessageDecision(textResult);

    const moderation = {
      toxicity: textResult.toxicity,
      category: textResult.category,
      severity: textResult.severity,
      explanation: textResult.explanation || ''
    };

    if (decision.action === 'block') {
      const blockedMessage = await Message.create({
        senderId,
        receiverId,
        text,
        status: 'blocked',
        moderation
      });

      await createAlert({
        io,
        userId: senderId,
        type: 'blocked_message',
        title: 'Message blocked',
        message: 'Your message was blocked for severe harmful language.',
        meta: { messageId: blockedMessage._id, category: textResult.category }
      });

      await createAlert({
        io,
        userId: receiverId,
        type: 'targeted_risk',
        title: 'Safety shield activated',
        message: 'A severe harmful message aimed at you was blocked.',
        meta: { senderId, category: textResult.category }
      });

      io.to(`user:${senderId}`).emit('chat:blocked', blockedMessage);

      return res.status(403).json({
        status: 'blocked',
        reason: decision.reason,
        analysis: textResult,
        message: blockedMessage
      });
    }

    if (decision.action === 'warn' && !confirmSend) {
      const pendingMessage = await Message.create({
        senderId,
        receiverId,
        text,
        status: 'warning_pending',
        moderation
      });

      await createAlert({
        io,
        userId: senderId,
        type: 'warning',
        title: 'Think Before You Send',
        message: decision.reason,
        meta: { messageId: pendingMessage._id }
      });

      return res.status(202).json({
        status: 'warning',
        reason: decision.reason,
        analysis: textResult,
        message: pendingMessage
      });
    }

    let message;

    if (pendingMessageId) {
      message = await Message.findByIdAndUpdate(
        pendingMessageId,
        {
          status: 'sent',
          moderation,
          text
        },
        { new: true }
      );
    }

    if (!message) {
      message = await Message.create({
        senderId,
        receiverId,
        text,
        status: 'sent',
        moderation
      });
    }

    io.to(`user:${receiverId}`).emit('chat:message', message);
    io.to(`user:${senderId}`).emit('chat:message-sent', message);

    await updateBehaviorRisk(io, senderId, receiverId);

    res.json({
      status: 'sent',
      reason: decision.reason,
      analysis: textResult,
      message
    });
  } catch (error) {
    next(error);
  }
}

async function getConversationHandler(req, res, next) {
  try {
    const { userA, userB } = req.query;

    if (!userA || !userB) {
      return res.status(400).json({ error: 'userA and userB query params are required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA }
      ],
      status: { $in: ['sent', 'warning_pending', 'blocked'] }
    })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendMessageHandler,
  getConversationHandler
};
