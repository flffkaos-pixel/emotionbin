// AI 반응 — 서버(Supabase Edge Function + Gemini)로 생성. WebGPU 불필요, 어디서든 동작.
// ponytail: 서버 호출 실패 시 정해둔 답변으로 폴백
const AI_MODES = {
  auto: { label: '🤖 AI 반응' },
  none: { label: 'AI 끄기' },
};

let selectedAIMode = 'auto';

function selectAIMode(mode) {
  selectedAIMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

// Supabase 프로젝트 ref (supabase-db.js와 동일)
const SB_REF = 'ufvqbjduffflcijtrkkn';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdnFiamR1ZmZmbGNpanRya2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjM5NDcsImV4cCI6MjA5ODczOTk0N30.Yp2R_4HWxZiDcyHD91Bd03kf6S92qhLkwnw-B6FzkNc';
const AI_FN_URL = `https://${SB_REF}.supabase.co/functions/v1/ai-reply`;

// 서버 실패 시 폴백 답변
const FALLBACK_RESPONSES = {
  warm: [
    '여기까지 버리러 와줘서 고마워. 그 감정, 충분히 무거웠을 것 같아.',
    '참아온 시간들도 다 의미 있었어. 오늘은 여기 두고 가볍게 가자.',
    '그렇게 느끼는 게 당연해. 너무 나 자신을 몰아붙이지 말자.',
    '오늘 하루도 정말 고생했어. 이 감정은 여기서 안전하게 쉬게 해줄게.',
    '버렸으니까 됐어. 남은 하루는 조금만 더 너를 돌보자.',
  ],
  rage: [
    '맞아, 그 감정 전부 맞아. 더 화내. 더 욕해. 세상이 좆같은 건 사실이니까.',
    '좋아, 다 토해내. 참지 마. 너가 느끼는 그 모든 감정은 다 정당해.',
    '그래, 인생이 좆같지. 근데 그게 끝은 아니야. 더 쎄게 욕하고 더 쎄게 분노해.',
    '오늘 하루도 참느라 고생했어. 이제 여기서 다 쏟아버려. 아무도 너를 판단하지 않아.',
    '참지마. 터져. 니 감정은 소중하니까. 여기서는 자유롭게 썩어도 돼.',
  ],
};

function closeAIResponse() {
  document.getElementById('ai-response').style.display = 'none';
}

function getAIResponse(text, postId) {
  if (selectedAIMode === 'none') return;
  const box = document.getElementById('ai-response');
  const responseText = document.getElementById('ai-response-text');
  const labelSpan = document.getElementById('ai-mode-label');
  box.style.display = 'block';
  labelSpan.textContent = AI_MODES[selectedAIMode].label;
  responseText.textContent = '감정 읽는 중...';

  const useFallback = () => {
    const pool = Math.random() < 0.5 ? FALLBACK_RESPONSES.warm : FALLBACK_RESPONSES.rage;
    responseText.textContent = pool[Math.floor(Math.random() * pool.length)];
  };

  fetch(AI_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_ANON_KEY,
      'Authorization': 'Bearer ' + SB_ANON_KEY,
    },
    body: JSON.stringify({ content: (text || '').slice(0, 1000), postId: postId || null }),
  })
    .then(r => r.json())
    .then(d => {
      if (d && d.reply) responseText.textContent = d.reply;
      else useFallback();
    })
    .catch(() => useFallback());
}