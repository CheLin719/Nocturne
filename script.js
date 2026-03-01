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

/**
 * 加载一批图片的真实宽高比
 * ratio > 1 横图，< 1 竖图，= 1 方图
 */
function loadImageRatios(srcs) {
  return Promise.all(srcs.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve({ src, ratio: img.naturalWidth / img.naturalHeight });
    img.onerror = () => resolve({ src, ratio: 1 });
    img.src = src;
  })));
}

/**
 * 从所有图片中自动挑选最佳预览组合（最多6张）
 * 策略：按比例分桶（横/竖/方），各桶均衡抽取，保证展示多样性
 */
function pickBestPreview(items, max = 6) {
  if (items.length <= max) return items;

  const landscape = items.filter(it => it.ratio >= 1.25);
  const portrait  = items.filter(it => it.ratio < 0.8);
  const square    = items.filter(it => it.ratio >= 0.8 && it.ratio < 1.25);

  const picked = [];
  const used   = new Set();

  const take = (pool, n) => {
    for (const it of pool) {
      if (picked.length >= max) break;
      if (!used.has(it.src)) { picked.push(it); used.add(it.src); }
      if (picked.length >= n) break;
    }
  };

  // 2横 + 2竖 + 2方，按实际库存灵活分配
  take(landscape, Math.ceil(max / 3));
  take(portrait,  Math.ceil(max / 3));
  take(square,    max);
  // 不足的从剩余补
  take(items.filter(it => !used.has(it.src)), max);

  return picked;
}

/**
 * 构建预览画廊
 * 使用 CSS columns 瀑布流，图片保持原始比例，无裁切
 */
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
    // 无图占位
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

  // 加载全部图片比例 → 挑选最佳组合 → 渲染
  loadImageRatios(allImgs).then(allItems => {
    const preview = pickBestPreview(allItems, 6);
    galEl.innerHTML = '';

    preview.forEach(it => {
      const item = document.createElement('div');
      item.className = 'gi';
      const img = document.createElement('img');
      img.src     = it.src;
      img.alt     = '';
      img.loading = 'lazy';
      item.appendChild(img);
      item.onclick = () => lbOpen(it.src);
      galEl.appendChild(item);
    });

    // 淡入
    let loaded = 0;
    const imgs = galEl.querySelectorAll('img');
    const onLoad = () => { loaded++; if (loaded >= imgs.length) galEl.style.opacity = '1'; };
    imgs.forEach(img => {
      if (img.complete) onLoad();
      else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
    });
    if (imgs.length === 0) galEl.style.opacity = '1';
  });
}

/* ── 画廊弹窗 ── */
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
      img.src     = src;
      img.alt     = '';
      img.loading = 'lazy';
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

// ESC 关闭画廊弹窗
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('gal-modal');
    if (modal && modal.classList.contains('op')) { galModalClose(); return; }
  }
});
