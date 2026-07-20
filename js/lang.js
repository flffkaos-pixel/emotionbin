const LANG = (navigator.language || 'ko').startsWith('ko') ? 'ko' : 'en';

const i18n = {
  'page-title': { ko: '감정쓰레기통 - 익명 감정 배출 & 실시간 3D 시각화', en: 'Emotional Trash Can - Anonymous Emotion Dumping & 3D Visualization' },
  'nav-trash-mountain': { ko: '쓰레기산', en: 'Trash Mountain' },
  'nav-public-feed': { ko: '공개 피드', en: 'Public Feed' },
  'nav-top10': { ko: '최악의 TOP 10', en: 'Worst TOP 10' },
  'nav-my-trash': { ko: '내 쓰레기통', en: 'My Trash' },
  'stat-dumped': { ko: '버려진 감정', en: 'Emotions Dumped' },
  'stat-today': { ko: '오늘 버려진', en: 'Dumped Today' },
  'stat-total-weight': { ko: '전체 무게', en: 'Total Weight' },
  'hero-title': { ko: '세상의 모든 감정 쓰레기가 모이는 곳', en: 'Where all emotional trash gathers' },
  'hero-subtitle': { ko: '당신의 모든 감정을 여기에 버리세요. 영원히 사라집니다.', en: 'Dump all your emotions here. They disappear forever.' },
  'hero-cta': { ko: '지금 감정 버리기', en: 'Dump Now' },
  'feed-title': { ko: '다른 사람의 감정', en: 'Others\' Emotions' },
  'feed-desc': { ko: '익명으로 남긴 다른 사람들의 감정. 응원 한마디가 큰 위로가 됩니다.', en: 'Anonymous emotions from others. A word of support can be great comfort.' },
  'top10-title': { ko: '오늘의 최악의 쓰레기 TOP 10', en: 'Worst Trash TOP 10 Today' },
  'top10-desc': { ko: '오늘 가장 무거운 감정을 버린 익명의 쓰레기들', en: 'Anonymous dumpers of the heaviest emotions today' },
  'mytrash-title': { ko: '내 쓰레기통', en: 'My Trash Bin' },
  'mytrash-desc': { ko: '당신이 버린 모든 감정들. 당신만 볼 수 있습니다.', en: 'All the emotions you dumped. Only you can see them.' },
  'mytrash-hint': { ko: '🖱️ 드래그로 회전 · 휠로 줌', en: '🖱️ Drag to rotate · Scroll to zoom' },
  'mytrash-empty': { ko: '아직 버린 감정이 없습니다', en: 'No emotions dumped yet' },
  'mytrash-first': { ko: '첫 감정 버리기', en: 'Dump your first' },
  'modal-title': { ko: '감정 버리기', en: 'Dump Emotions' },
  'modal-desc': { ko: '당신의 감정을 모두 쏟아내세요. 아무도 당신을 알지 못합니다.', en: 'Pour out all your emotions. No one knows who you are.' },
  'modal-label': { ko: '당신의 감정을 마음껏 쏟아내세요', en: 'Pour out your emotions freely' },
  'modal-placeholder': { ko: '글자가 길수록 더 크고 무거운 쓰레기가 됩니다. 냉장고, TV, 자동차도 될 수 있어요.', en: 'Longer text = bigger, heavier trash. Can become a fridge, TV, or even a car.' },
  'modal-tags-legend': { ko: '감정 태그 (중복 선택 가능)', en: 'Emotion Tags (multi-select)' },
  'modal-privacy-legend': { ko: '공개 설정', en: 'Privacy Setting' },
  'modal-public': { ko: '익명으로 공개 (쓰레기산에 표시됨)', en: 'Anonymous (shown on Trash Mountain)' },
  'modal-private': { ko: '비공개 (나만 보기)', en: 'Private (only me)' },
  'modal-submit': { ko: '쓰레기통에 버리기', en: 'Dump into Trash Bin' },
  'modal-trash-hint': { ko: '글자수에 따라 자동으로 쓰레기 종류가 결정됩니다', en: 'Trash type is auto-determined by text length' },
  'footer-brand': { ko: '🗑️ 감정쓰레기통', en: '🗑️ Emotional Trash Can' },
  'footer-desc': { ko: '익명으로 감정을 배출하고 3D 쓰레기산으로 시각화하는 서비스. 계정 없이 무료.', en: 'Anonymous emotional dumping visualized as a 3D trash mountain. Free, no account needed.' },
  'footer-quick': { ko: '바로가기', en: 'Quick Links' },
  'footer-info': { ko: '정보', en: 'Info' },
  'footer-about': { ko: '소개', en: 'About' },
  'footer-contact': { ko: '문의하기', en: 'Contact' },
  'footer-privacy': { ko: '개인정보 처리방침', en: 'Privacy Policy' },
  'footer-terms': { ko: '이용약관', en: 'Terms of Service' },
  'footer-disclaimer': { ko: '면책조항', en: 'Disclaimer' },
  'footer-copy': { ko: '© 2026 감정쓰레기통. 모든 데이터는 브라우저에 로컬 저장됩니다 · 익명성 보장', en: '© 2026 Emotional Trash Can. All data stored locally in browser · Anonymity guaranteed' },
};

// tags display names
const tagI18n = {
  '분노': { en: 'Anger' },
  '짜증': { en: 'Irritation' },
  '후회': { en: 'Regret' },
  '실망': { en: 'Disappointment' },
  '서운함': { en: 'Hurt Feelings' },
  '상처': { en: 'Emotional Wound' },
  '슬픔': { en: 'Sadness' },
  '불안': { en: 'Anxiety' },
  '스트레스': { en: 'Stress' },
  '외로움': { en: 'Loneliness' },
  '무기력': { en: 'Lethargy' },
  '지침': { en: 'Exhaustion' },
};

// trash type names for preview
const trashTypeI18n = {
  '캔': { en: 'Can' },
  '페트병': { en: 'PET Bottle' },
  '종이상자': { en: 'Cardboard Box' },
  '나무': { en: 'Wood Log' },
  '냉장고': { en: 'Fridge' },
  'TV': { en: 'TV' },
  '자동차': { en: 'Car' },
};

function applyLanguage() {
  if (LANG === 'ko') return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = i18n[key]?.[LANG];
    if (text) el.textContent = text;
  });

  // translate tags display
  document.querySelectorAll('.tag').forEach(el => {
    const tag = el.dataset.tag;
    const translated = tagI18n[tag]?.[LANG];
    if (translated) el.textContent = '#' + translated;
  });

  // translate trash type preview
  document.querySelectorAll('[data-i18n-trash]').forEach(el => {
    const key = el.dataset.i18nTrash;
    const text = trashTypeI18n[key]?.[LANG];
    if (text) el.textContent = text;
  });

  // update html lang
  document.documentElement.lang = LANG === 'en' ? 'en-US' : 'ko-KR';
}
