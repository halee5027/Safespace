const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reason: { type: String, required: true },
    anonymous: { type: Boolean, default: true },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
