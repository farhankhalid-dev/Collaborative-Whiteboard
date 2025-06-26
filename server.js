const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users, drawing history, and voting
const users = new Map();
const drawingHistory = [];
const clearVotes = new Set();
const MAX_HISTORY_SIZE = 5000;

// Color palette for auto-assignment
const COLORS = [
  '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
  '#ff00ff', '#00ffff', '#ffa500', '#800080', '#8b4513'
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Function to get the main LAN IP address
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('192.168.') || 
            net.address.startsWith('10.') || 
            net.address.startsWith('172.')) {
          return net.address;
        }
      }
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining with username
  socket.on('join', (username) => {
    const user = {
      id: socket.id,
      username: username || `User${Math.floor(Math.random() * 1000)}`,
      color: getRandomColor(),
      x: 0,
      y: 0
    };
    users.set(socket.id, user);
    
    // Send current users to the new user
    socket.emit('users-update', Array.from(users.values()));
    
    // Send assigned color to new user
    socket.emit('color-assigned', user.color);
    
    // Send existing drawing history to new user
    if (drawingHistory.length > 0) {
      console.log(`Sending ${drawingHistory.length} drawing events to ${user.username}`);
      socket.emit('drawing-history', drawingHistory);
    }
    
    // Send current clear vote status if any
    if (clearVotes.size > 0) {
      socket.emit('clear-vote-update', {
        votes: clearVotes.size,
        total: users.size,
        required: Math.ceil(users.size * 0.7)
      });
    }
    
    // Broadcast new user to all other users
    socket.broadcast.emit('user-joined', user);
    
    console.log(`${user.username} joined with color ${user.color}`);
  });

  // Handle username change
  socket.on('username-change', (newUsername) => {
    if (users.has(socket.id)) {
      const oldUsername = users.get(socket.id).username;
      users.get(socket.id).username = newUsername;
      
      // Broadcast username change to all users
      io.emit('username-updated', {
        id: socket.id,
        oldUsername: oldUsername,
        newUsername: newUsername
      });
      
      console.log(`${oldUsername} changed username to ${newUsername}`);
    }
  });

  // Handle drawing events - KEEP THIS SIMPLE
  socket.on('drawing', (data) => {
    // Add user ID to the drawing data
    const drawingEvent = {
      ...data,
      userId: socket.id,
      timestamp: Date.now()
    };
    
    // Store in history for persistence
    drawingHistory.push(drawingEvent);
    
    // Limit history size
    if (drawingHistory.length > MAX_HISTORY_SIZE) {
      drawingHistory.splice(0, 1000);
    }
    
    // Broadcast to ALL other users with user ID
    socket.broadcast.emit('drawing', drawingEvent);
  });

  // Handle cursor movement
  socket.on('cursor-move', (data) => {
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      user.x = data.x;
      user.y = data.y;
      
      // Broadcast cursor position to all other users
      socket.broadcast.emit('cursor-update', {
        id: socket.id,
        username: user.username,
        x: data.x,
        y: data.y
      });
    }
  });

  // Handle clear canvas voting
  socket.on('vote-clear', () => {
    if (!users.has(socket.id)) return;
    
    const user = users.get(socket.id);
    
    if (clearVotes.has(socket.id)) {
      clearVotes.delete(socket.id);
      console.log(`${user.username} withdrew clear vote`);
    } else {
      clearVotes.add(socket.id);
      console.log(`${user.username} voted to clear canvas`);
    }
    
    const totalUsers = users.size;
    const votesNeeded = Math.ceil(totalUsers * 0.7);
    const currentVotes = clearVotes.size;
    
    // Broadcast vote status to all users
    io.emit('clear-vote-update', {
      votes: currentVotes,
      total: totalUsers,
      required: votesNeeded,
      hasVoted: Array.from(clearVotes)
    });
    
    // Check if we have enough votes
    if (currentVotes >= votesNeeded) {
      console.log('Clear vote passed! Clearing canvas...');
      clearVotes.clear();
      drawingHistory.length = 0;
      io.emit('clear-canvas-approved');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users.has(socket.id)) {
      const username = users.get(socket.id).username;
      console.log(`${username} disconnected`);
      
      // Remove user vote if they had one
      const hadVote = clearVotes.has(socket.id);
      clearVotes.delete(socket.id);
      
      // Remove user and notify others
      users.delete(socket.id);
      socket.broadcast.emit('user-left', socket.id);
      
      // Update vote counts if someone who voted left
      if (hadVote && users.size > 0) {
        const totalUsers = users.size;
        const votesNeeded = Math.ceil(totalUsers * 0.7);
        const currentVotes = clearVotes.size;
        
        io.emit('clear-vote-update', {
          votes: currentVotes,
          total: totalUsers,
          required: votesNeeded,
          hasVoted: Array.from(clearVotes)
        });
        
        if (currentVotes >= votesNeeded && currentVotes > 0) {
          clearVotes.clear();
          drawingHistory.length = 0;
          io.emit('clear-canvas-approved');
        }
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  
  console.log(`✅ Whiteboard server running on port ${PORT}`);
  
  if (localIP) {
    console.log(`\n🌐 Access from your devices:`);
    console.log(`   🖥️  This computer: http://localhost:${PORT}`);
    console.log(`   📱 Mobile/Other devices: http://${localIP}:${PORT}`);
    console.log(`\n📋 Share this URL: http://${localIP}:${PORT}`);
  } else {
    console.log(`\n⚠️  Could not auto-detect IP address`);
    console.log(`💡 Find your IP manually and use: http://[YOUR_IP]:${PORT}`);
  }
  
  console.log(`\n🔥 Server ready! Waiting for connections...`);
});