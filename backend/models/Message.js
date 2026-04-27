const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ['sent', 'warning_pending', 'blocked', 'removed'],
      default: 'sent'
    },
    moderation: {
      toxicity: { type: Number, default: 0 },
      category: { type: String, default: 'safe' },
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      explanation: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
