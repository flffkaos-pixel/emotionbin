// AI 반응 — 즉시 달지 않고 1~2시간 뒤 예약 댓글.
// 글 공개 시 알림창에 "몇 시간 후 AI가 댓글을 달 예정"만 안내하고,
// 실제 댓글은 서버 크론(ai-comment-cron)이 지연 후 공개 글에 단다.
const AI_MODES = {
  auto: { label: '🤖 AI 예약 알림' },
  none: { label: 'AI 끄기' },
};

let selectedAIMode = 'auto';

function selectAIMode(mode) {
  selectedAIMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

// 지연 후보: 60 / 90 / 120분 — 글마다 랜덤 (사용자 선택 아님)
const AI_DELAY_STEPS_MIN = [60, 90, 120];

function pickAiDelayMinutes() {
  return AI_DELAY_STEPS_MIN[Math.floor(Math.random() * AI_DELAY_STEPS_MIN.length)];
}

function formatAiDelayLabel(delayMin) {
  const lang = (typeof LANG !== 'undefined' && LANG) ? LANG : 'ko';
  if (lang === 'en') {
    if (delayMin < 90) return 'in about 1 hour';
    if (delayMin < 120) return 'in about 1 hour 30 min';
    return 'in about 2 hours';
  }
  if (lang === 'ja') {
    if (delayMin < 90) return '約1時間後';
    if (delayMin < 120) return '約1時間30分後';
    return '約2時間後';
  }
  if (delayMin < 90) return '약 1시간 후';
  if (delayMin < 120) return '약 1시간 30분 후';
  return '약 2시간 후';
}

function buildAiScheduleMessage(delayMin) {
  const when = formatAiDelayLabel(delayMin);
  const lang = (typeof LANG !== 'undefined' && LANG) ? LANG : 'ko';
  if (lang === 'en') {
    return `AI will leave an empathy comment on this post ${when}.\nIt will not appear right away — take your time.`;
  }
  if (lang === 'ja') {
    return `AIがこの投稿に共感コメントを${when}付けます。\nすぐには出ません — ゆっくりしてください。`;
  }
  return `AI가 ${when} 이 글에 공감 댓글을 달아줘요.\n지금은 바로 달리지 않아요 — 천천히 올게요.`;
}

function closeAIResponse() {
  const el = document.getElementById('ai-response');
  if (el) el.style.display = 'none';
}

// 즉시 생성하지 않고 예약 알림만 표시 (댓글은 서버가 1~2시간 뒤 단다)
// delayMin: 버릴 때 뽑은 랜덤 값 (app.js에서 전달, 서버 ai_due_at와 동일)
function getAIResponse(text, postId, delayMin) {
  if (selectedAIMode === 'none') return;
  const box = document.getElementById('ai-response');
  const responseText = document.getElementById('ai-response-text');
  const labelSpan = document.getElementById('ai-mode-label');
  if (!box || !responseText || !labelSpan) return;

  const delay = Number(delayMin) > 0 ? Number(delayMin) : pickAiDelayMinutes();
  box.style.display = 'block';
  labelSpan.textContent = '⏱️ ' + AI_MODES[selectedAIMode].label;
  responseText.textContent = buildAiScheduleMessage(delay);

  if (typeof showToast === 'function') {
    const when = formatAiDelayLabel(delay);
    const lang = (typeof LANG !== 'undefined' && LANG) ? LANG : 'ko';
    const toastMsg = lang === 'en'
      ? `🤖 AI will comment ${when}`
      : lang === 'ja'
        ? `🤖 AIが${when}コメントします`
        : `🤖 AI가 ${when} 댓글을 달아요`;
    showToast(toastMsg, 'success', 6000);
  }
}
