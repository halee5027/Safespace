const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, default: '' },
    imageData: { type: String, default: '' },
    imageMimeType: { type: String, default: '' },
    status: {
      type: String,
      enum: ['visible', 'blurred', 'blocked', 'removed'],
      default: 'visible'
    },
    moderation: {
      text: {
        toxicity: { type: Number, default: 0 },
        category: { type: String, default: 'safe' },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
      },
      image: {
        abuse_detected: { type: Boolean, default: false },
        type: { type: String, default: 'none' },
        confidence: { type: Number, default: 0 },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
      },
      explanation: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
