const Message = require('../models/Message');
const Post = require('../models/Post');
const Report = require('../models/Report');
const User = require('../models/User');

async function getFlaggedContentHandler(req, res, next) {
  try {
    const [flaggedMessages, flaggedPosts, openReports] = await Promise.all([
      Message.find({ 'moderation.severity': { $in: ['medium', 'high'] } })
        .sort({ createdAt: -1 })
        .limit(50),
      Post.find({ status: { $in: ['blurred', 'blocked'] } })
        .sort({ createdAt: -1 })
        .limit(50),
      Report.find({ status: 'open' }).sort({ createdAt: -1 }).limit(50)
    ]);

    res.json({ flaggedMessages, flaggedPosts, openReports });
  } catch (error) {
    next(error);
  }
}

async function reviewMessageHandler(req, res, next) {
  try {
    const { messageId } = req.params;
    const { action } = req.body;

    const status = action === 'remove' ? 'removed' : 'sent';
    const message = await Message.findByIdAndUpdate(messageId, { status }, { new: true });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    res.json({ message, action });
  } catch (error) {
    next(error);
  }
}

async function reviewPostHandler(req, res, next) {
  try {
    const { postId } = req.params;
    const { action } = req.body;

    const status = action === 'remove' ? 'removed' : 'visible';
    const post = await Post.findByIdAndUpdate(postId, { status }, { new: true });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.json({ post, action });
  } catch (error) {
    next(error);
  }
}

async function banUserHandler(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { status: 'banned' }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, status: 'banned' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFlaggedContentHandler,
  reviewMessageHandler,
  reviewPostHandler,
  banUserHandler
};
