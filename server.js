const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const ROOT = __dirname;

// Get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║       🔮  面相分析 · 已启动         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  电脑访问: http://localhost:${PORT}     ║`);
  console.log(`║  手机访问: http://${localIP}:${PORT}    ║`);
  console.log('║                                      ║');
  console.log('║  ⚠ 手机连不上？检查：               ║');
  console.log('║  1. 手机和电脑连接同一个 WiFi       ║');
  console.log('║  2. Windows 防火墙需放行端口        ║');
  console.log('║     以管理员运行:                   ║');
  console.log('║     netsh advfirewall firewall add   ║');
  console.log('║     rule name="FaceReading" dir=in   ║');
  console.log('║     action=allow protocol=TCP        ║');
  console.log(`║     localport=${PORT}                   ║`);
  console.log('║  3. 关闭手机移动数据，只用 WiFi     ║');
  console.log('║                                      ║');
  console.log('║  按 Ctrl+C 停止服务器               ║');
  console.log('╚══════════════════════════════════════╝');
});
