const NAV_LANG = (navigator.language || 'ko');
const LANG = NAV_LANG.startsWith('ko') ? 'ko' : NAV_LANG.startsWith('ja') ? 'ja' : 'en';

const i18n = {
  'page-title': { ko: '감정쓰레기통 - 익명 감정 배출 & 실시간 3D 시각화', en: 'Emotional Trash Can - Anonymous Emotion Dumping & 3D Visualization', ja: '感情ゴミ箱 - 匿名感情排出＆リアルタイム3D可視化' },
  'nav-trash-mountain': { ko: '쓰레기산', en: 'Trash Mountain', ja: 'ゴミの山' },
  'nav-public-feed': { ko: '공개 피드', en: 'Public Feed', ja: '公開フィード' },
  'nav-top10': { ko: '최악의 TOP 10', en: 'Worst TOP 10', ja: '最悪のTOP10' },
  'nav-my-trash': { ko: '내 쓰레기통', en: 'My Trash', ja: 'マイゴミ箱' },
  'stat-dumped': { ko: '버려진 감정', en: 'Emotions Dumped', ja: '捨てられた感情' },
  'stat-today': { ko: '오늘 버려진', en: 'Dumped Today', ja: '今日捨てた' },
  'stat-total-weight': { ko: '전체 무게', en: 'Total Weight', ja: '合計の重さ' },
  'hero-title': { ko: '세상의 모든 감정 쓰레기가 모이는 곳', en: 'Where all emotional trash gathers', ja: '世界中の感情ゴミが集まる場所' },
  'hero-subtitle': { ko: '당신의 모든 감정을 여기에 버리세요. 영원히 사라집니다.', en: 'Dump all your emotions here. They disappear forever.', ja: 'あなたの感情をここに捨てよう。永遠に消えていく。' },
  'hero-cta': { ko: '지금 감정 버리기', en: 'Dump Now', ja: '今すぐ捨てる' },
  'feed-title': { ko: '다른 사람의 감정', en: 'Others\' Emotions', ja: '他の人の感情' },
  'feed-desc': { ko: '익명으로 남긴 다른 사람들의 감정. 응원 한마디가 큰 위로가 됩니다.', en: 'Anonymous emotions from others. A word of support can be great comfort.', ja: '匿名で残された他の人の感情。一言の応援が大きな慰めに。' },
  'top10-title': { ko: '오늘의 최악의 쓰레기 TOP 10', en: 'Worst Trash TOP 10 Today', ja: '今日の最悪のゴミTOP10' },
  'top10-desc': { ko: '오늘 가장 무거운 감정을 버린 익명의 쓰레기들', en: 'Anonymous dumpers of the heaviest emotions today', ja: '今日いちばん重い感情を捨てた匿名のゴミたち' },
  'mytrash-title': { ko: '내 쓰레기통', en: 'My Trash Bin', ja: 'マイゴミ箱' },
  'mytrash-desc': { ko: '당신이 버린 모든 감정들. 당신만 볼 수 있습니다.', en: 'All the emotions you dumped. Only you can see them.', ja: 'あなたが捨てた感情すべて。あなただけが見られます。' },
  'mytrash-hint': { ko: '🖱️ 드래그로 회전 · 휠로 줌', en: '🖱️ Drag to rotate · Scroll to zoom', ja: '🖱️ ドラッグで回転・ホイールでズーム' },
  'mytrash-empty': { ko: '아직 버린 감정이 없습니다', en: 'No emotions dumped yet', ja: 'まだ捨てた感情がありません' },
  'mytrash-first': { ko: '첫 감정 버리기', en: 'Dump your first', ja: '最初の感情を捨てる' },
  'modal-title': { ko: '감정 버리기', en: 'Dump Emotions', ja: '感情を捨てる' },
  'modal-desc': { ko: '당신의 감정을 모두 쏟아내세요. 아무도 당신을 알지 못합니다.', en: 'Pour out all your emotions. No one knows who you are.', ja: '感情を全部吐き出そう。誰もあなたを知らない。' },
  'modal-label': { ko: '당신의 감정을 마음껏 쏟아내세요', en: 'Pour out your emotions freely', ja: '感情を思う存分吐き出そう' },
  'modal-placeholder': { ko: '글자가 길수록 더 크고 무거운 쓰레기가 됩니다. 냉장고, TV, 자동차도 될 수 있어요.', en: 'Longer text = bigger, heavier trash. Can become a fridge, TV, or even a car.', ja: '文字が長いほど大きなゴミになります。冷蔵庫やテレビ、車にもなれる。' },
  'modal-tags-legend': { ko: '감정 태그 (중복 선택 가능)', en: 'Emotion Tags (multi-select)', ja: '感情タグ（複数選択可）' },
  'modal-privacy-legend': { ko: '공개 설정', en: 'Privacy Setting', ja: '公開設定' },
  'modal-public': { ko: '익명으로 공개 (쓰레기산에 표시됨)', en: 'Anonymous (shown on Trash Mountain)', ja: '匿名で公開（ゴミの山に表示）' },
  'modal-private': { ko: '비공개 (나만 보기)', en: 'Private (only me)', ja: '非公開（自分のみ）' },
  'modal-submit': { ko: '쓰레기통에 버리기', en: 'Dump into Trash Bin', ja: 'ゴミ箱に捨てる' },
  'modal-trash-hint': { ko: '글자수에 따라 자동으로 쓰레기 종류가 결정됩니다', en: 'Trash type is auto-determined by text length', ja: '文字数に応じてゴミの種類が自動決定' },
  'footer-brand': { ko: '🗑️ 감정쓰레기통', en: '🗑️ Emotional Trash Can', ja: '🗑️ 感情ゴミ箱' },
  'footer-desc': { ko: '익명으로 감정을 배출하고 3D 쓰레기산으로 시각화하는 서비스. 계정 없이 무료.', en: 'Anonymous emotional dumping visualized as a 3D trash mountain. Free, no account needed.', ja: '匿名で感情を排出し3Dゴミの山として可視化するサービス。アカウント不要で無料。' },
  'footer-quick': { ko: '바로가기', en: 'Quick Links', ja: 'クイックリンク' },
  'footer-info': { ko: '정보', en: 'Info', ja: '情報' },
  'footer-about': { ko: '소개', en: 'About', ja: '紹介' },
  'footer-contact': { ko: '문의하기', en: 'Contact', ja: 'お問い合わせ' },
  'footer-privacy': { ko: '개인정보 처리방침', en: 'Privacy Policy', ja: 'プライバシーポリシー' },
  'footer-terms': { ko: '이용약관', en: 'Terms of Service', ja: '利用規約' },
  'footer-disclaimer': { ko: '면책조항', en: 'Disclaimer', ja: '免責事項' },
  'footer-copy': { ko: '© 2026 감정쓰레기통. 모든 데이터는 브라우저에 로컬 저장됩니다 · 익명성 보장', en: '© 2026 Emotional Trash Can. All data stored locally in browser · Anonymity guaranteed', ja: '© 2026 感情ゴミ箱. すべてのデータはブラウザにローカル保存・匿名性保証' },
};

// tags display names
const tagI18n = {
  '분노': { en: 'Anger', ja: '怒り' },
  '짜증': { en: 'Irritation', ja: 'イライラ' },
  '후회': { en: 'Regret', ja: '後悔' },
  '실망': { en: 'Disappointment', ja: '失望' },
  '서운함': { en: 'Hurt Feelings', ja: '寂しさ' },
  '상처': { en: 'Emotional Wound', ja: '傷' },
  '슬픔': { en: 'Sadness', ja: '悲しみ' },
  '불안': { en: 'Anxiety', ja: '不安' },
  '스트레스': { en: 'Stress', ja: 'ストレス' },
  '외로움': { en: 'Loneliness', ja: '孤独' },
  '무기력': { en: 'Lethargy', ja: '無気力' },
  '지침': { en: 'Exhaustion', ja: '疲労' },
};

// trash type names for preview
const trashTypeI18n = {
  '캔': { en: 'Can', ko: '깡통', ja: '缶' },
  '박스': { en: 'Box', ko: '박스', ja: '箱' },
  'TV': { en: 'TV', ko: 'TV', ja: 'テレビ' },
  '냉장고': { en: 'Fridge', ko: '냉장고', ja: '冷蔵庫' },
  '자동차': { en: 'Car', ko: '자동차', ja: '車' },
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
  document.documentElement.lang = LANG === 'ja' ? 'ja-JP' : LANG === 'en' ? 'en-US' : 'ko-KR';
}