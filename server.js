const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  // CORS headers pour autoriser les connexions depuis GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FPS Server running');
});

const wss = new WebSocket.Server({ server });

const players = {};
const SPAWN_POINTS = [
  { x: 0, y: 1.7, z: 0 },
  { x: 10, y: 1.7, z: 10 },
  { x: -10, y: 1.7, z: -10 },
  { x: 10, y: 1.7, z: -10 },
  { x: -10, y: 1.7, z: 10 },
  { x: 0, y: 1.7, z: 15 },
  { x: 0, y: 1.7, z: -15 },
  { x: 15, y: 1.7, z: 0 },
  { x: -15, y: 1.7, z: 0 },
];

function getRandomSpawn() {
  return SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
}

let nextId = 1;

wss.on('connection', (ws, req) => {
  const id = String(nextId++);
  const spawn = getRandomSpawn();

  players[id] = { id, x: spawn.x, y: spawn.y, z: spawn.z, rotY: 0, health: 4, alive: true, ws };

  console.log(`Player ${id} connected from ${req.socket.remoteAddress}. Total: ${Object.keys(players).length}`);

  ws.send(JSON.stringify({
    type: 'init', id, spawn,
    players: Object.values(players)
      .filter(p => p.id !== id)
      .map(p => ({ id: p.id, x: p.x, y: p.y, z: p.z, rotY: p.rotY, health: p.health, alive: p.alive }))
  }));

  broadcast({ type: 'playerJoin', player: { id, x: spawn.x, y: spawn.y, z: spawn.z, rotY: 0, health: 4, alive: true } }, id);

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch (e) { return; }
    const player = players[id];
    if (!player) return;

    if (msg.type === 'move') {
      player.x = msg.x; player.y = msg.y; player.z = msg.z; player.rotY = msg.rotY;
      broadcast({ type: 'playerMove', id, x: msg.x, y: msg.y, z: msg.z, rotY: msg.rotY }, id);
    }
    if (msg.type === 'shoot') {
      broadcast({ type: 'shoot', id, origin: msg.origin, direction: msg.direction }, id);
    }
    if (msg.type === 'hit') {
      const target = players[msg.targetId];
      if (!target || !target.alive) return;
      const dmg = (typeof msg.damage === 'number' && msg.damage > 0 && msg.damage <= 4) ? msg.damage : 1;
      target.health -= dmg;
      target.health = Math.max(0, target.health);
      console.log(`Player ${id} hit player ${target.id} for ${dmg}. Health: ${target.health}`);
      broadcast({ type: 'playerHit', targetId: target.id, health: target.health, shooterId: id });
      if (target.health <= 0) {
        target.alive = false;
        broadcast({ type: 'playerDied', targetId: target.id, killerId: id });
        setTimeout(() => {
          if (players[target.id]) {
            const newSpawn = getRandomSpawn();
            players[target.id].health = 4;
            players[target.id].alive = true;
            players[target.id].x = newSpawn.x;
            players[target.id].y = newSpawn.y;
            players[target.id].z = newSpawn.z;
            broadcast({ type: 'playerRespawn', id: target.id, spawn: newSpawn });
          }
        }, 2000);
      }
    }
  });

  ws.on('close', () => {
    delete players[id];
    broadcast({ type: 'playerLeave', id });
    console.log(`Player ${id} disconnected. Total: ${Object.keys(players).length}`);
  });

  ws.on('error', (err) => console.error(`Player ${id} error:`, err.message));
});

function broadcast(msg, excludeId = null) {
  const data = JSON.stringify(msg);
  for (const pid in players) {
    if (pid === excludeId) continue;
    const p = players[pid];
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(data);
  }
}

// Railway fournit process.env.PORT automatiquement
const PORT = process.env.PORT || 8765;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 FPS Game Server started!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.PORT ? 'Railway (Cloud)' : 'Local'}\n`);
});
