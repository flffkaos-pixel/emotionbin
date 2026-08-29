// 마케팅 콘텐츠 자동 생성기 — 외부 API/계정 불필요, 날짜 기반으로 매일 다른 콘텐츠 생성
// ponytail: 순수 템플릿 회전 방식. 외부 LLM API 연결 없이 즉시 동작 (날짜를 시드로 사용)
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const APP = '감정쓰레기통';
const STORE = 'https://play.google.com/store/apps/details?id=com.emotionbin.app';
const WEB = 'https://emotionbin.pages.dev';

// 감정 키워드 풀 (연속 랜덤보다 날짜 기반 회전)
const THEMES = ['스트레스', '외로움', '불안', '슬픔', '분노', '후회', '무기력', '지침'];

// 숏폼 대본 템플릿 (15초, 체험형)
const SHORTS = [
  (t) => `[화면] 앱 열고 감정 쓰는 장면\n"오늘 ${t} 때문에 힘들었는데..."\n[탭] 쓰레기통에 버리기\n[전환] 3D 쓰레기산이 하나 더 쌓임\n[자막] "말 못 한 ${t}, 여기에 버리고 숨 쉬기"\n#감정쓰레기통 #감정일기 #${t}`,
  (t) => `[화면] 감정 무게가 쓰기 전/후로 바뀌는 숫자\n"${t}, 내가 들어보니 몇 kg?"\n[캡션] 쓰기 전 多 → 쓰고 나니 가벼워짐\n[자막] "${t}을(를) 이름 붙여서 버리면 가벼워져요"\n#감정쓰레기통 #마음정리 #${t}`,
  (t) => `[화면] 익명으로 글 쓰는 모습 (계정 없음 강조)\n[자막] "아무도 몰라. 그래서 편해."\n[탭] 공개로 버리기 → 3D 산에 표시\n[자막] "익명이라서 솔직해지는 순간"\n#감정쓰레기통 #익명 #${t}`,
  (t) => `[화면] 태운 감정이 불타는 연출\n[캡션] "${t}을(를) 태워버리는 날"\n[자막] "깨끗하게 태우고 오늘 하루 리셋"\n#감정쓰레기통 #쓰레기산 #${t}`,
];

// 커뮤니티 소개글 (진정성 위주, 스팸 금지)
const COMMUNITY = [
  (t) => `저도 ${t} 때문에 마음이 무거운 날이 많아서, 생각을 글로 비워내는 습관을 들이고 있어요.\n'${APP}'이라는 앱을 써봤는데 — 회원가입 없이 익명으로 감정을 적고, 공개하면 3D 쓰레기산에 쌓이는 게 묘하게 후련하더라고요. 광고로 운영되는 무료 앱이고 개인정보는 브라우저에만 저장된다고 해서 안심돼요.\n혹시 마음을 정리하는 나만의 방법 있으신가요?`,
  (t) => `말하기 힘든 ${t}이(가) 있을 때, 먼저 글로 적어보면 마음이 좀 정리되더라고요.\n저는 요즘 '${APP}'라는 앱을 써요. 쓰기 전 감정 무게 → 쓰고 난 무게를 숫자로 비교해 주는데, 제 마음이 실제로 가벼워지는 게 보여서 계속 쓰게 되네요.\n여러분은 ${t} 받을 때 어떻게 푸세요?`,
];

// 리뷰 유도 · ASO 보조 문구
const ASK_REVIEW = [
  () => `쓰고 계신데 불편한 점이나 있으셨던 점 있다면 솔직 리뷰 부탁드려요! 리뷰 하나가 큰 힘이 됩니다 🙏 ${STORE}`,
  () => `좋으셨다면 스토어에서 별점 하나 부탁드려요 ⭐ 다음 업데이트는 AI 공감 기능 강화로 준비 중이에요!`,
  () => `여러분이 남겨주신 감정이 실제로 3D 감정 산을 만들고 있어요! 오늘도 하나 버리고 가볍게 가요 😌 ${WEB}`,
];

function seedNum(date) {
  let s = 0;
  for (const ch of date) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return s;
}

function generate(dateStr) {
  const seed = seedNum(dateStr);
  const theme = THEMES[seed % THEMES.length];
  const short = SHORTS[(seed >> 3) % SHORTS.length](theme);
  const community = COMMUNITY[(seed >> 5) % COMMUNITY.length](theme);
  const ask = ASK_REVIEW[(seed >> 7) % ASK_REVIEW.length]();

  return `# ${APP} — 오늘의 마케팅 콘텐츠 (${dateStr})

> 주제 키워드: **${theme}** · 수동 복사용. 그대로 올리되 커뮤니티 규정은 꼭 지켜주세요.

---

## 1. 숏폼 대본 (틱톡/릴스/쇼츠, 15초)

${short}

---

## 2. 커뮤니티 소개글 (네이버 카페 / 레딧 등)

${community}

---

## 3. 리뷰 유도 · 홍보 문구

${ask}

---

## 4. 오늘 추천 태그
#감정쓰레기통 #감정일기 #${theme} #익명일기 #마음정리
`;
}

// ponytail: self-check — 인자 없이 실행하면 오늘 날짜 파일을 생성
function main() {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' })
    .format(new Date()); // YYYY-MM-DD (한국시간)
  const out = generate(today);
  mkdirSync(join(ROOT, 'marketing'), { recursive: true });
  writeFileSync(join(ROOT, 'marketing', `${today}.md`), out, 'utf8');
  console.log(`생성 완료 → marketing/${today}.md`);
}

main();