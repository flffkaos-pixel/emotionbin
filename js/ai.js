const AI_MODES = {
  none: { label: 'AI 반응 안함', icon: '🚫' },
  rage: { label: '🔥 더 세게 토해내', icon: '🔥' },
  cold: { label: '🧊 냉정한 분석', icon: '🧊' },
};

let selectedAIMode = 'none';

function selectAIMode(mode) {
  selectedAIMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

const RAGE_RESPONSES = [
  '맞아, 그 감정 전부 맞아. 더 화내. 더 욕해. 세상이 좆같은 건 사실이니까.',
  '좋아, 다 토해내. 참지 마. 너가 느끼는 그 모든 감정은 다 정당해.',
  '그래, 인생이 좆같지. 근데 그게 끝은 아니야. 더 쎄게 욕하고 더 쎄게 분노해.',
  '오늘 하루도 참느라 고생했어. 이제 여기서 다 쏟아버려. 아무도 너를 판단하지 않아.',
  '좋아. 더 해. 너의 그 분노, 그 아픔, 전부 여기 쏟아부어. 쓰레기통이 다 받아줄게.',
  '세상이 널 이렇게 만들었어. 그 모든 좆같은 일들, 여기에 다 던져버려.',
  '더 해. 니 속에 있는 그 모든 검은 감정들을 꺼내. 여기선 안전해.',
  '좆같은 놈들, 좆같은 상황, 좆같은 기분. 다 들어줄게. 계속해.',
  '참지마. 터져. 니 감정은 소중하니까. 여기서는 자유롭게 썩어도 돼.',
  '그래, 그렇게 분노하는 너도 괜찮아. 약한 척 하지마. 있는 그대로 내뱉어.',
];

const COLD_RESPONSES = [
  '당신의 감정은 현재 상황에 대한 자연스러운 반응입니다. 하지만 감정이 행동을 지배하게 두지 마세요. 이 감정이 말하려는 본질적인 메시지가 무엇인지 생각해보세요.',
  '분노는 보통 기대와 현실의 괴리에서 발생합니다. 당신이 기대한 것은 무엇이고, 현실은 어땠나요? 그 차이를 좁힐 수 있는 방법을 고민해보는 건 어떨까요.',
  '슬픔은 상실에 대한 반응입니다. 당신이 무엇을 잃었다고 느끼는지 객관적으로 파악해보세요. 그것이 되찾을 수 있는 것인지, 받아들여야 하는 것인지 판단하는 것이 중요합니다.',
  '불안은 미래에 대한 통제 불능에서 옵니다. 지금 당장 통제할 수 있는 것이 무엇인지 나열해보고, 거기서부터 시작하세요.',
  '당신의 감정은 유효합니다. 하지만 감정은 사실이 아니라 사실에 대한 해석입니다. 같은 상황을 다른 시각에서 바라보면 다른 감정이 올 수도 있습니다.',
  '무기력함은 종종 너무 많은 선택지나 너무 큰 목표에서 비롯됩니다. 가장 작은 것부터 시작하세요. 움직임이 동기를 만듭니다.',
  '후회는 과거에 대한 집착입니다. 후회의 에너지를 미래를 위한 교훈으로 전환할 수 있다면, 그것은 더 이상 후회가 아니라 경험입니다.',
  '당신이 느끼는 외로움은 연결의 부재가 아니라, 진정한 연결에 대한 갈망입니다. 양보다 질입니다. 당신을 진정으로 이해하는 사람은 소수여도 충분합니다.',
  '스트레스는 능력과 요구 사이의 불균형에서 옵니다. 요구를 낮추거나 능력을 키우거나. 당신이 선택할 수 있습니다.',
  '지금 당신의 감정을 인식하고 표현한 것 자체가 중요한 첫걸음입니다. 감정을 직시하는 용기를 가졌다는 사실을 기억하세요.',
];

function getAIResponse(text, tags) {
  if (selectedAIMode === 'none') return null;

  const responseDiv = document.getElementById('ai-response');
  const responseText = document.getElementById('ai-response-text');
  const labelSpan = document.getElementById('ai-mode-label');

  const mode = AI_MODES[selectedAIMode];
  responseDiv.style.display = 'block';
  labelSpan.textContent = mode.label;

  const pool = selectedAIMode === 'rage' ? RAGE_RESPONSES : COLD_RESPONSES;
  const response = pool[Math.floor(Math.random() * pool.length)];

  setTimeout(() => {
    responseText.textContent = response;
  }, 300 + Math.random() * 500);

  return response;
}
