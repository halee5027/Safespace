const User = require('../models/User');

async function listUsersHandler(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function createUserHandler(req, res, next) {
  try {
    const { username, displayName, role = 'user' } = req.body;
    if (!username || !displayName) {
      return res.status(400).json({ error: 'username and displayName are required' });
    }

    const user = await User.create({ username, displayName, role });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsersHandler,
  createUserHandler
};
