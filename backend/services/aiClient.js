const axios = require('axios');
const env = require('../config/env');
const { levelFromScore } = require('../utils/severity');

const aiApi = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 5000
});

async function analyzeText(message) {
  try {
    const { data } = await aiApi.post('/analyze/text', { message });
    return data;
  } catch (error) {
    const highRisk = /fuck|f\W*u\W*c\W*k|bitch|asshole|cunt|motherfucker|kill|die|hate/i.test(message);
    const mediumRisk = /idiot|stupid|loser|ugly|worthless|clown/i.test(message);
    const fallbackToxicity = highRisk ? 0.9 : mediumRisk ? 0.62 : 0.12;
    return {
      toxicity: fallbackToxicity,
      category: fallbackToxicity > 0.75 ? 'harassment' : fallbackToxicity > 0.3 ? 'harassment' : 'safe',
      severity: levelFromScore(fallbackToxicity),
      explanation: 'Fallback classifier used because AI service is unavailable.'
    };
  }
}

async function analyzeImage({ caption = '', imageBase64 = '' }) {
  try {
    const { data } = await aiApi.post('/analyze/image', {
      caption,
      image_base64: imageBase64
    });
    return data;
  } catch (error) {
    const severeSignal = /nsfw|nude|naked|porn|xxx|gore|blood|graphic|suicide|self[\s-]?harm/i.test(caption);
    const mediumSignal = /shame|ugly|embarrass|meme|clown|roast|loser|worthless/i.test(caption);
    const visualOnlySignal = !!imageBase64;
    const signal = severeSignal || mediumSignal || visualOnlySignal;
    const confidence = severeSignal ? 0.9 : mediumSignal ? 0.68 : visualOnlySignal ? 0.48 : 0.14;
    const inferredSeverity = severeSignal ? 'high' : mediumSignal || visualOnlySignal ? 'medium' : 'low';
    const type = severeSignal ? 'sensitive content' : mediumSignal ? 'offensive meme' : visualOnlySignal ? 'image-under-review' : 'none';
    return {
      abuse_detected: signal,
      type,
      confidence,
      severity: inferredSeverity,
      explanation: visualOnlySignal
        ? 'Fallback image signal: visual content present and sent for safety review.'
        : 'Fallback image signal based on caption keywords.'
    };
  }
}

async function analyzeBehavior(activityLogs) {
  try {
    const { data } = await aiApi.post('/analyze/behavior', {
      activity_logs: activityLogs
    });
    return data;
  } catch (error) {
    const repeatedTargets = activityLogs.filter((log) => log.repeatedTargeting).length;
    const bullyScore = Math.min(1, repeatedTargets * 0.25);
    return {
      bully_score: bullyScore,
      pattern: bullyScore > 0.5 ? 'repeated targeting' : 'normal',
      risk_level: levelFromScore(bullyScore),
      explanation: 'Fallback behavior score based on repeated target flags.'
    };
  }
}

module.exports = {
  analyzeText,
  analyzeImage,
  analyzeBehavior
};
