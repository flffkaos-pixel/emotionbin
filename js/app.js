let myTrash = JSON.parse(localStorage.getItem('emotional_trash') || '[]');
let allTrash = JSON.parse(localStorage.getItem('all_emotional_trash') || '[]');
let firebasePosts = [];

function syncFromFirebase(fbList) {
  const fbIds = new Set(fbList.map(p => p.id));
  allTrash = allTrash.filter(t => t.privacy !== 'public' || fbIds.has(t.id));
  const localIds = new Set(allTrash.map(t => t.id));
  fbList.forEach(p => {
    if (localIds.has(p.id)) {
      const idx = allTrash.findIndex(t => t.id === p.id);
      if (idx >= 0) {
        allTrash[idx].comments = p.comments || [];
        allTrash[idx].reactions = p.reactions || {};
      }
    } else {
      allTrash.push(p);
      localIds.add(p.id);
      if (typeof scheduleTrashItem === 'function') scheduleTrashItem(p);
    }
  });
  allTrash.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  if (allTrash.length > 500) allTrash = allTrash.slice(0, 500);
  localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
}

function normalizeWeight(item) {
  const len = (item.content || '').length;
  if (!item.weightBefore || item.weightBefore < 5) {
    item.weightBefore = Math.min(200, 30 + Math.floor(len / 20));
  }
  if (!item.weightAfter || item.weightAfter < 1) {
    item.weightAfter = Math.max(5, Math.floor((item.weightBefore || 30) * 0.4));
  }
  item.weightDiff = (item.weightBefore || 30) - (item.weightAfter || 5);
  return item;
}

let needsSave = false;
allTrash.forEach(item => { const orig = item.weightBefore; normalizeWeight(item); if (item.weightBefore !== orig) needsSave = true; });
myTrash.forEach(item => { const orig = item.weightBefore; normalizeWeight(item); if (item.weightBefore !== orig) needsSave = true; });
if (needsSave) {
  localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
  localStorage.setItem('emotional_trash', JSON.stringify(myTrash));
}

let selectedTags = [];
let pendingDumpData = null;


function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showSection('mountain');
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`section-${id}`).classList.add('active');
  document.querySelector(`.nav-link[onclick*="${id}"]`)?.classList.add('active');

  setAutoRotate(id === 'mountain');

  if (id === 'top10') renderTop10();
  if (id === 'feed') renderFeed();
  if (id === 'mytrash') {
    renderMyTrash();
    if (typeof ensureDrumReady === 'function') {
      setTimeout(ensureDrumReady, 100);
      setTimeout(() => rebuildDrumFromStorage(), 600);
    }
  }
}

function openDumpModal() {
  document.getElementById('dump-modal').classList.add('active');
  document.getElementById('dump-btn').classList.remove('loading');
  document.getElementById('ai-response').style.display = 'none';
  document.body.style.overflow = 'hidden';
}

function closeDumpModal() {
  document.getElementById('dump-modal').classList.remove('active');
  document.body.style.overflow = '';
  resetForm();

  if (pendingDumpData) {
    const data = pendingDumpData;
    pendingDumpData = null;

    if (typeof createExplosion === 'function') {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      createExplosion(cx, cy);
    }

    setTimeout(() => {
      try {
        if (typeof scheduleTrashItem === 'function') scheduleTrashItem(data);
        if (typeof addTrashToDrum === 'function') addTrashToDrum(data);
        if (typeof updateStats === 'function') updateStats();
        if (typeof showToast === 'function') showToast('🗑️ ' + (data.trashType || '쓰레기') + ' 추가됨', 'success');
      } catch (e) {
        console.error('[dump animation error]', e);
        if (typeof showToast === 'function') showToast('감정이 기록되었습니다 ✓', 'success');
      }
    }, 200);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDumpModal();
});

document.getElementById('emotion-text').addEventListener('input', () => {
  const len = document.getElementById('emotion-text').value.length;
  document.getElementById('char-count').textContent = len;
  updateTrashPreview(len);
});

function getTrashTypeByLength(len) {
  if (len <= 50) return { icon: '🥫', label: '캔' };
  if (len <= 200) return { icon: '📦', label: '박스' };
  if (len <= 500) return { icon: '📺', label: 'TV' };
  if (len <= 1000) return { icon: '🧊', label: '냉장고' };
  return { icon: '🚗', label: '자동차' };
}

function updateTrashPreview(len) {
  const el = document.getElementById('trash-preview');
  const hintEl = document.getElementById('trash-type-hint-value');
  const t = getTrashTypeByLength(len);
  el.textContent = `${t.icon} ${t.label}`;
  if (hintEl) hintEl.textContent = `${t.icon} ${t.label}`;
}

document.querySelectorAll('.tag').forEach(el => {
  el.addEventListener('click', () => {
    const tag = el.dataset.tag;
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
      el.classList.remove('active');
    } else {
      selectedTags.push(tag);
      el.classList.add('active');
    }
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
});

async function dumpEmotion() {
  const text = document.getElementById('emotion-text').value.trim();
  if (!text) {
    showToast('감정을 입력해주세요', 'error');
    return;
  }

  const btn = document.getElementById('dump-btn');
  btn.classList.add('loading');

  const len = text.length;
  const weightBefore = Math.min(200, 30 + Math.floor(len / 20));
  const weightAfter = Math.max(5, Math.floor(weightBefore * 0.4));
  const privacy = document.querySelector('input[name="privacy"]:checked').value;

  const data = {
    id: Date.now(),
    content: text,
    tags: [...selectedTags],
    weightBefore,
    weightAfter,
    weightDiff: weightBefore - weightAfter,
    timestamp: Date.now(),
    privacy,
    trashType: getTrashTypeByLength(len).label,
  };

  myTrash.unshift(data);
  localStorage.setItem('emotional_trash', JSON.stringify(myTrash));

  if (privacy === 'public') {
    allTrash.unshift(data);
    if (allTrash.length > 500) allTrash = allTrash.slice(0, 500);
    localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
    if (firebasePosts.length > 0) {
      firebasePosts.unshift(data);
    }
    if (typeof sbSavePost === 'function') {
      sbSavePost(data);
    }
  }

  btn.classList.remove('loading');

  pendingDumpData = data;
  setTimeout(() => {
    if (pendingDumpData === data) {
      pendingDumpData = null;
      if (typeof createExplosion === 'function') {
        createExplosion(window.innerWidth / 2, window.innerHeight / 2);
      }
      try {
        if (typeof scheduleTrashItem === 'function') scheduleTrashItem(data);
        if (typeof addTrashToDrum === 'function') addTrashToDrum(data);
        if (typeof updateStats === 'function') updateStats();
        if (typeof showToast === 'function') showToast('🗐️ ' + (data.trashType || '쓰레기') + ' 추가됨', 'success');
      } catch (e) {
        console.error('[dump safety-net error]', e);
      }
    }
  }, 3000);

  closeDumpModal();
}

function resetForm() {
  document.getElementById('emotion-text').value = '';
  document.getElementById('char-count').textContent = '0';
  selectedTags = [];
  document.querySelectorAll('.tag.active').forEach(el => el.classList.remove('active'));
  updateTrashPreview(0);
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateStats() {
  const fb = firebasePosts.length > 0;
  const source = fb ? firebasePosts : allTrash;
  document.getElementById('total-trash-count').textContent = source.length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = source.filter(t => t.timestamp >= todayStart.getTime()).length;
  document.getElementById('today-trash-count').textContent = todayCount;
  const totalWeight = source.reduce((sum, t) => sum + (t.weightBefore || 0), 0);
  document.getElementById('total-weight').textContent = totalWeight >= 1000
    ? `${(totalWeight / 1000).toFixed(1)}t`
    : `${totalWeight}kg`;
}

function renderTop10() {
  const container = document.getElementById('top10-list');
  const publicTrash = allTrash.filter(t => t.privacy === 'public');
  const getReactions = (item) => {
    if (!item.reactions) return 0;
    return (item.reactions['공감'] || 0) + (item.reactions['위로'] || 0) + (item.reactions['응원'] || 0);
  };
  const sorted = [...publicTrash].sort((a, b) => getReactions(b) - getReactions(a) || (b.weightDiff || 0) - (a.weightDiff || 0));
  const top10 = sorted.slice(0, 10);

  if (top10.length === 0) {
    container.innerHTML = `
      <div class="empty-trash">
        <span class="empty-icon">🗑️</span>
        <p>아직 공개된 감정 쓰레기가 없습니다<br>첫 번째 쓰레기가 되어보세요</p>
      </div>
    `;
    return;
  }

  const tagColors = {
    '분노': '#ff1744', '짜증': '#ff6d00', '후회': '#9c27b0', '실망': '#4a148c',
    '서운함': '#5c6bc0', '상처': '#7b1fa2', '슬픔': '#1565c0', '불안': '#827717',
    '스트레스': '#e65100', '외로움': '#37474f', '무기력': '#616161', '지침': '#78909c',
  };

  container.innerHTML = top10.map((item, i) => `
    <div class="feed-item top10-item" style="animation-delay: ${i * 0.08}s" data-id="${item.id}">
      <div class="feed-header">
        <span>
          <span class="top10-rank-badge">#${i + 1}</span>
          <span class="feed-anon">익명</span>
        </span>
        <span class="feed-time">${formatTime(item.timestamp)}</span>
      </div>
      <div class="feed-text">${escapeHtml(item.content)}</div>
      ${item.tags && item.tags.length ? `
        <div class="feed-tags">
          ${item.tags.map(t => `<span class="feed-tag" style="border-color:${tagColors[t] || '#666'};color:${tagColors[t] || '#aaa'}">#${t}</span>`).join('')}
        </div>
      ` : ''}
      <div class="feed-footer">
        <span class="feed-weight top10-weight-label">🤗 ${getReactions(item)}</span>
        <div class="feed-reactions">
          <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_공감') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '공감')" data-type="공감">🤗 <span data-count="공감">${(item.reactions && item.reactions['공감']) || 0}</span></button>
          <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_위로') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '위로')" data-type="위로">💪 <span data-count="위로">${(item.reactions && item.reactions['위로']) || 0}</span></button>
          <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_응원') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '응원')" data-type="응원">✨ <span data-count="응원">${(item.reactions && item.reactions['응원']) || 0}</span></button>
        </div>
      </div>
      ${renderComments(item)}
    </div>
  `).join('');
}

function renderFeed() {
  const container = document.getElementById('feed-list');
  const publicTrash = allTrash.filter(t => t.privacy === 'public');
  const sorted = [...publicTrash].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const recent = sorted.slice(0, 50);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-trash">
        <span class="empty-icon">🌍</span>
        <p>아직 공개된 감정이 없습니다<br>첫 번째로 감정을 나눠보세요</p>
        <button class="cta-btn" onclick="openDumpModal()">감정 버리기</button>
      </div>
    `;
    return;
  }

  const tagColors = {
    '분노': '#ff1744', '짜증': '#ff6d00', '후회': '#9c27b0', '실망': '#4a148c',
    '서운함': '#5c6bc0', '상처': '#7b1fa2', '슬픔': '#1565c0', '불안': '#827717',
    '스트레스': '#e65100', '외로움': '#37474f', '무기력': '#616161', '지침': '#78909c',
  };

container.innerHTML = recent.map((item, i) => `
    <div class="feed-item" style="animation-delay: ${i * 0.03}s" data-id="${item.id}">
      <div class="feed-header">
        <span class="feed-anon">익명</span>
        <span class="feed-time">${formatTime(item.timestamp)}</span>
      </div>
      <div class="feed-text">${escapeHtml(item.content)}</div>
      ${item.tags && item.tags.length ? `
        <div class="feed-tags">
          ${item.tags.map(t => `<span class="feed-tag" style="border-color:${tagColors[t] || '#666'};color:${tagColors[t] || '#aaa'}">#${t}</span>`).join('')}
        </div>
      ` : ''}
      <div class="feed-footer">
        <span class="feed-weight">${item.content.length}kg</span>
          <div class="feed-reactions">
            <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_공감') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '공감')" data-type="공감">🤗 <span data-count="공감">${(item.reactions && item.reactions['공감']) || 0}</span></button>
            <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_위로') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '위로')" data-type="위로">💪 <span data-count="위로">${(item.reactions && item.reactions['위로']) || 0}</span></button>
            <button class="feed-reaction${localStorage.getItem('feed_reacted_' + item.id + '_응원') ? ' reacted' : ''}" onclick="reactToFeed(${item.id}, '응원')" data-type="응원">✨ <span data-count="응원">${(item.reactions && item.reactions['응원']) || 0}</span></button>
          </div>
      </div>
      ${renderComments(item)}
    </div>
  `).join('');
}

function reactToFeed(id, type) {
  const item = allTrash.find(t => t.id === id);
  if (!item) return;
  if (!item.reactions) item.reactions = {};
  const reactedKey = `feed_reacted_${id}_${type}`;
  const alreadyReacted = localStorage.getItem(reactedKey);

  if (alreadyReacted) {
    item.reactions[type] = Math.max(0, (item.reactions[type] || 1) - 1);
    localStorage.removeItem(reactedKey);
    if (typeof sbUpdateReactions === 'function') {
      sbUpdateReactions(id, type, item.reactions[type]);
    }
  } else {
    item.reactions[type] = (item.reactions[type] || 0) + 1;
    localStorage.setItem(reactedKey, '1');
    if (typeof sbUpdateReactions === 'function') {
      sbUpdateReactions(id, type, item.reactions[type]);
    }
  }

  localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));

  document.querySelectorAll(`[onclick*="reactToFeed(${id}, '${type}')"], [onclick*='reactToFeed(${id}, &quot;${type}&quot;)']`).forEach(btn => {
    const countSpan = btn.querySelector('[data-count]');
    if (countSpan) countSpan.textContent = item.reactions[type] || 0;
    btn.classList.toggle('reacted', !alreadyReacted);
  });

  showToast(alreadyReacted ? `${type} 취소` : `${type} +1 💛`, 'success');
}

function renderComments(item) {
  const comments = item.comments || [];
  let html = '<div class=\"comments-section\">';
  if (comments.length > 0) {
    html += comments.map(c => `
      <div class=\"comment-item\">
        <span class=\"comment-anon\">익명</span>
        <span class=\"comment-text\">${escapeHtml(c.text)}</span>
        <span class=\"comment-time\">${formatTime(c.timestamp)}</span>
      </div>
    `).join('');
  }
  html += `<div class=\"comment-form\">
    <input class=\"comment-input\" type=\"text\" placeholder=\"익명 댓글...\" maxlength=\"300\" onkeydown=\"if(event.key==='Enter')submitComment(${item.id}, this)\">
    <button class=\"comment-submit\" onclick=\"submitComment(${item.id}, this.previousElementSibling)\">전송</button>
  </div></div>`;
  return html;
}

function submitComment(id, inputEl) {
  const text = inputEl.value.trim();
  if (!text) return;
  const item = allTrash.find(t => t.id === id);
  if (!item) return;
  if (!item.comments) item.comments = [];
  const comment = { text: text.substring(0, 300), timestamp: Date.now() };
  item.comments.push(comment);
  localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
  const fbItem = firebasePosts.find(t => t.id === id);
  if (fbItem) {
    if (!fbItem.comments) fbItem.comments = [];
    fbItem.comments.push(comment);
  }
  if (typeof sbAddComment === 'function') {
    sbAddComment(id, text);
  }
  inputEl.value = '';
  showToast('💬 댓글 작성 완료', 'success');
  renderFeed();
  renderTop10();
}

function renderMyTrash() {
  const container = document.getElementById('mytrash-list');

  if (myTrash.length === 0) {
    container.innerHTML = `
      <div class="empty-trash">
        <span class="empty-icon">🗑️</span>
        <p>아직 버린 감정이 없습니다</p>
        <button class="cta-btn" onclick="openDumpModal()">첫 감정 버리기</button>
      </div>
    `;
    return;
  }

  container.innerHTML = myTrash.map((item, i) => `
    <div class="mytrash-item" style="animation-delay: ${i * 0.05}s">
      <span class="mytrash-icon">${item.privacy === 'public' ? '🌍' : '🔒'}</span>
      <div class="mytrash-content">
        <div class="mytrash-text">${escapeHtml(item.content)}</div>
        ${item.tags && item.tags.length ? `
          <div class="mytrash-tags">
            ${item.tags.map(t => `<span class="mytrash-tag">#${t}</span>`).join('')}
          </div>
        ` : ''}
        <div class="mytrash-meta">
          ${formatTime(item.timestamp)} · ${item.weightBefore}kg → ${item.weightAfter}kg (${item.weightDiff > 0 ? '-' : '+'}${Math.abs(item.weightDiff)}kg)
        </div>
      </div>
      <div class="mytrash-actions">
        <button class="mytrash-burn" onclick="burnMyTrash(${item.id})">🔥 태우기</button>
        <button class="mytrash-delete" onclick="deleteMyTrash(${item.id})">삭제</button>
      </div>
    </div>
  `).join('');
}

function burnMyTrash(id) {
  const item = myTrash.find(t => t.id === id);
  if (!item) return;

  function cleanupData() {
    myTrash = myTrash.filter(t => t.id !== id);
    localStorage.setItem('emotional_trash', JSON.stringify(myTrash));
    const wasPublic = item.privacy === 'public';
    if (wasPublic) {
      allTrash = allTrash.filter(t => t.id !== id);
      localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
      firebasePosts = firebasePosts.filter(t => t.id !== id);
      if (typeof sbDeletePost === 'function') sbDeletePost(id);
    }
    renderMyTrash();
    rebuildDrumFromStorage();
    updateStats();
    renderTop10();
    renderFeed();
    showToast('🔥 감정이 불태워졌습니다', 'success');
  }

  if (typeof burnInDrum === 'function' && typeof drumTrashObjects !== 'undefined' && drumTrashObjects.length > 0) {
    burnInDrum(item, cleanupData);
    return;
  }

  const els = document.querySelectorAll('.mytrash-item');
  let targetEl = null;
  for (const el of els) {
    if (el.querySelector('.mytrash-text')?.textContent === item.content) {
      targetEl = el;
      break;
    }
  }

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    createBurnEffect({
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
    }, cleanupData);
  } else {
    cleanupData();
  }
}

function deleteMyTrash(id) {
  if (!confirm('이 감정을 완전히 삭제하시겠습니까?')) return;
  const item = myTrash.find(t => t.id === id);
  myTrash = myTrash.filter(t => t.id !== id);
  localStorage.setItem('emotional_trash', JSON.stringify(myTrash));
  if (item && item.privacy === 'public') {
    allTrash = allTrash.filter(t => t.id !== id);
    localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
    firebasePosts = firebasePosts.filter(t => t.id !== id);
    if (typeof sbDeletePost === 'function') sbDeletePost(id);
  }
  renderMyTrash();
  renderTop10();
  renderFeed();
  updateStats();
  showToast('삭제되었습니다', 'success');
}

function resetAllData() {
  if (!confirm('정말 모든 데이터를 삭제하시겠습니까?\n\n- 내 쓰레기통\n- 통계\n- 레벨\n- 공개된 쓰레기산\n\n이 작업은 되돌릴 수 없습니다.')) return;
  localStorage.removeItem('emotional_trash');
  localStorage.removeItem('all_emotional_trash');
  myTrash = [];
  allTrash = [];
  firebasePosts = [];
  if (typeof clearDrumTrash === 'function') clearDrumTrash();
  if (typeof sbDeleteAllPosts === 'function') sbDeleteAllPosts();
  renderMyTrash();
  renderTop10();
  updateStats();
  updateTicker();
  showToast('🗑️ 모든 데이터가 초기화되었습니다', 'success');
}

function rebuildDrumFromStorage() {
  if (typeof clearDrumTrash !== 'function' || typeof addTrashToDrum !== 'function') return;
  if (typeof isDrumReady === 'undefined' || !isDrumReady) return;
  clearDrumTrash();
  const recent = myTrash.slice(0, 20);
  recent.forEach((item, i) => {
    setTimeout(() => addTrashToDrum(item), i * 120);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 172800000) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function updateTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const recent = allTrash
    .filter(t => t.privacy === 'public')
    .slice(0, 20);

  if (recent.length === 0) {
    track.innerHTML = '<span>아직 버려진 감정이 없습니다... 첫 번째 쓰레기가 되어보세요 🗑️</span>';
    return;
  }

  const items = recent.map(t => {
    const tag = t.tags && t.tags.length > 0 ? ` <span class="ticker-tag">#${t.tags[0]}</span>` : '';
    const text = t.content.length > 25 ? t.content.slice(0, 25) + '...' : t.content;
    return `<span>🗑️ ${escapeHtml(text)}${tag} · -${t.weightDiff || 0}kg · ${formatTime(t.timestamp)}</span>`;
  }).join('');

  track.innerHTML = items + items;
}

function refreshActiveSection() {
  const active = document.querySelector('.section.active');
  if (!active) return;
  const id = active.id?.replace('section-', '');
  if (id === 'feed') renderFeed();
  if (id === 'top10') renderTop10();
}

function toggleMobileNav() {
  document.getElementById('nav-links').classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('nav-links').classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#navbar')) closeMobileNav();
});

setTimeout(() => {
  document.getElementById('loader').classList.add('hidden');
}, 800);

setInterval(() => {
  processDumpAnimation();
}, 200);

setInterval(() => {
  updateTicker();
}, 10000);

sbLoadPosts().then(list => {
  if (list.length > 0) {
    firebasePosts = list.map(p => normalizeWeight(p));
    syncFromFirebase(firebasePosts);
  } else if (allTrash.length === 0) {
    const sampleTrash = [
      { content: '오늘도 의미 없는 하루. 거울 속 내가 제일 싫다. 지친다.', tags: ['무기력', '지침'], weightBefore: 85, weightAfter: 40, timestamp: Date.now() - 300000, privacy: 'public', id: Date.now() - 1 },
      { content: '왜 나만 이렇게 사는 거지? 모두가 나를 떠나갔다. 아무도 없어.', tags: ['외로움', '슬픔'], weightBefore: 70, weightAfter: 25, timestamp: Date.now() - 600000, privacy: 'public', id: Date.now() - 2 },
      { content: '개같은 회사. 개같은 상사. 오늘도 참았다. 언젠간 터진다.', tags: ['분노', '짜증'], weightBefore: 120, weightAfter: 55, timestamp: Date.now() - 900000, privacy: 'public', id: Date.now() - 3 },
      { content: '또 실수했다. 왜 나는 항상 이 모양일까. 다 내 탓이다. 아침에 눈을 뜨는 순간부터 하루 종일 후회뿐이다. 말하지 말았어야 할 말들, 하지 말았어야 할 선택들. 시간을 되돌릴 수만 있다면 모든 걸 처음부터 다시 하고 싶다. 근데 그게 안 되니까 더 좆같다. 아무리 생각해도 답은 없고, 그냥 이대로 살아야 하는 게 너무 무겁다. 언젠간 괜찮아질 거라는 말, 더 이상 믿지 않는다.', tags: ['후회', '실망'], weightBefore: 150, weightAfter: 80, timestamp: Date.now() - 1800000, privacy: 'public', id: Date.now() - 4 },
      { content: '너만 행복하면 다야? 나는? 나는 버려도 돼?', tags: ['서운함', '상처'], weightBefore: 95, weightAfter: 45, timestamp: Date.now() - 3600000, privacy: 'public', id: Date.now() - 5 },
      { content: '오늘 회사에서 또 당했다. 팀장은 내 아이디어를 자기가 낸 것처럼 발표했고, 옆자리 XX는 내 실수를 사무실 전체에 알렸다. 점심때는 혼자 먹었고, 핸드폰을 봐도 연락하는 사람은 아무도 없었다. 퇴근 길에 비까지 맞았다. 집에 와서도 할 일은 산더미다. 내일도 똑같은 하루가 반복될 생각을 하니 숨이 막힌다. 이 지긋지긋한 일상 언제까지 버텨야 할까. 나는 왜 이렇게 사는 걸까. 세상에 너무 많은 사람이 있는데 왜 나는 혼자인 기분일까. 다들 행복해 보이는데 나만 제자리다. 뭘 해도 재미없고, 뭘 먹어도 맛없고, 누굴 만나도 시시하다. 이게 우울증이라는 건 알지만, 극복할 의지조차 없다. 그냥 모든 게 귀찮다. 숨 쉬는 것조차 귀찮다. 아무것도 하기 싫다. 다 던져버리고 싶다. 모든 걸. 회사도, 인간관계도, 이 도시도, 나 자신도. 우주 어딘가에 아무도 없는 곳으로 떠나고 싶다.', tags: ['분노', '짜증', '스트레스', '외로움', '무기력'], weightBefore: 195, weightAfter: 75, timestamp: Date.now() - 7200000, privacy: 'public', id: Date.now() - 6 },
    ];
    sampleTrash.forEach(d => {
      allTrash.push(d);
      scheduleTrashItem(d);
    });
    localStorage.setItem('all_emotional_trash', JSON.stringify(allTrash));
  }
  updateStats();
  updateTicker();
  refreshActiveSection();

  sbSubscribePosts(list => {
    if (!list || list.length === 0) return;
    firebasePosts = list.map(p => normalizeWeight(p));
    firebasePosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    syncFromFirebase(firebasePosts);
    updateStats();
    updateTicker();
    refreshActiveSection();
  });
});

updateTicker();
updateTrashPreview(0);

setTimeout(() => {
  if (typeof rebuildDrumFromStorage === 'function' && myTrash.length > 0) {
    rebuildDrumFromStorage();
  }
}, 1800);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
