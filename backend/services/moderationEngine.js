const { shouldBlock } = require('../utils/severity');

function getMessageDecision(textResult) {
  const severity = textResult.severity || 'low';
  if (shouldBlock(severity)) {
    return {
      action: 'block',
      reason: 'Message blocked for severe harmful language.'
    };
  }

  if (severity === 'medium') {
    return {
      action: 'warn',
      reason: 'This may be harmful. Edit before posting.'
    };
  }

  return {
    action: 'allow',
    reason: 'Message is safe to send.'
  };
}

function getContentDecision({ textResult, imageResult }) {
  const isHigh = textResult.severity === 'high' || imageResult.severity === 'high';
  const isMedium =
    textResult.severity === 'medium' ||
    imageResult.severity === 'medium' ||
    imageResult.abuse_detected;

  if (isHigh) {
    return {
      action: 'block',
      postStatus: 'blocked',
      shouldBlur: true,
      reason: 'Content blocked and sent to moderators due to high-risk abuse indicators.'
    };
  }

  if (isMedium) {
    return {
      action: 'restrict',
      postStatus: 'blurred',
      shouldBlur: true,
      reason: 'Content partially restricted and blurred for safety review.'
    };
  }

  return {
    action: 'allow',
    postStatus: 'visible',
    shouldBlur: false,
    reason: 'Content is safe to publish.'
  };
}

function suggestedActions(riskLevel) {
  if (riskLevel === 'high') return ['block', 'report', 'mute', 'contact-moderator'];
  if (riskLevel === 'medium') return ['mute', 'report'];
  return ['monitor'];
}

module.exports = {
  getMessageDecision,
  getContentDecision,
  suggestedActions
};
