function createExplosion(cx, cy) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2500;';
  document.body.appendChild(container);

  const emojis = ['💢', '💥', '🗑️', '🔥', '😤', '🤬', '💀', '⚡', '🌟', '💫', '✨'];
  const count = 40 + Math.random() * 30;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const size = 16 + Math.random() * 24;
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 400;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 100;
    const rotation = (Math.random() - 0.5) * 720;
    const duration = 600 + Math.random() * 600;

    el.textContent = emoji;
    el.style.cssText = `
      position:absolute; font-size:${size}px; left:${cx}px; top:${cy}px;
      transform:translate(-50%,-50%);
      pointer-events:none; z-index:2501;
      transition: all ${duration}ms cubic-bezier(.25,.46,.45,.94);
      opacity:1;
    `;

    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px)) rotate(${rotation}deg)`;
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), duration + 50);
  }

  const flash = document.createElement('div');
  flash.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;background:white;
    pointer-events:none;z-index:2499;opacity:0;transition:opacity 100ms ease;
  `;
  document.body.appendChild(flash);
  requestAnimationFrame(() => flash.style.opacity = '0.3');
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 100);
  }, 100);

  setTimeout(() => container.remove(), 2000);
}

function createBurnEffect(pos, callback) {
  const cx = pos.left;
  const cy = pos.top;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2500;';
  document.body.appendChild(container);

  const flames = ['🔥', '🔥', '🔥', '💥', '✨', '🌫️'];
  for (let i = 0; i < 25; i++) {
    const el = document.createElement('div');
    const emoji = flames[Math.floor(Math.random() * flames.length)];
    const size = 12 + Math.random() * 28;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 100 + Math.random() * 200;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 50;
    const duration = 500 + Math.random() * 700;

    el.textContent = emoji;
    el.style.cssText = `
      position:absolute; font-size:${size}px; left:${cx + (Math.random()-0.5)*60}px; top:${cy + (Math.random()-0.5)*20}px;
      transform:translate(-50%,-50%) scale(1);
      pointer-events:none; z-index:2501;
      transition: all ${duration}ms ease-out;
      opacity:1;
    `;

    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px)) scale(1.5)`;
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), duration + 50);
  }

  const smoke = document.createElement('div');
  smoke.style.cssText = `
    position:fixed; left:${cx - 50}px; top:${cy - 50}px; width:100px; height:100px;
    background:radial-gradient(circle, rgba(100,100,100,0.3), transparent);
    border-radius:50%; pointer-events:none; z-index:2499;
    transition: all 800ms ease-out; opacity:0.6;
    transform:scale(0.5);
  `;
  document.body.appendChild(smoke);
  requestAnimationFrame(() => {
    smoke.style.transform = 'scale(4)';
    smoke.style.opacity = '0';
  });
  setTimeout(() => smoke.remove(), 900);

  setTimeout(() => {
    container.remove();
    if (callback) callback();
  }, 1500);
}
