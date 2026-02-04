const express = require('express');
const path = require('path');
const { 
  requestLogger, 
  errorHandler, 
  asyncRoute, 
  createServer, 
  healthCheck 
} = require('../../../lib/server-utils');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(requestLogger({ skip: (req) => req.path === '/api/health' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', healthCheck({}));

// Create server with graceful shutdown
createServer(app, { 
  port: PORT, 
  name: 'ShopQ',
  emoji: '🛒'
});
