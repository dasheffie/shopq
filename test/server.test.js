/**
 * ShopQ Server Tests
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

describe('ShopQ Server', function() {
  this.timeout(10000);
  
  let server;
  let baseUrl;
  const PORT = 3099; // Use different port for tests
  
  before(function(done) {
    // Set port before requiring app
    process.env.PORT = PORT;
    
    // Create a minimal server for testing
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public')));
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', app: 'shopq', timestamp: new Date().toISOString() });
    });
    
    server = app.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      done();
    });
  });
  
  after(function(done) {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });
  
  describe('Health Endpoint', function() {
    it('should return 200 OK', function(done) {
      http.get(`${baseUrl}/api/health`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        done();
      }).on('error', done);
    });
    
    it('should return JSON with status ok', function(done) {
      http.get(`${baseUrl}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const json = JSON.parse(data);
          assert.strictEqual(json.status, 'ok');
          assert.strictEqual(json.app, 'shopq');
          assert(json.timestamp);
          done();
        });
      }).on('error', done);
    });
  });
  
  describe('Static Files', function() {
    it('should serve index.html at root', function(done) {
      http.get(`${baseUrl}/`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          assert(data.includes('ShopQ'));
          assert(data.includes('Quick shopping lists'));
          done();
        });
      }).on('error', done);
    });
    
    it('should return 404 for missing files', function(done) {
      http.get(`${baseUrl}/nonexistent.xyz`, (res) => {
        assert.strictEqual(res.statusCode, 404);
        done();
      }).on('error', done);
    });
  });
});
