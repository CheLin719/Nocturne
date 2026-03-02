/* ══════════════════════════════════════════════════════════
   script.js — 功能代码，一般不需要修改这个文件
   ══════════════════════════════════════════════════════════ */

/* ── STATE ── */
let curIdx = 0;
let curWorld = null;
let nvIdx = 0, nvPages = [];
let chatHistMap = {};
let activeChatChar = 0;
let activeIdentity = {};
let easterEggActive = {};
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
  window.location.href = 'world.html?id=' + WORLDS[idx].id;
}

function goHome() {
  window.location.href = 'index.html';
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
  buildGalleryPreview(w);

  /* 视频 */
  const vf  = document.getElementById('d-vframe');
  const vid = w.video;
  document.getElementById('d-vtitle').textContent = vid.title || '手书';
  document.getElementById('d-vdate').textContent  = vid.date  || '—';
  if (vid.src) {
    vf.innerHTML = vid.type === 'iframe'
      ? (() => {
          // B站链接自动加 autoplay=0 防止自动播放
          const iframeSrc = vid.src.includes('bilibili.com')
            ? vid.src.replace(/([?&])autoplay=1/g, '$1autoplay=0') + (vid.src.includes('?') ? '&autoplay=0' : '?autoplay=0')
            : vid.src;
          return `<iframe src="${iframeSrc.replace('?autoplay=0&autoplay=0','?autoplay=0')}" frameborder="0" allowfullscreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="width:100%;height:100%;border:none;display:block;"></iframe>`;
        })()
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
  easterEggActive = {};
  buildChatTabs(w);
  setTimeout(updateGameBtns, 50);
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
    w.chars.forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = 'ctab' + (i === 0 ? ' on' : '');
      btn.innerHTML = `
        <div class="ctab-av">${ch.portrait ? `<img src="${ch.portrait}">` : ch.name[0]}</div>
        <span>${ch.name}</span>
        <span class="ctab-alias">${ch.alias}</span>
      `;
      btn.onclick = () => switchChar(i);
      tabs.appendChild(btn);
    });
  } else {
    tabs.classList.remove('visible');
  }
  switchChar(0);
}

/* ── 身份选择弹窗 ── */
function showIdentityPicker(charIdx, onSelect) {
  const w = curWorld;
  if (!w.chat.identities) { onSelect('stranger', ''); return; }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:800;background:rgba(0,0,0,.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#0d0d0d;border:1px solid rgba(255,255,255,.12);padding:32px 36px;min-width:300px;max-width:400px;display:flex;flex-direction:column;gap:12px;';
  const charName = w.chars[charIdx].name;
  box.innerHTML = `
    <div style="font-family:'Space Mono',monospace;font-size:.58rem;letter-spacing:.25em;color:#444;margin-bottom:2px;">BEFORE YOU ENTER</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#ddd;margin-bottom:6px;">你与<span style="color:#fff;margin:0 4px;">${charName}</span>的关系是？</div>
  `;
  w.chat.identities.forEach(id => {
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:11px 16px;text-align:left;border:1px solid rgba(255,255,255,.08);background:#141414;color:#888;font-size:.82rem;transition:all .2s;cursor:pointer;';
    btn.textContent = id.label;
    btn.onmouseenter = () => { btn.style.borderColor='rgba(255,255,255,.25)'; btn.style.color='#ddd'; };
    btn.onmouseleave = () => { btn.style.borderColor='rgba(255,255,255,.08)'; btn.style.color='#888'; };
    if (id.value === 'custom') {
      btn.onclick = () => {
        btn.style.display = 'none';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;';
        const inp = document.createElement('input');
        inp.placeholder = '输入你的身份，如：他的前搭档';
        inp.style.cssText = 'flex:1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.15);padding:9px 12px;color:#ddd;font-size:.8rem;outline:none;';
        const ok = document.createElement('button');
        ok.textContent = '确认';
        ok.style.cssText = 'padding:9px 14px;background:#1a1a1a;border:1px solid rgba(255,255,255,.12);color:#aaa;font-size:.75rem;cursor:pointer;';
        ok.onclick = () => {
          const val = inp.value.trim() || '访客';
          const egg = curWorld?.chat?.easterEgg;
          const triggers = egg?.trigger ? (Array.isArray(egg.trigger) ? egg.trigger : [egg.trigger]) : [];
          document.body.removeChild(overlay);
          if (triggers.some(t => val.includes(t))) {
            onSelect('easter_egg', val);
          } else {
            onSelect('custom', val);
          }
        };
        inp.onkeydown = e => { if(e.key==='Enter') ok.click(); };
        row.appendChild(inp); row.appendChild(ok);
        box.appendChild(row);
        setTimeout(() => inp.focus(), 50);
      };
    } else {
      btn.onclick = () => { document.body.removeChild(overlay); onSelect(id.value, ''); };
    }
    box.appendChild(btn);
  });
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

/* ── 获取有效 system prompt ── */
function getSystemPrompt(charIdx) {
  const w   = curWorld;
  const key = w.id + '_' + charIdx;
  if (easterEggActive[key] && w.chat.easterEgg?.systems?.[charIdx]) {
    return w.chat.easterEgg.systems[charIdx];
  }
  let base = w.chat.systems[charIdx] || w.chat.systems[0];
  const identity = activeIdentity[key];
  if (identity && w.chat.identityAppend?.[charIdx]) {
    const append = w.chat.identityAppend[charIdx][identity];
    if (append) base += '\n\n' + append;
    else if (identity !== 'stranger' && identity !== 'friend') {
      base += `\n\n【当前对话者身份】${identity}，请根据这个身份调整语气与亲疏感。`;
    }
  }
  return base;
}

/* ── 获取开场白 ── */
function getGreeting(charIdx) {
  const w   = curWorld;
  const key = w.id + '_' + charIdx;
  if (easterEggActive[key] && w.chat.easterEgg?.greetings?.[charIdx]) {
    return w.chat.easterEgg.greetings[charIdx];
  }
  const g = w.chat.greetings[charIdx] || w.chat.greetings[0];
  if (typeof g === 'object') {
    const id = activeIdentity[key] || 'stranger';
    return g[id] || g.stranger || Object.values(g)[0];
  }
  return g;
}

function switchChar(idx) {
  activeChatChar = idx;
  const ch  = curWorld.chars[idx];
  const key = curWorld.id + '_' + idx;
  document.getElementById('d-cname').textContent = ch.name;
  document.getElementById('d-crole').textContent = ch.alias;
  const av = document.getElementById('d-cav');
  av.innerHTML = ch.portrait ? `<img src="${ch.portrait}">` : '—';
  document.getElementById('d-input').placeholder = `向 ${ch.name} 说点什么……`;
  document.querySelectorAll('.ctab').forEach((b, i) => b.classList.toggle('on', i === idx));
  if (!chatHistMap[key]) chatHistMap[key] = [];
  const msgs = document.getElementById('d-msgs');
  msgs.innerHTML = '';
  if (chatHistMap[key].length === 0) {
    if (easterEggActive[key]) {
      // 彩蛋已由其他角色触发并同步，直接跳过身份框
      addMsg('ai', getGreeting(idx));
    } else if (curWorld.chat.identities) {
      // 等用户第一次点击输入框再弹身份框
      const inp = document.getElementById('d-input');
      const onFirstFocus = () => {
        inp.removeEventListener('focus', onFirstFocus);
        showIdentityPicker(idx, (identityVal, customText) => {
          if (identityVal === 'easter_egg') {
            // 同时激活所有角色的彩蛋状态
            curWorld.chars.forEach((_, i) => {
              easterEggActive[curWorld.id + '_' + i] = true;
            });
            activeIdentity[key] = customText;
          } else {
            activeIdentity[key] = identityVal === 'custom' ? customText : identityVal;
          }
          addMsg('ai', getGreeting(idx));
        });
      };
      inp.addEventListener('focus', onFirstFocus);
    } else {
      addMsg('ai', getGreeting(idx));
    }
  } else {
    chatHistMap[key].forEach(m => addMsg(m.role === 'user' ? 'user' : 'ai', m.content, true));
  }
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
  if (!API_KEY) {
    addMsg('ai', '⚠ 请在 data.js 顶部填入 API_KEY 后重新打开页面。');
    return;
  }
  const inp = document.getElementById('d-input');
  const txt = inp.value.trim();
  if (!txt) return;

  inp.value = ''; inp.style.height = 'auto';

  const key = curWorld.id + '_' + activeChatChar;
  if (!chatHistMap[key]) chatHistMap[key] = [];

  // 彩蛋检测
  const egg = curWorld.chat.easterEgg;
  if (egg?.trigger) {
    const triggers = Array.isArray(egg.trigger) ? egg.trigger : [egg.trigger];
    if (triggers.some(t => txt.includes(t)) && !easterEggActive[key]) {
      easterEggActive[key] = true;
      chatHistMap[key] = [];
      document.getElementById('d-msgs').innerHTML = '';
      inp.value = ''; inp.style.height = 'auto';
      setTimeout(() => addMsg('ai', egg.greetings?.[activeChatChar] || getGreeting(activeChatChar)), 300);
      return;
    }
  }

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
    const base = (API_PROXY || 'https://api.anthropic.com').replace(/\/$/, '');
    const res  = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      API_MODEL,
        max_tokens: 400,
        system:     getSystemPrompt(activeChatChar),
        messages:   chatHistMap[key],
      }),
    });
    const data = await res.json();
    tEl.remove();
    if (data.content?.[0]?.text) {
      const rep = data.content[0].text;
      chatHistMap[key].push({ role: 'assistant', content: rep });
      addMsg('ai', rep);
    } else {
      addMsg('ai', `Error: ${data.error?.message || JSON.stringify(data)}`);
    }
  } catch(e) {
    tEl.remove();
    addMsg('ai', `Network error: ${e.message}`);
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

function mpTogglePanel() {
  const panel = document.getElementById('mp-panel');
  panel.classList.toggle('op');
  // 展开面板时如果有歌曲且还没播，自动开始播
  if (panel.classList.contains('op') && tracks.length && !playing) {
    mpPlay(tIdx);
  }
}
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
  if (e.key === 'Escape') { const lb = document.getElementById('lb'); if (lb) lbClose(); }
  const homeEl = document.getElementById('home');
  if (homeEl && homeEl.classList.contains('active')) {
    if (e.key === 'ArrowLeft')  slide(-1);
    if (e.key === 'ArrowRight') slide(1);
    if (e.key === 'Enter')      goWorld(curIdx);
  }
});
window.addEventListener('resize', () => {
  const homeEl = document.getElementById('home');
  if (homeEl && homeEl.classList.contains('active')) updateSlider();
});

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
/* ── 根据页面判断初始化 ── */
const isWorldPage = !!document.getElementById('detail');
const isHomePage  = !!document.getElementById('home');

if (isHomePage && !isWorldPage) {
  // 首页 index.html
  buildHome();
  mpUI();
  if (tracks.length) {
    const autoPlay = () => {
      if (!playing) mpPlay(tIdx);
      document.removeEventListener('click', autoPlay);
      document.removeEventListener('touchstart', autoPlay);
    };
    document.addEventListener('click', autoPlay);
    document.addEventListener('touchstart', autoPlay);
  }
} else if (isWorldPage) {
  // 详情页 world.html：从 URL 参数读取世界 id
  const worldId = new URLSearchParams(location.search).get('id');
  curWorld = WORLDS.find(w => w.id === worldId) || WORLDS[0];
  curIdx   = WORLDS.indexOf(curWorld);
  document.title = curWorld.name + ' · Nocturne';
  loadDetail(curWorld);
  setTimeout(initReveal, 80);
  mpUI();
  if (tracks.length) {
    const autoPlay = () => {
      if (!playing) mpPlay(tIdx);
      document.removeEventListener('click', autoPlay);
      document.removeEventListener('touchstart', autoPlay);
    };
    document.addEventListener('click', autoPlay);
    document.addEventListener('touchstart', autoPlay);
  }
}
/* ══════════════════════════════════════════════════════════
   GALLERY — 自动选图预览 + 瀑布流弹窗
══════════════════════════════════════════════════════════ */

/* 加载一批图片的真实宽高比 */
function loadImageRatios(srcs) {
  return Promise.all(srcs.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve({ src, ratio: img.naturalWidth / img.naturalHeight });
    img.onerror = () => resolve({ src, ratio: 1 });
    img.src = src;
  })));
}

/* 从所有图片挑最多6张：均衡横/竖/方，保证多样性 */
function pickBestPreview(items, max = 6) {
  if (items.length <= max) return items;
  const landscape = items.filter(it => it.ratio >= 1.25);
  const portrait  = items.filter(it => it.ratio < 0.8);
  const square    = items.filter(it => it.ratio >= 0.8 && it.ratio < 1.25);
  const picked = [], used = new Set();
  const take = (pool, limit) => {
    for (const it of pool) {
      if (picked.length >= limit || picked.length >= max) break;
      if (!used.has(it.src)) { picked.push(it); used.add(it.src); }
    }
  };
  take(landscape, 2); take(portrait, 2); take(square, 2);
  take(items.filter(it => !used.has(it.src)), max);
  return picked;
}

/* 构建预览画廊：2列瀑布流，图片保持原始比例 */
function buildGalleryPreview(w) {
  const galEl = document.getElementById('d-gallery');
  const btnEl = document.getElementById('gal-more-btn');
  if (!galEl) return;
  galEl.innerHTML = '';

  const allImgs = (w.gallery || []).filter(Boolean);

  if (btnEl) {
    btnEl.textContent = allImgs.length > 0
      ? `${w.name} · 画廊 (${allImgs.length}) →`
      : '画廊 →';
  }

  if (allImgs.length === 0) {
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.className = 'gi';
      item.innerHTML = `<div class="gi-empty"><div class="ge">⊹</div><div class="gt">IMAGE</div></div>`;
      galEl.appendChild(item);
    }
    return;
  }

  galEl.style.opacity = '0';
  galEl.style.transition = 'opacity .5s';

  loadImageRatios(allImgs).then(allItems => {
    const preview = pickBestPreview(allItems, 6);
    galEl.innerHTML = '';

    preview.forEach(it => {
      const item = document.createElement('div');
      item.className = 'gi';
      const img = document.createElement('img');
      img.src = it.src; img.alt = ''; img.loading = 'lazy';
      item.appendChild(img);
      item.onclick = () => lbOpen(it.src);
      galEl.appendChild(item);
    });

    // 等图片加载完淡入
    let loaded = 0;
    const imgs = galEl.querySelectorAll('img');
    const onLoad = () => { if (++loaded >= imgs.length) galEl.style.opacity = '1'; };
    imgs.forEach(img => {
      if (img.complete) onLoad();
      else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
    });
    if (!imgs.length) galEl.style.opacity = '1';
  });
}

/* 画廊全屏弹窗 */
function galModalOpen() {
  if (!curWorld) return;
  const modal   = document.getElementById('gal-modal');
  const masonry = document.getElementById('gal-masonry');
  const title   = document.getElementById('gal-modal-title');
  if (!modal) return;

  title.textContent = curWorld.name + ' · 画廊';
  masonry.innerHTML = '';

  const imgs = (curWorld.gallery || []).filter(Boolean);
  if (imgs.length === 0) {
    masonry.innerHTML = `<p style="color:#333;font-family:'Space Mono',monospace;font-size:.6rem;letter-spacing:.12em;text-align:center;padding:60px 0">NO IMAGES YET</p>`;
  } else {
    imgs.forEach(src => {
      const item = document.createElement('div');
      item.className = 'gal-masonry-item';
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.loading = 'lazy';
      item.appendChild(img);
      item.onclick = () => lbOpen(src);
      masonry.appendChild(item);
    });
  }

  modal.classList.add('op');
  document.body.style.overflow = 'hidden';
}

function galModalClose() {
  const modal = document.getElementById('gal-modal');
  if (modal) modal.classList.remove('op');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('gal-modal');
    if (modal?.classList.contains('op')) { galModalClose(); return; }
  }
});

/* ══════════════════════════════════════════════════════════
   21点游戏（含暗线作弊逻辑）
══════════════════════════════════════════════════════════ */

/*
 * 作弊机制（不在界面上体现）：
 * charIdx=0（悠葉）：每局开始时 30% 概率触发"乱数干预"，触发后庄家必赢
 * charIdx=1（乱数）：100% 必作弊，庄家必赢
 * 实现方式：发牌时暗中操控牌堆，让玩家必然爆牌或庄家必然 ≥ 玩家
 */

const BJ_LINES = {
  // 悠葉正常局
  0: {
    idle:   ['真的要玩？', '你先', '要玩就认真点。'],
    rules:  ['……规则很简单。', '别输太难看。'],
    deal:   ['发牌了。', '开始吧。', '……看好。'],
    hit:    ['……还要？', '自己想清楚。', '随便。'],
    stand:  ['停了？', '……嗯。', '看你的。'],
    double: ['……胆子不小。', '赌注翻倍。'],
    split:  ['分牌。', '……分开打吧。'],
    insure: ['……保险？', '谨慎。'],
    bust:   ['爆了。', '……差一点。', '想太多了。'],
    win:    ['……赢了。', '运气不错。', '这次算你的。'],
    lose:   ['输了。', '……再来？', '差了点。'],
    push:   ['平局。', '……重来。'],
    bjack:  ['21点。', '……运气好。'],
  },
  // 悠葉作弊局（乱数在场，台词偶有异样，但不明说）
  '0x': {
    idle:   ['别闹', '今天……算了。', '……乱数。'],
    deal:   ['发牌。', '……开始。', '嗯。'],
    hit:    ['……', '随便。', '……好。'],
    stand:  ['……嗯。', '停就停吧。', '……'],
    bust:   ['爆了。', '……', '运气不好。'],
    lose:   ['……输了。', '再来。', '……'],
    win:    ['……', '……嗯。', '运气好。'],   // 这种情况理论上不会出现
    push:   ['……平局。', '重来。'],
  },
  // 乱数
  1: {
    idle:   ['来来来♡', '嘿嘿～准备输了吗', '乱数不手软哦～'],
    rules:  ['规则啊～很简单的♡', '不过嘛……嘿嘿'],
    deal:   ['开始啦♡', '嘿嘿看好了哦！', '这次……嘿嘿♡'],
    hit:    ['哇还要！', '胆子够大嘛～', '好好好～'],
    stand:  ['哎不要了啊？', '怂了～', '好吧好吧！'],
    double: ['哇双倍！！♡', '这么有信心吗～'],
    split:  ['分开打！！', '嘿嘿这样更有趣♡'],
    insure: ['买保险啊！', '这么怂的吗～'],
    bust:   ['爆啦爆啦！哈哈～', '太贪心啦♡', '哎呀～嘿嘿'],
    win:    ['咦……', '哇你赢了！', '……下次！'],   // 理论上不触发
    lose:   ['嘿嘿乱数赢啦♡', '再来再来！', '哈哈～'],
    push:   ['平局！？重来！！', '不算不算♡'],
    bjack:  ['哇——！！21点！！♡', '你作弊了吧！！'],
  },
};

function bjLine(mode, k) {
  const pool = BJ_LINES[mode]?.[k] ?? BJ_LINES[BJ.charIdx]?.idle ?? ['……'];
  return pool[Math.floor(Math.random() * pool.length)];
}
function bjSay(k) {
  const el = document.getElementById('bj-speech-text');
  if (el) el.textContent = bjLine(BJ.cheatMode ? BJ.charIdx + 'x' : BJ.charIdx, k);
}

/* ── 状态 ── */
const BJ = {
  charIdx: 0,
  deck: [],
  rigged: [],    // 作弊时预先备好的"坏牌"队列
  cheatMode: false,  // 当前局是否作弊
  player: [], playerSplit: null,
  dealer: [],
  chips: 1000, bet: 0, insureBet: 0,
  phase: 'bet', insured: false,
  rulesAcked: false,  // 是否已确认规则
};
const BJ_SUITS = ['♠','♣','♥','♦'];
const BJ_VALS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BJ_RED   = new Set(['♥','♦']);

function bjMakeDeck(n=6) {
  const d = [];
  for (let i = 0; i < n; i++)
    for (const s of BJ_SUITS)
      for (const v of BJ_VALS)
        d.push({suit:s, val:v});
  for (let i = d.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [d[i],d[j]] = [d[j],d[i]];
  }
  return d;
}
function bjNum(c) { if(['J','Q','K'].includes(c.val))return 10; if(c.val==='A')return 11; return+c.val; }
function bjScore(h) { let s=0,a=0; for(const c of h){s+=bjNum(c);if(c.val==='A')a++;} while(s>21&&a>0){s-=10;a--;} return s; }

/* 作弊牌堆：给玩家发小牌，庄家发大牌，确保玩家必输 */
function bjMakeRiggedDeck() {
  // 出千策略：完全靠牌面操控，不改结果判定
  //
  // 发牌设计：
  //   玩家：两张合计 14~16（危险区，要牌大概率爆，不要牌庄家赢）
  //         如：8+6=14, 7+8=15, 9+6=15, 8+7=15, 9+7=16
  //   庄家：明牌 7~9（看着普通），暗牌让合计落 17~19（稳赢区）
  //         如：8(明)+9(暗)=17, 7(明)+10(暗)=17, 9(明)+9(暗)=18
  //   玩家后续要牌：给 7~9（加上原有14~16大概率超21）

  const sh = arr => {
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  };
  const pick = v => {
    const suit = BJ_SUITS[Math.floor(Math.random()*BJ_SUITS.length)];
    return {suit, val:v};
  };

  // 玩家两张：从合法组合里随机选一种
  const playerCombos = [
    ['8','6'],['7','8'],['9','6'],['8','7'],['9','7'],
    ['6','8'],['5','9'],['9','5'],['6','9'],['7','7'],
  ];
  const [pv1, pv2] = sh(playerCombos)[0];
  const p1 = pick(pv1);
  const p2 = pick(pv2);

  // 庄家两张：明牌 7~9，暗牌让合计=17~19
  const dealerCombos = [
    ['8','9'],  // 17
    ['7','10'], // 17
    ['9','9'],  // 18
    ['8','10'], // 18
    ['9','10'], // 19
    ['7','J'],  // 17
    ['8','J'],  // 18
    ['9','J'],  // 19
    ['7','Q'],  // 17
    ['8','Q'],  // 18
  ];
  const [dv_show, dv_hid] = sh(dealerCombos)[0];
  const dShow = pick(dv_show); // 明牌
  const dHid  = pick(dv_hid);  // 暗牌

  // 玩家后续要牌：7~9，加上14~16基本爆
  const hitVals = sh(['7','8','9','10','J']);
  const hitCards = hitVals.map(v => pick(v));

  // pop取牌顺序（从队列末尾弹出）：
  // 第1次pop = 庄家暗牌(dHid)
  // 第2次pop = 玩家第2张(p2)
  // 第3次pop = 庄家明牌(dShow)
  // 第4次pop = 玩家第1张(p1)
  // 之后玩家每次要牌 = hitCards依次弹出
  const rigged = [...hitCards, p2, dShow, p1, dHid];
  return rigged;
}

function bjPop() {
  if (BJ.cheatMode && BJ.rigged.length > 0) return BJ.rigged.pop();
  if (BJ.deck.length < 20) BJ.deck = bjMakeDeck();
  return BJ.deck.pop();
}

/* ── 渲染 ── */
function bjCardEl(card, faceDown=false, delay=0) {
  const d = document.createElement('div');
  d.className = 'bj-card' + (faceDown?' back':'') + (BJ_RED.has(card.suit)&&!faceDown?' red':'');
  d.dataset.suit = card.suit; d.dataset.val = card.val;
  if (!faceDown) d.innerHTML = `<div class="bj-card-inner"><div class="bj-card-corner-tl">${card.val}<br>${card.suit}</div><div class="bj-card-center">${card.suit}</div><div class="bj-card-corner-br">${card.val}<br>${card.suit}</div></div>`;
  setTimeout(() => d.classList.add('dealt'), delay);
  return d;
}
function bjFlip(el, card) {
  el.classList.remove('back'); if(BJ_RED.has(card.suit))el.classList.add('red');
  el.innerHTML = `<div class="bj-card-inner"><div class="bj-card-corner-tl">${card.val}<br>${card.suit}</div><div class="bj-card-center">${card.suit}</div><div class="bj-card-corner-br">${card.val}<br>${card.suit}</div></div>`;
  el.classList.add('flip-anim'); setTimeout(()=>el.classList.remove('flip-anim'),400);
}
function bjRender(hd=true) {
  const ph=document.getElementById('bj-player-hand'), dh=document.getElementById('bj-dealer-hand');
  ph.innerHTML=''; dh.innerHTML='';
  BJ.player.forEach((c,i) => ph.appendChild(bjCardEl(c,false,i*120)));
  BJ.dealer.forEach((c,i) => dh.appendChild(bjCardEl(c,hd&&i===1,i*120)));
  document.getElementById('bj-player-score').textContent = bjScore(BJ.player);
  document.getElementById('bj-dealer-score').textContent = hd ? bjNum(BJ.dealer[0]) : bjScore(BJ.dealer);
  document.getElementById('bj-bet-val').textContent   = BJ.bet;
  document.getElementById('bj-chips-val').textContent = BJ.chips;
}
function bjAdd(t,c,d=0) { document.getElementById(t==='player'?'bj-player-hand':'bj-dealer-hand').appendChild(bjCardEl(c,false,d)); }
function bjBtns(ids) {
  ['bj-deal-btn','bj-hit-btn','bj-stand-btn','bj-double-btn','bj-split-btn','bj-insure-btn','bj-new-btn'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display=ids.includes(id)?'':'none';
  });
}
function bjChips(v) { document.querySelectorAll('.bj-chip').forEach(c=>c.classList.toggle('disabled',v)); }
function bjRes(t,cls='') { const el=document.getElementById('bj-result'); el.textContent=t; el.className='bj-result show '+cls; }
function bjClrRes() { const el=document.getElementById('bj-result'); el.textContent=''; el.className='bj-result'; }

/* ── 规则页显示/隐藏 ── */
function bjShowRules() {
  document.getElementById('bj-rules-page').style.display = 'flex';
  document.getElementById('bj-game-page').style.display  = 'none';
}
function bjAckRules() {
  BJ.rulesAcked = true;
  document.getElementById('bj-rules-page').style.display = 'none';
  document.getElementById('bj-game-page').style.display  = 'flex';
  bjNewRound();
}

/* ── 开局 ── */
function bjOpen(ci) {
  if (!curWorld?.chars?.[ci]) return;
  BJ.charIdx = ci;
  const ch = curWorld.chars[ci];
  const avHtml = ch.portrait ? `<img src="${ch.portrait}" alt="">` : (ch.name[0]||'?');
  // 规则页头像
  const av = document.getElementById('bj-char-av');
  if (av) { av.innerHTML = avHtml; }
  const nm = document.getElementById('bj-char-nm');
  if (nm) nm.textContent = ch.name;
  // 游戏页头像
  const av2 = document.getElementById('bj-char-av2');
  if (av2) { av2.innerHTML = avHtml; }
  const nm2 = document.getElementById('bj-char-nm2');
  if (nm2) nm2.textContent = ch.name;

  // 规则页台词
  const rulesSpeech = document.getElementById('bj-rules-speech');
  if (rulesSpeech) rulesSpeech.textContent = bjLine(ci, 'rules');

  document.getElementById('bj-modal').classList.add('op');
  document.body.style.overflow = 'hidden';

  if (!BJ.rulesAcked) {
    bjShowRules();
  } else {
    document.getElementById('bj-rules-page').style.display = 'none';
    document.getElementById('bj-game-page').style.display  = 'flex';
    bjNewRound();
  }
}
function bjClose() { document.getElementById('bj-modal').classList.remove('op'); document.body.style.overflow=''; }
function bjModalBgClick(e) { if(e.target===document.getElementById('bj-modal'))bjClose(); }

/* ── 新一局（含作弊判定） ── */
function bjNewRound() {
  if (!BJ.deck.length) BJ.deck = bjMakeDeck();

  // 作弊判定（静默）
  // charIdx=1（乱数）：必作弊
  // charIdx=0（悠葉）：30% 概率作弊（乱数在旁边"帮忙"）
  // charIdx=1(乱数)必作弊；charIdx=0(悠葉)5%概率乱数出现
  BJ.cheatMode = BJ.charIdx === 1 || Math.random() < 0.05;
  if (BJ.cheatMode) BJ.rigged = bjMakeRiggedDeck();

  BJ.player=[]; BJ.playerSplit=null; BJ.dealer=[];
  BJ.bet=0; BJ.insureBet=0; BJ.insured=false; BJ.phase='bet';
  ['bj-player-hand','bj-dealer-hand'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});
  ['bj-player-score','bj-dealer-score'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='';});
  document.getElementById('bj-bet-val').textContent   = '0';
  document.getElementById('bj-chips-val').textContent = BJ.chips;
  bjClrRes(); bjChips(false); bjSay('idle');
  if(BJ.chips<=0){BJ.chips=1000;document.getElementById('bj-chips-val').textContent=1000;}
  bjBtns(['bj-deal-btn']);
  document.getElementById('bj-deal-btn').disabled = true;
}

function bjBet(amount) {
  if(BJ.phase!=='bet'||BJ.chips<amount)return;
  BJ.bet+=amount; BJ.chips-=amount;
  document.getElementById('bj-bet-val').textContent   = BJ.bet;
  document.getElementById('bj-chips-val').textContent = BJ.chips;
  document.getElementById('bj-deal-btn').disabled = false;
}
function bjDeal() {
  if(!BJ.bet)return; BJ.phase='play'; bjChips(true);
  BJ.player=[bjPop(),bjPop()]; BJ.dealer=[bjPop(),bjPop()];
  bjRender(true); bjSay('deal');
  setTimeout(()=>{
    if(bjScore(BJ.player)===21){bjSay('bjack');bjReveal();return;}
    const btns=['bj-hit-btn','bj-stand-btn'];
    if(BJ.chips>=BJ.bet)btns.push('bj-double-btn');
    if(BJ.player[0].val===BJ.player[1].val&&BJ.chips>=BJ.bet)btns.push('bj-split-btn');
    if(BJ.dealer[0].val==='A'&&!BJ.insured&&BJ.chips>=Math.floor(BJ.bet/2))btns.push('bj-insure-btn');
    bjBtns(btns);
  },700);
}
function bjHit() {
  const c=bjPop(); BJ.player.push(c); bjAdd('player',c);
  document.getElementById('bj-player-score').textContent = bjScore(BJ.player);
  bjSay('hit');
  ['bj-double-btn','bj-split-btn','bj-insure-btn'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  const s=bjScore(BJ.player);
  if(s>21){bjSay('bust');bjReveal();}else if(s===21)bjStand();
}
function bjStand() { bjSay('stand'); bjBtns([]); bjDealerPlay(); }
function bjDouble() {
  if(BJ.chips<BJ.bet)return; BJ.chips-=BJ.bet; BJ.bet*=2;
  document.getElementById('bj-bet-val').textContent   = BJ.bet;
  document.getElementById('bj-chips-val').textContent = BJ.chips;
  bjSay('double'); const c=bjPop(); BJ.player.push(c); bjAdd('player',c);
  setTimeout(()=>{document.getElementById('bj-player-score').textContent=bjScore(BJ.player);bjReveal();},400);
}
function bjSplit() {
  if(BJ.chips<BJ.bet)return; BJ.chips-=BJ.bet;
  BJ.playerSplit=[BJ.player.pop()]; BJ.player.push(bjPop());
  bjSay('split'); bjRender(true);
  setTimeout(()=>bjBtns(['bj-hit-btn','bj-stand-btn']),400);
}
function bjInsure() {
  const ins=Math.floor(BJ.bet/2); if(BJ.chips<ins)return;
  BJ.chips-=ins; BJ.insureBet=ins; BJ.insured=true; bjSay('insure');
  const el=document.getElementById('bj-insure-btn'); if(el)el.style.display='none';
  document.getElementById('bj-chips-val').textContent = BJ.chips;
}

/* 庄家补牌：作弊时找能赢玩家且≤21的牌，找不到才随机 */
function bjDealerStep(resolve) {
  if (bjScore(BJ.dealer) < 17) {
    let card;
    if (BJ.cheatMode) {
      if (!BJ.deck.length) BJ.deck = bjMakeDeck();
      const ps = bjScore(BJ.player);
      // 优先找：补后 > 玩家分数 且 ≤21
      let idx = BJ.deck.findIndex(c => {
        const t = bjScore([...BJ.dealer, c]);
        return t > ps && t <= 21;
      });
      // 次选：补后 ≥17 且 ≤21（至少站稳）
      if (idx < 0) idx = BJ.deck.findIndex(c => {
        const t = bjScore([...BJ.dealer, c]);
        return t >= 17 && t <= 21;
      });
      card = idx >= 0 ? BJ.deck.splice(idx,1)[0] : BJ.deck.pop();
    } else {
      card = bjPop();
    }
    BJ.dealer.push(card); bjAdd('dealer',card);
    document.getElementById('bj-dealer-score').textContent = bjScore(BJ.dealer);
    setTimeout(() => bjDealerStep(resolve), 500);
  } else {
    setTimeout(resolve, 400);
  }
}

function bjDealerPlay() {
  const dh=document.getElementById('bj-dealer-hand');
  const hidden=dh.querySelector('.bj-card.back'); if(hidden)bjFlip(hidden,BJ.dealer[1]);
  document.getElementById('bj-dealer-score').textContent = bjScore(BJ.dealer);
  if(BJ.insured&&bjScore(BJ.dealer)===21)BJ.chips+=BJ.insureBet*3;
  bjDealerStep(bjSettle);
}
function bjReveal() {
  bjBtns([]);
  const dh=document.getElementById('bj-dealer-hand');
  const hidden=dh.querySelector('.bj-card.back'); if(hidden)bjFlip(hidden,BJ.dealer[1]);
  setTimeout(()=>{
    document.getElementById('bj-dealer-score').textContent = bjScore(BJ.dealer);
    bjDealerPlay();
  },500);
}
function bjSettle() {
  const ps=bjScore(BJ.player), ds=bjScore(BJ.dealer), isBJ=BJ.player.length===2&&ps===21;
  let outcome, payout;
  if(ps>21)                  {outcome='bust'; payout=0;}
  else if(ds>21||ps>ds)      {outcome=isBJ?'bjack':'win'; payout=isBJ?BJ.bet+Math.floor(BJ.bet*1.5):BJ.bet*2;}
  else if(ps===ds)            {outcome='push'; payout=BJ.bet;}
  else                        {outcome='lose'; payout=0;}
  BJ.chips+=payout; BJ.phase='over';
  const L={bust:['爆牌','BUST','lose'],win:['你赢了','YOU WIN','win'],bjack:['21点！','BLACKJACK!','win'],push:['平局','PUSH','push'],lose:['你输了','YOU LOSE','lose']};
  const[cn,en,cls]=L[outcome];
  bjRes(`${cn}  ${en}`,cls);
  bjSay(outcome==='bust'?'bust':outcome==='win'||outcome==='bjack'?'win':outcome==='push'?'push':'lose');
  document.getElementById('bj-chips-val').textContent = BJ.chips;
  bjBtns(['bj-new-btn']);
}

function updateGameBtns(){
  const b0=document.getElementById('game-btn-0'), b1=document.getElementById('game-btn-1');
  if(!curWorld)return;
  // 只在夜曲（w1）显示游戏入口
  const show = curWorld.id === 'w1';
  if(b0)b0.style.display=(show && curWorld.chars?.[0])?'flex':'none';
  if(b1)b1.style.display=(show && curWorld.chars?.[1])?'flex':'none';
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const bj=document.getElementById('bj-modal');
    if(bj?.classList.contains('op')){bjClose();return;}
    const gal=document.getElementById('gal-modal');
    if(gal?.classList.contains('op')){galModalClose();return;}
  }
});