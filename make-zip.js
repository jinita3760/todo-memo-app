import { createWriteStream } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

try {
  // archiver 설치 확인
  execSync('npm list archiver 2>/dev/null || npm install archiver -q', { stdio: 'pipe' });
  
  const archiver = (await import('archiver')).default;
  const output = createWriteStream('netlify-deploy.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('✅ ZIP 파일 생성 완료!');
    console.log(`📁 크기: ${Math.round(archive.pointer() / 1024)}KB`);
  });

  archive.on('error', (err) => { throw err; });
  archive.pipe(output);

  // 파일 추가
  archive.file('index.html', { name: 'netlify-deploy/index.html' });
  archive.file('manifest.json', { name: 'netlify-deploy/manifest.json' });
  archive.file('sw.js', { name: 'netlify-deploy/sw.js' });
  archive.file('netlify.toml', { name: 'netlify-deploy/netlify.toml' });
  archive.file('schedule-data.json', { name: 'netlify-deploy/schedule-data.json' });
  archive.file('icons/icon-192.png', { name: 'netlify-deploy/icons/icon-192.png' });
  archive.file('icons/icon-512.png', { name: 'netlify-deploy/icons/icon-512.png' });
  archive.append('/*  /index.html  200', { name: 'netlify-deploy/_redirects' });

  await archive.finalize();
} catch (err) {
  console.error('❌ 오류:', err.message);
}
