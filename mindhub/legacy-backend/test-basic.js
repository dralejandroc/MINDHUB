const http = require('http');
const port = 3003;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Basic server working!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
});

server.listen(port, () => {
  console.log(`Basic server listening on port ${port}`);
  console.log(`Test: http://localhost:${port}/`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('connection', (socket) => {
  console.log('New connection received');
});