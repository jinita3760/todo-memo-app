import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { watch } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'schedule-data.json');

// 저장된 데이터 로드
let scheduleData = {};
let lastFileChange = Date.now();

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      scheduleData = JSON.parse(content);
    }
  } catch (e) {
    console.log('데이터 로드 실패, 새로 시작합니다.');
  }
}
loadData();

// 파일 변경 감지 (Live Reload)
watch(__dirname, { recursive: true }, (eventType, filename) => {
  // index.html, server.js, css 파일 변경 감지
  if (filename && (filename.includes('.html') || filename.includes('.css') || filename.includes('.js'))) {
    if (!filename.includes('node_modules')) {
      lastFileChange = Date.now();
      console.log(`♻️ 파일 변경 감지: ${filename} - 휴대폰 자동 새로고침 예정`);
    }
  }
});

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const httpHandler = (req, res) => {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: 일정 데이터 조회
  if (req.url === '/api/schedule' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scheduleData));
    return;
  }

  // API: 파일 변경 여부 확인 (Live Reload용)
  if (req.url === '/api/reload-check' && req.method === 'GET') {
    const clientTime = parseInt(req.headers['x-last-reload'] || '0');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      shouldReload: lastFileChange > clientTime,
      lastChange: lastFileChange
    }));
    return;
  }

  // API: 일정 데이터 저장
  if (req.url === '/api/schedule' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        scheduleData = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(scheduleData, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, updatedAt: new Date().toISOString() }));
        console.log('📝 일정 저장됨:', new Date().toLocaleTimeString('ko-KR'));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '저장 실패' }));
      }
    });
    return;
  }

  // 파일 서빙
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();

  if (!ext) {
    filePath += '.html';
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 - 파일을 찾을 수 없어요', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('서버 오류', 'utf-8');
      }
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
};

const localIP = getLocalIP();

// HTTPS 인증서 로드
const options = {
  key: fs.readFileSync('cert.key'),
  cert: fs.readFileSync('cert.crt')
};

const server = https.createServer(options, httpHandler);

server.listen(PORT, () => {
  console.log('\n🚀 HTTPS 개발 서버 시작! (할일 메모장)\n');
  console.log(`📱 컴퓨터:      https://localhost:${PORT}`);
  console.log(`📱 휴대폰 (WiFi): https://${localIP}:${PORT}`);
  console.log(`📱 휴대폰 (추천):  https://localhost:${PORT}\n`);
  console.log('💡 휴대폰에서 https://192.168.219.107:3000 으로 접속하면');
  console.log('💡 "앱으로 설치" 버튼이 나타나서 앱처럼 설치할 수 있어요!');
  console.log('💡 코드를 수정하면 휴대폰에서 자동으로 새로고침됩니다.\n');
});
