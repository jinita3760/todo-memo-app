#!/usr/bin/env node
import admin from 'firebase-admin';
import fs from 'fs';
import readline from 'readline';

// Firebase Admin SDK 초기화
const serviceAccount = {
  type: "service_account",
  project_id: "schedule-memo-a5648",
  private_key_id: "a1b2c3d4e5f6g7h8i9j0",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----",
  client_email: "firebase-adminsdk@schedule-memo-a5648.iam.gserviceaccount.com",
  client_id: "123456789",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40schedule-memo-a5648.iam.gserviceaccount.com"
};

// 더 간단한 방식: 직접 Realtime Database에 접근
const databaseURL = "https://schedule-memo-a5648-default-rtdb.asia-southeast1.firebasedatabase.app";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n📝 할일 메모장 - 일정 수정 도구\n');
  console.log('1. 새 일정 추가');
  console.log('2. 현재 일정 보기');
  console.log('3. 로컬 파일에서 로드');
  console.log('4. 종료\n');

  const choice = await prompt('선택 (1-4): ');

  switch(choice) {
    case '1':
      await addSchedule();
      break;
    case '2':
      await viewSchedule();
      break;
    case '3':
      await loadFromFile();
      break;
    case '4':
      console.log('\n👋 종료합니다!');
      rl.close();
      process.exit(0);
    default:
      console.log('❌ 잘못된 선택입니다.');
  }

  console.log('\n');
  main();
}

async function addSchedule() {
  const text = await prompt('\n📌 일정 제목: ');
  const category = await prompt('📂 카테고리 (today/week/later): ');
  const priority = await prompt('⭐ 우선순위 (top/normal - 공백: normal): ') || 'normal';

  // schedule-data.json 읽기
  const data = JSON.parse(fs.readFileSync('schedule-data.json', 'utf-8'));

  const scheduleItem = {
    text,
    done: false
  };

  if (priority === 'top') {
    scheduleItem.priority = 'top';
  }

  if (data[`list-${category}`]) {
    data[`list-${category}`].push(scheduleItem);
    fs.writeFileSync('schedule-data.json', JSON.stringify(data, null, 2));
    console.log(`\n✅ "${text}" 추가됐어요!`);
  } else {
    console.log(`\n❌ 잘못된 카테고리: ${category}`);
  }
}

async function viewSchedule() {
  const data = JSON.parse(fs.readFileSync('schedule-data.json', 'utf-8'));

  console.log('\n📅 현재 일정:\n');
  Object.entries(data).forEach(([category, items]) => {
    if (Array.isArray(items) && items.length > 0) {
      console.log(`\n[${category.toUpperCase()}]`);
      items.forEach((item, idx) => {
        const icon = item.done ? '✅' : '⭐';
        const priority = item.priority === 'top' ? ' 🔴 TOP' : '';
        console.log(`  ${idx + 1}. ${icon} ${item.text}${priority}`);
      });
    }
  });
}

async function loadFromFile() {
  const data = JSON.parse(fs.readFileSync('schedule-data.json', 'utf-8'));
  console.log('\n✅ schedule-data.json 로드됨');
  console.log('이 파일이 Firebase에 동기화됩니다.');
}

main().catch(console.error);
