const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { setupQueueSocket } = require('./src/socket/queueSocket');
const env = require('./src/config/env');

const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
setupQueueSocket(io);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
