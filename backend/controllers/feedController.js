const Post = require('../models/Post');

async function getFeedHandler(req, res, next) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(40).lean();

    const normalized = posts.map((post) => ({
      ...post,
      imageSrc: post.imageData
        ? `data:${post.imageMimeType || 'image/png'};base64,${post.imageData}`
        : ''
    }));

    res.json({ posts: normalized });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFeedHandler
};
