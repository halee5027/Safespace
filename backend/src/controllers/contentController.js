const Post = require('../models/Post');
const Report = require('../models/Report');
const { analyzeText, analyzeImage } = require('../services/aiClient');
const { getContentDecision } = require('../services/moderationEngine');
const { createAlert } = require('../services/alertService');

async function uploadContentHandler(req, res, next) {
  try {
    const io = req.app.get('io');
    const { authorId, caption = '' } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: 'authorId is required' });
    }

    const imageBase64 = req.file ? req.file.buffer.toString('base64') : req.body.image_base64 || '';

    const [textResult, imageResult] = await Promise.all([
      analyzeText(caption),
      analyzeImage({ caption, imageBase64 })
    ]);

    const decision = getContentDecision({ textResult, imageResult });

    const post = await Post.create({
      authorId,
      caption,
      imageData: imageBase64,
      imageMimeType: req.file?.mimetype || 'image/png',
      status: decision.postStatus,
      moderation: {
        text: {
          toxicity: textResult.toxicity,
          category: textResult.category,
          severity: textResult.severity
        },
        image: {
          abuse_detected: imageResult.abuse_detected,
          type: imageResult.type,
          confidence: imageResult.confidence,
          severity: imageResult.severity
        },
        explanation: [textResult.explanation, imageResult.explanation].filter(Boolean).join(' | ')
      }
    });

    if (decision.action !== 'allow') {
      await Report.create({
        reporterId: authorId,
        postId: post._id,
        reason: 'Auto-flagged by moderation pipeline',
        anonymous: false,
        status: 'open'
      });

      await createAlert({
        io,
        userId: authorId,
        type: 'harmful_content',
        title: 'Upload restricted',
        message: decision.reason,
        meta: { postId: post._id }
      });
    }

    io.emit('feed:new-post', {
      _id: post._id,
      authorId: post.authorId,
      caption: post.caption,
      status: post.status,
      moderation: post.moderation,
      createdAt: post.createdAt,
      imageSrc: post.imageData ? `data:${post.imageMimeType};base64,${post.imageData}` : ''
    });

    res.status(decision.action === 'block' ? 403 : 200).json({
      status: decision.action,
      post,
      moderation: {
        text: textResult,
        image: imageResult,
        explanation: decision.reason
      },
      shouldBlur: decision.shouldBlur
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadContentHandler
};
