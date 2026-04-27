const User = require('../models/User');

const demoUsers = [
  { username: 'maya', displayName: 'Maya Chen', role: 'user' },
  { username: 'jordan', displayName: 'Jordan Lee', role: 'user' },
  { username: 'safeguard_mod', displayName: 'SafeGuard Mod', role: 'moderator' },
  { username: 'admin', displayName: 'Admin Team', role: 'admin' }
];

async function seedDemoHandler(req, res, next) {
  try {
    const existing = await User.find({ username: { $in: demoUsers.map((u) => u.username) } });
    const existingNames = new Set(existing.map((u) => u.username));

    const toCreate = demoUsers.filter((u) => !existingNames.has(u.username));
    const created = await User.insertMany(toCreate, { ordered: false });

    res.json({
      created: created.map((u) => ({ id: u._id, username: u.username, role: u.role })),
      message: 'Demo users ensured'
    });
  } catch (error) {
    // Duplicate inserts from race conditions are acceptable for this idempotent seed.
    if (error.code === 11000) {
      return res.json({ created: [], message: 'Demo users already seeded' });
    }
    next(error);
  }
}

module.exports = {
  seedDemoHandler
};
