/******************************************************
 * This is the simple Node.js (Express.js) server 
 * running on http and providing a simple functionality 
 * through the selected endpoint
 * Author: Piotr Bilski
 ******************************************************/

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// These are details of the system's configuration
const hostname = '127.0.0.1';
const port = 4000; // HTTP port
const wsPort = 4001; // WebSocket port

// This is the object representing the monster
const races = ["goblin", "orc", "troll"];
const monster = { race: "goblin", strength: 0, stamina: 0 };

// Simple CORS header so the React app (localhost:3000) can fetch
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Here is the endpoint for testing
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.send('Hello World!');
});

// Here is the endpoint for returning the monster configuration
app.get('/return-monster', (req, res) => {
  // Here we set up the monster randomly
  monster.stamina = Math.floor(Math.random() * 10) + 6; // 6..15
  monster.strength = Math.floor(Math.random() * 5) + 1; // 1..5
  monster.race = races[Math.floor(Math.random() * races.length)];
  // send back the details of the monster
  res.json(monster);
});

// Start the HTTP server
const server = http.createServer(app);
server.listen(port, hostname, () => {
  console.log(`HTTP Server running at http://${hostname}:${port}/`);
});

// Set up a simple WebSocket server that pushes random events while a client is connected.
const wss = new WebSocket.Server({ port: wsPort });

function randomEvent() {
  // choose target and attribute and amount
  const targets = ['player', 'enemy'];
  const attrs = ['stamina', 'strength'];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const attribute = attrs[Math.floor(Math.random() * attrs.length)];
  const amount = Math.floor(Math.random() * 4) + 1; // +1..+4
  return { type: 'buff', target, attribute, amount };
}

wss.on('connection', function connection(ws) {
  console.log('WebSocket client connected');

  // send a welcome message
  ws.send(JSON.stringify({ type: 'welcome', msg: 'Connected to monster event stream' }));

  // every 3-6 seconds send a random event while client is connected
  const timer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const ev = randomEvent();
      ws.send(JSON.stringify(ev));
    }
  }, 3000 + Math.floor(Math.random() * 3000));

  ws.on('close', () => {
    clearInterval(timer);
    console.log('WebSocket client disconnected');
  });
});

console.log(`WebSocket server running at ws://${hostname}:${wsPort}/`);