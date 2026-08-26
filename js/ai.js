// AI 반응 (브라우저 내 Gemma/WebLLM) — 감정을 자동 판단해 위로하거나 같이 화내줌
// ponytail: WebGPU 미지원·실패 시 정해둔 답변으로 폴백
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

const MODEL_ID = 'gemma-2-2b-it-q4f16_1-MLC';
const SYSTEM_PROMPT_AUTO = "너는 '감정쓰레기통' 앱의 AI 친구다. 사용자가 버린 감정 글을 읽고 상태를 먼저 판단한다. 분노·짜증·억울함이 티가 나면 사용자 편에서 함께 강하게 화내주고, 슬픔·외로움·불안·지침이면 따뜻하게 위로한다. 2~3문장, 한국어 반말. 판단 과정은 설명하지 말고 바로 반응만 말한다. 폭력 조장이나 특정인 비난은 하지 않는다.";

// WebGPU 미지원·로딩 실패 시 폴백 답변
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

let enginePromise = null;

function loadEngine(onProgress) {
  if (!('gpu' in navigator)) return Promise.reject(new Error('NO_WEBGPU'));
  if (!enginePromise) {
    enginePromise = import('https://esm.run/@mlc-ai/web-llm')
      .then(webllm => webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: p => { if (onProgress) onProgress(p); },
      }));
  }
  return enginePromise;
}

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

  loadEngine(p => {
    if (p.progress < 1) {
      responseText.textContent = `AI 불러오는 중... ${Math.round(p.progress * 100)}% (첫 1회만 다운로드, 와이파이 권장)`;
    }
  })
    .then(engine => engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_AUTO },
        { role: 'user', content: (text || '').slice(0, 1000) },
      ],
      max_tokens: 150,
      temperature: 0.9,
    }))
    .then(r => {
      const out = r.choices && r.choices[0] && r.choices[0].message ? (r.choices[0].message.content || '').trim() : '';
      if (out) {
        responseText.textContent = out;
        // 공개 글이면 같은 문장을 피드 댓글로도 저장 → 다른 사람들이 보고 재방문 (익명으로 표시)
        if (postId && typeof window.sbAddComment === 'function') {
          window.sbAddComment(postId, out);
        }
      }
      else useFallback();
    })
    .catch(() => useFallback());
}
