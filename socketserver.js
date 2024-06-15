// Import required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

// Set up Express app and create an HTTP server
const app = express();
const server = http.createServer(app);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Create a Socket.IO server instance and attach it to the HTTP server
const io = socketIO(server);

// Listen for client connections
io.on('connection', (socket) => {
  console.log('A user connected');
  console.log(socket.id)
});

// Start the server and listen on a specific port
const port = 3000; // Replace 3000 with the desired port number
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
