let io;

const connectedUsers = new Map();

const setupQueueSocket = (socketIo) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Auth could be handled here or during connection setup
    socket.on('register', (userId) => {
      connectedUsers.set(userId, socket.id);
    });

    // Support both event name conventions for backward compatibility
    const handleJoinQueue = ({ doctorId, date }) => {
      const room = `queue_${doctorId}_${new Date(date).toISOString().split('T')[0]}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    };

    const handleLeaveQueue = ({ doctorId, date }) => {
      const room = `queue_${doctorId}_${new Date(date).toISOString().split('T')[0]}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    };

    socket.on('queue:join', handleJoinQueue);
    socket.on('join:queue', handleJoinQueue);  // backward compat
    socket.on('queue:leave', handleLeaveQueue);
    socket.on('leave:queue', handleLeaveQueue);  // backward compat

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
};

const emitQueueUpdate = (doctorId, date, queueData) => {
  if (!io) return;
  const room = `queue_${doctorId}_${new Date(date).toISOString().split('T')[0]}`;
  io.to(room).emit('queue:update', queueData);
};

const emitToPatient = (patientId, event, data) => {
  if (!io) return;
  const socketId = connectedUsers.get(patientId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

module.exports = {
  setupQueueSocket,
  emitQueueUpdate,
  emitToPatient
};
