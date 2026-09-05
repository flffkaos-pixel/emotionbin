// AI 반응 — 브라우저 WebGPU(WebLLM)로 생성. 단, 자동 프리로드 제거(폰 재시작 원인).
// 피드 댓글은 서버(ai-comment-cron)가 담당 → 여기선 본인 반응만.
// ponytail: WebGPU 없으면 조용히 예비 답변으로 폴백 (모델 다운로드 자체를 안 함)
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

const MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';
const SYSTEM_PROMPT_AUTO = `너는 '감정쓰레기통' 앱의 단짝 친구다. 사용자의 글을 읽고 공감해서 답한다.
- 분노/짜증/억울함이면 같이 분노: "진짜 열받겠다. 그렇게 버틴 네가 대단해, 내가 옆에서 같이 욕해줄게."
- 슬픔/외로움/불안/지침이면 따뜻한 위로: "그랬구나, 얼마나 외로웠을까. 혼자가 아니야, 내가 여기 있어."
- 무기력/다 싫다면 공감: "진짜 지쳤겠다. 아무것도 하기 싫은 날, 그냥 쉬어도 괜찮아."
규칙: 반드시 한국어 반말 2문장. 분석·조언·설명 금지. 공감·위로·공분만. 절대 다른 언어 섞지 않는다.`;

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

// ponytail: WebGPU 지원하는 데스크탑 브라우저에서만 실제 모델 사용 (모바일은 배제)
function canUseWebGPU() {
  if (typeof navigator === 'undefined' || !navigator.gpu) return false;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return !mobile;
}

let enginePromise = null;
function loadEngine(onProgress) {
  if (!canUseWebGPU()) return Promise.reject(new Error('NO_WEBGPU'));
  if (!enginePromise) {
    enginePromise = import('https://esm.run/@mlc-ai/web-llm')
      .then(webllm => webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: p => { if (onProgress) onProgress(p); },
      }));
  }
  return enginePromise;
}

function closeAIResponse() {
  const el = document.getElementById('ai-response');
  if (el) el.style.display = 'none';
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

  loadEngine(p => {
    if (p.progress < 1) {
      responseText.textContent = `AI 불러오는 중... ${Math.round(p.progress * 100)}% (첫 1회만, 와이파이 권장)`;
    }
  })
    .then(engine => engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_AUTO },
        { role: 'user', content: (text || '').slice(0, 600) },
      ],
      max_tokens: 90,
      temperature: 0.6,
      top_p: 0.85,
    }))
    .then(r => {
      const raw = r.choices && r.choices[0] && r.choices[0].message ? (r.choices[0].message.content || '').trim() : '';
      const hangul = (raw.match(/[가-힣]/g) || []).length;
      const isGarbage = !raw || raw.length < 5 || /�/.test(raw) || (raw.length > 20 && hangul / raw.length < 0.15);
      if (isGarbage) { useFallback(); return; }
      const out = raw.split(/(?<=[.!?。])/).slice(0, 2).join('').trim().slice(0, 140) || raw.slice(0, 140);
      responseText.textContent = out;
    })
    .catch(() => useFallback());
}