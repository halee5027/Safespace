const { analyzeText, analyzeImage, analyzeBehavior } = require('../services/aiClient');

async function analyzeTextHandler(req, res, next) {
  try {
    const { message = '' } = req.body;
    const result = await analyzeText(message);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function analyzeImageHandler(req, res, next) {
  try {
    const imageBase64 = req.file ? req.file.buffer.toString('base64') : req.body.image_base64 || '';
    const caption = req.body.caption || '';
    const result = await analyzeImage({ caption, imageBase64 });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function analyzeBehaviorHandler(req, res, next) {
  try {
    const { activity_logs: activityLogs = [] } = req.body;
    const result = await analyzeBehavior(activityLogs);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeTextHandler,
  analyzeImageHandler,
  analyzeBehaviorHandler
};
