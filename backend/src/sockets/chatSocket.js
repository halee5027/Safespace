function registerChatSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('join:user-room', ({ userId: roomUserId }) => {
      if (roomUserId) {
        socket.join(`user:${roomUserId}`);
      }
    });

    socket.on('chat:typing', ({ toUserId, fromUserId }) => {
      if (!toUserId || !fromUserId) return;
      io.to(`user:${toUserId}`).emit('chat:typing', { fromUserId });
    });

    socket.on('disconnect', () => {
      // No explicit cleanup required for Socket.io room handling.
    });
  });
}

module.exports = registerChatSocket;
