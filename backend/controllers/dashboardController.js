const Message = require('../models/Message');
const Post = require('../models/Post');
const User = require('../models/User');

function makeTrendBuckets(items, keyAccessor) {
  const buckets = {
    low: 0,
    medium: 0,
    high: 0
  };

  items.forEach((item) => {
    const key = keyAccessor(item);
    if (buckets[key] !== undefined) buckets[key] += 1;
  });

  return [
    { label: 'Low', value: buckets.low },
    { label: 'Medium', value: buckets.medium },
    { label: 'High', value: buckets.high }
  ];
}

async function getDashboardMetricsHandler(req, res, next) {
  try {
    const [messages, posts, users] = await Promise.all([
      Message.find().sort({ createdAt: -1 }).limit(300).lean(),
      Post.find().sort({ createdAt: -1 }).limit(300).lean(),
      User.find().sort({ createdAt: -1 }).limit(100).lean()
    ]);

    const toxicMessages = messages.filter((m) => m.moderation?.severity !== 'low').length;
    const blockedMessages = messages.filter((m) => m.status === 'blocked').length;
    const imageAbuseDetections = posts.filter((p) => p.moderation?.image?.abuse_detected).length;
    const blurredPosts = posts.filter((p) => p.status === 'blurred').length;

    const bullyScoreAverage =
      users.length === 0 ? 0 : users.reduce((sum, u) => sum + (u.bullyScore || 0), 0) / users.length;

    const messageSeverity = makeTrendBuckets(messages, (item) => item.moderation?.severity || 'low');
    const imageSeverity = makeTrendBuckets(posts, (item) => item.moderation?.image?.severity || 'low');

    // Sentiment is approximated from toxicity for demo visualization.
    const sentimentTrend = [
      { label: 'Positive', value: messages.filter((m) => (m.moderation?.toxicity || 0) < 0.25).length },
      {
        label: 'Neutral',
        value: messages.filter((m) => {
          const t = m.moderation?.toxicity || 0;
          return t >= 0.25 && t < 0.55;
        }).length
      },
      { label: 'Negative', value: messages.filter((m) => (m.moderation?.toxicity || 0) >= 0.55).length }
    ];

    res.json({
      counters: {
        toxicMessages,
        blockedMessages,
        imageAbuseDetections,
        blurredPosts,
        bullyScoreAverage: Number(bullyScoreAverage.toFixed(2))
      },
      messageSeverity,
      imageSeverity,
      sentimentTrend
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardMetricsHandler
};
