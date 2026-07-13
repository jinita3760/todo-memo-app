import sharp from 'sharp';

async function convertIcon() {
  try {
    // 192x192 아이콘
    await sharp('icon.svg')
      .resize(192, 192)
      .png()
      .toFile('icons/icon-192.png');
    console.log('✓ icon-192.png 생성 완료');

    // 512x512 아이콘
    await sharp('icon.svg')
      .resize(512, 512)
      .png()
      .toFile('icons/icon-512.png');
    console.log('✓ icon-512.png 생성 완료');

    console.log('\n✨ 예쁜 아이콘이 완성되었습니다!');
  } catch (err) {
    console.error('오류:', err.message);
  }
}

convertIcon();
