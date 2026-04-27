const Alert = require('../models/Alert');

async function createAlert({ io, userId, type, title, message, meta = {} }) {
  const alert = await Alert.create({
    userId,
    type,
    title,
    message,
    meta
  });

  if (io) {
    io.to(`user:${userId}`).emit('alert:new', alert);
  }

  return alert;
}

module.exports = {
  createAlert
};
