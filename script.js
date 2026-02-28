/* ══════════════════════════════════════════════════════════
   script.js — 功能代码，一般不需要修改这个文件
   ══════════════════════════════════════════════════════════ */

/* ── STATE ── */
let curIdx = 0;
let curWorld = null;
let nvIdx = 0, nvPages = [];
let chatHistMap = {};
let activeChatChar = 0;
let tracks = [...TRACKS];
let tIdx = 0, playing = false;
const aud = document.getElementById('aud');

/* ══════════════════════════════════════════════════════════
   HOME — 轮播
══════════════════════════════════════════════════════════ */
function buildHome() {
  const track = document.getElementById('track');
  const dots  = document.getElementById('dots');
  track.innerHTML = '';
  dots.innerHTML  = '';

  WORLDS.forEach((w, i) => {
    const sl = document.createElement('div');
    sl.className = 'slide';
    sl.innerHTML = `
      <div class="slide-inner">
        <div class="slide-bg" ${w.cover ? `style="background-image:url('${w.cover}')"` : ''}></div>
        <div class="slide-overlay"></div>
        ${!w.cover ? `<div class="slide-empty"><div class="se-icon">⊹</div><div class="se-text">COVER IMAGE</div></div>` : ''}
        <div class="slide-tagline">${w.tagline}</div>
        <div class="slide-hint">ENTER →</div>
      </div>
    `;
    sl.addEventListener('click', () => goWorld(i));
    track.appendChild(sl);

    const dot = document.createElement('div');
    dot.className = 'sdot' + (i === 0 ? ' on' : '');
    dot.onclick = () => { curIdx = i; updateSlider(); };
    dots.appendChild(dot);
  });

  updateSlider();
}

function updateSlider() {
  const track = document.getElementById('track');
  const vp    = document.querySelector('.carousel-track-clip');
  track.style.transform = `translateX(${-curIdx * vp.offsetWidth}px)`;

  const world  = WORLDS[curIdx];
  const nameEl = document.getElementById('wnd-name');
  nameEl.style.opacity   = '0';
  nameEl.style.transform = 'translateY(8px)';
  setTimeout(() => {
    document.getElementById('wnd-idx').textContent  = world.idx;
    document.getElementById('wnd-name').textContent = world.name;
    document.getElementById('wnd-en').textContent   = world.nameEn;
    nameEl.style.opacity   = '1';
    nameEl.style.transform = 'none';
  }, 160);

  document.querySelectorAll('.sdot').forEach((d, i) => d.classList.toggle('on', i === curIdx));
}

function slide(dir) {
  curIdx = (curIdx + dir + WORLDS.length) % WORLDS.length;
  updateSlider();
}

/* ══════════════════════════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════════════════════════ */
function goWorld(idx) {
  curWorld = WORLDS[idx];
  curIdx   = idx;
  document.getElementById('home').classList.remove('active');
  document.getElementById('detail').classList.add('active');
  document.title = curWorld.name + ' · Nocturne';
  window.scrollTo(0, 0);
  loadDetail(curWorld);
  setTimeout(initReveal, 80);
}

function goHome() {
  document.getElementById('detail').classList.remove('active');
  document.getElementById('home').classList.add('active');
  document.title = 'Nocturne';
}

/* ══════════════════════════════════════════════════════════
   DETAIL PAGE
══════════════════════════════════════════════════════════ */
function loadDetail(w) {
  document.getElementById('d-topname').textContent = w.name;
  document.getElementById('d-topnum').textContent  = w.idx + ' / 0' + WORLDS.length;

  /* 角色 */
  const charEl = document.getElementById('d-chars');
  charEl.innerHTML = '';
  w.chars.forEach(c => {
    const div = document.createElement('div');
    div.className = 'char-card' + (c.flip ? ' flip' : '');
    div.innerHTML = `
      <div class="char-portrait">
        ${c.portrait
          ? `<img src="${c.portrait}" alt="${c.name}">`
          : `<div class="portrait-ph"><div class="phi">⊹</div><div class="pht">PORTRAIT</div></div>`}
      </div>
      <div class="char-body">
        <div class="char-name">${c.name}
          <span style="font-family:'Space Mono',monospace;font-size:.55rem;color:#222;letter-spacing:.15em;margin-left:8px">${c.nameEn}</span>
        </div>
        <div class="char-name-en">${c.alias}</div>
        <div class="char-tags">${c.tags.map(t => `<span class="char-tag">${t}</span>`).join('')}</div>
        <div class="char-bio">${c.bio}</div>
      </div>
    `;
    charEl.appendChild(div);
  });

  /* 画廊 */
  const galEl = document.getElementById('d-gallery');
  galEl.innerHTML = '';
  const imgs  = w.gallery || [];
  const total = Math.max(imgs.length, 5);
  for (let i = 0; i < total; i++) {
    const item = document.createElement('div');
    item.className = 'gi';
    if (imgs[i]) {
      item.innerHTML = `<img src="${imgs[i]}" alt="" loading="lazy">`;
      const src = imgs[i];
      item.onclick = () => lbOpen(src);
    } else {
      item.innerHTML = `<div class="gi-empty"><div class="ge">⊹</div><div class="gt">IMAGE</div></div>`;
    }
    galEl.appendChild(item);
  }

  /* 视频 */
  const vf  = document.getElementById('d-vframe');
  const vid = w.video;
  document.getElementById('d-vtitle').textContent = vid.title || '手书';
  document.getElementById('d-vdate').textContent  = vid.date  || '—';
  if (vid.src) {
    vf.innerHTML = vid.type === 'iframe'
      ? `<iframe src="${vid.src}" frameborder="0" allowfullscreen></iframe>`
      : `<video controls preload="metadata" style="width:100%;height:100%;display:block"><source src="${vid.src}"></video>`;
  } else {
    vf.innerHTML = `<div class="vid-ph"><div class="vi">▷</div><p>VIDEO<br>PLACEHOLDER</p></div>`;
  }

  /* 小说 */
  nvPages = w.novel.pages;
  nvIdx   = 0;
  document.getElementById('d-nvtitle').textContent = w.novel.title;
  renderNv();

  /* 对话 */
  chatHistMap = {};
  buildChatTabs(w);
}

/* ══════════════════════════════════════════════════════════
   NOVEL FLIPBOOK
══════════════════════════════════════════════════════════ */
function renderNv() {
  const body = document.getElementById('d-nvbody');
  const old  = body.querySelector('.on');
  if (old) { old.classList.remove('on'); setTimeout(() => old.remove(), 350); }

  const pg = document.createElement('div');
  pg.className = 'nv-page';
  pg.innerHTML = nvPages[nvIdx]?.c || '<p>—</p>';
  body.appendChild(pg);
  requestAnimationFrame(() => requestAnimationFrame(() => pg.classList.add('on')));

  document.getElementById('d-nvpg').textContent   = `0${nvIdx+1} / 0${nvPages.length}`;
  document.getElementById('nvprev').disabled       = nvIdx === 0;
  document.getElementById('nvnext').disabled       = nvIdx === nvPages.length - 1;

  const dotsEl = document.getElementById('nvdots');
  dotsEl.innerHTML = '';
  nvPages.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'nvdot' + (i === nvIdx ? ' on' : '');
    d.onclick = () => { if (i !== nvIdx) { nvIdx = i; renderNv(); } };
    dotsEl.appendChild(d);
  });
}

function nvFlip(dir) {
  const ni = nvIdx + dir;
  if (ni < 0 || ni >= nvPages.length) return;

  const body = document.getElementById('d-nvbody');
  const cur  = body.querySelector('.on');
  if (cur) {
    cur.style.opacity   = '0';
    cur.style.transform = dir > 0 ? 'translateX(-28px)' : 'translateX(28px)';
    setTimeout(() => cur.remove(), 350);
  }

  nvIdx = ni;
  const pg = document.createElement('div');
  pg.className      = 'nv-page';
  pg.style.transform = dir > 0 ? 'translateX(28px)' : 'translateX(-28px)';
  pg.style.opacity  = '0';
  pg.innerHTML      = nvPages[nvIdx].c;
  body.appendChild(pg);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pg.classList.add('on');
    pg.style.transform = '';
    pg.style.opacity   = '';
  }));

  document.getElementById('d-nvpg').textContent = `0${nvIdx+1} / 0${nvPages.length}`;
  document.getElementById('nvprev').disabled     = nvIdx === 0;
  document.getElementById('nvnext').disabled     = nvIdx === nvPages.length - 1;
  document.querySelectorAll('.nvdot').forEach((d, i) => d.classList.toggle('on', i === nvIdx));
}

/* ══════════════════════════════════════════════════════════
   CHAT — 角色切换 + 独立对话历史
══════════════════════════════════════════════════════════ */
function buildChatTabs(w) {
  const tabs = document.getElementById('d-ctabs');
  tabs.innerHTML = '';

  if (w.chars.length > 1) {
    tabs.classList.add('visible');
    w.chars.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'ctab' + (i === 0 ? ' on' : '');
      btn.innerHTML = `
        <div class="ctab-av">${c.portrait ? `<img src="${c.portrait}">` : c.name[0]}</div>
        <span>${c.name}</span>
        <span class="ctab-alias">${c.alias}</span>
      `;
      btn.onclick = () => switchChar(i);
      tabs.appendChild(btn);
    });
  } else {
    tabs.classList.remove('visible');
  }

  switchChar(0);
}

function switchChar(idx) {
  activeChatChar = idx;
  const c   = curWorld.chars[idx];
  const key = curWorld.id + '_' + idx;

  document.getElementById('d-cname').textContent = c.name;
  document.getElementById('d-crole').textContent = c.alias;
  const av = document.getElementById('d-cav');
  av.innerHTML = c.portrait ? `<img src="${c.portrait}">` : '—';
  document.getElementById('d-input').placeholder = `向 ${c.name} 说点什么……`;

  if (!chatHistMap[key]) chatHistMap[key] = [];

  const msgs = document.getElementById('d-msgs');
  msgs.innerHTML = '';

  if (chatHistMap[key].length === 0) {
    // 第一次进入，显示开场白
    const greeting = curWorld.chat.greetings[idx] || curWorld.chat.greetings[0];
    addMsg('ai', greeting);
  } else {
    // 恢复历史对话
    chatHistMap[key].forEach(m => addMsg(m.role === 'user' ? 'user' : 'ai', m.content, true));
  }

  document.querySelectorAll('.ctab').forEach((b, i) => b.classList.toggle('on', i === idx));
}

function addMsg(type, text, silent = false) {
  const msgs = document.getElementById('d-msgs');
  const div  = document.createElement('div');
  div.className = 'cm ' + (type === 'ai' ? 'ai' : 'u');
  if (silent) div.style.animation = 'none';

  const c      = curWorld?.chars[activeChatChar];
  const avHtml = type === 'ai'
    ? (c?.portrait ? `<img src="${c.portrait}">` : '—')
    : '·';

  div.innerHTML = `<div class="cm-av">${avHtml}</div><div class="cm-b">${text.replace(/\n/g, '<br>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function ckEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doChat(); }
}
function autoR(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function doChat() {
  const inp = document.getElementById('d-input');
  const txt = inp.value.trim();
  if (!txt) return;

  inp.value = ''; inp.style.height = 'auto';

  const key = curWorld.id + '_' + activeChatChar;
  if (!chatHistMap[key]) chatHistMap[key] = [];

  addMsg('user', txt);
  chatHistMap[key].push({ role: 'user', content: txt });

  const btn  = document.getElementById('d-send');
  const msgs = document.getElementById('d-msgs');
  btn.disabled = true;

  const tEl = document.createElement('div');
  tEl.className = 'cm ai';
  tEl.innerHTML = `<div class="cm-av">—</div><div class="cm-b"><div class="tds"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>`;
  msgs.appendChild(tEl);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    // ← 后端地址：本地开发用 localhost:3000，部署后改成你的服务器地址
    const BACKEND = 'http://localhost:3000';

    const res = await fetch(`${BACKEND}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:    txt,
        history:    chatHistMap[key].slice(0, -1), // 最新消息已单独传 message
        systemPrompt: curWorld.chat.systems[activeChatChar] || curWorld.chat.systems[0],
        charName:   curWorld.chars[activeChatChar].name,
        worldId:    curWorld.id + '_' + activeChatChar,
      }),
    });

    const data = await res.json();
    tEl.remove();

    if (data.reply) {
      chatHistMap[key].push({ role: 'model', content: data.reply });
      addMsg('ai', data.reply);
    } else {
      addMsg('ai', `⚠ ${data.error || '后端返回了未知错误'}`);
    }
  } catch(e) {
    tEl.remove();
    addMsg('ai', `⚠ 无法连接后端服务器：${e.message}\n请确认 server.js 正在运行。`);
  }
  btn.disabled = false;
}

/* ══════════════════════════════════════════════════════════
   MUSIC PLAYER
══════════════════════════════════════════════════════════ */
aud.addEventListener('timeupdate', () => {
  if (!aud.duration) return;
  document.getElementById('mp-fill').style.width = (aud.currentTime / aud.duration * 100) + '%';
});
aud.addEventListener('ended', mpNext);

function mpTogglePanel() { document.getElementById('mp-panel').classList.toggle('op'); }
function mpTogglePl()    { document.getElementById('mp-list').classList.toggle('op'); }

function mpUI() {
  const t = tracks[tIdx];
  document.getElementById('mp-tname').textContent = t ? t.name : '— 暂无音乐 —';
  document.getElementById('mp-pp').textContent    = playing ? '⏸' : '▶';
  document.getElementById('mp-fab').classList.toggle('on', playing);

  const list = document.getElementById('pl-items');
  list.innerHTML = '';
  tracks.forEach((tr, i) => {
    const d = document.createElement('div');
    d.className = 'pl-item' + (i === tIdx ? ' on' : '');
    d.innerHTML = `<span class="pl-n">${i === tIdx && playing ? '▶' : i+1}</span><span class="pl-t">${tr.name}</span>`;
    d.onclick   = () => mpPlay(i);
    list.appendChild(d);
  });
}

function mpPlay(i)  { tIdx = i; aud.src = tracks[i].src; aud.play(); playing = true; mpUI(); }
function mpToggle() {
  if (!tracks.length) return;
  if (!aud.src || aud.src === location.href) { if (tracks.length) mpPlay(tIdx); return; }
  if (playing) { aud.pause(); playing = false; } else { aud.play(); playing = true; }
  mpUI();
}
function mpPrev()   { if (tracks.length) mpPlay((tIdx - 1 + tracks.length) % tracks.length); }
function mpNext()   { if (tracks.length) mpPlay((tIdx + 1) % tracks.length); }
function mpSeek(e)  {
  if (!aud.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  aud.currentTime = ((e.clientX - r.left) / r.width) * aud.duration;
}

/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
    { threshold: 0.06 }
  );
  document.querySelectorAll('.d-sec').forEach(s => obs.observe(s));
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════ */
function lbOpen(src) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb').classList.add('op');
}
function lbClose() { document.getElementById('lb').classList.remove('op'); }

/* ══════════════════════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') lbClose();
  if (document.getElementById('home').classList.contains('active')) {
    if (e.key === 'ArrowLeft')  slide(-1);
    if (e.key === 'ArrowRight') slide(1);
    if (e.key === 'Enter')      goWorld(curIdx);
  }
});
window.addEventListener('resize', () => {
  if (document.getElementById('home').classList.contains('active')) updateSlider();
});

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
buildHome();
mpUI();
if (tracks.length) mpPlay(0);
