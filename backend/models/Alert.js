const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'warning',
        'blocked_message',
        'targeted_risk',
        'harmful_content',
        'moderation_update',
        'support_suggestion'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
