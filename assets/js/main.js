/* SUNSEE 2.0｜首頁互動 */
(function(){
'use strict';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = window.matchMedia('(max-width: 900px)').matches;
const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.connection && navigator.connection.saveData);
if (reduceMotion) document.documentElement.classList.add('low-motion');

/* ---------- 導覽 ---------- */
const header = document.getElementById('siteHeader');
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
menuBtn.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobileNav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); }));
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* ---------- 按鈕柔光（跟隨滑鼠位置） ---------- */
document.addEventListener('pointermove', e => {
  const b = e.target.closest && e.target.closest('.btn');
  if (!b) return;
  const r = b.getBoundingClientRect();
  b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  b.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, {passive:true});

/* ---------- 捲動顯現 ---------- */
function observeReveal(root){
  const els = (root || document).querySelectorAll('.reveal:not(.in)');
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  els.forEach(el => io.observe(el));
}
observeReveal();

/* ---------- 微光粒子（少量、緩慢；減少動態時關閉） ---------- */
function glow(canvas){
  if (reduceMotion) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, dots = [], running = false, raf;
  const count = (isSmall || lowPower) ? 9 : 22;
  function resize(){
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function seed(){
    dots = Array.from({length:count}, () => ({
      x: Math.random()*w, y: Math.random()*h, r: 1 + Math.random()*2.4,
      vx: (Math.random()-.5)*.12, vy: -.05 - Math.random()*.16,
      a: .25 + Math.random()*.45, p: Math.random()*Math.PI*2
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for (const d of dots){
      d.x += d.vx; d.y += d.vy; d.p += .012;
      if (d.y < -10) { d.y = h + 10; d.x = Math.random()*w; }
      if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10;
      const alpha = d.a * (.6 + .4*Math.sin(d.p));
      const g = ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r*6);
      g.addColorStop(0, `rgba(216,193,148,${alpha})`); g.addColorStop(1,'rgba(216,193,148,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x,d.y,d.r*6,0,Math.PI*2); ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }
  resize(); seed();
  window.addEventListener('resize', () => { resize(); seed(); }, {passive:true});
  // 只在可見時運作，節省效能
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running && !document.hidden) { running = true; tick(); }
    else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) { running = false; cancelAnimationFrame(raf); } });
}
document.querySelectorAll('.glow-canvas').forEach(glow);

/* ---------- 五大計畫展廊 ---------- */
const gallery = document.getElementById('gallery');
const plans = [...gallery.querySelectorAll('.plan')];
const order = plans.map(p => p.dataset.scene);           // 01→05 依畫面順序
const visited = new Set();
const pips = [...document.querySelectorAll('#pips i')];
const litCount = document.getElementById('litCount');
function setActive(plan, mark){
  plans.forEach(p => { const on = p === plan; p.classList.toggle('active', on); p.setAttribute('aria-expanded', String(on)); });
  gallery.classList.toggle('has-active', !!plan);
  if (plan && mark) { visited.add(plan.dataset.scene); updateLit(); }
}
function updateLit(){
  pips.forEach((p,i) => p.classList.toggle('on', visited.has(order[i])));
  litCount.textContent = `${visited.size} / ${order.length}`;
}
const hoverable = window.matchMedia('(hover:hover) and (min-width:901px)');
let hoverLockUntil = 0;   // 從首屏星圖跳過來時，避免捲動中的游標誤觸其他展板
plans.forEach(p => {
  p.addEventListener('mouseenter', () => { if (hoverable.matches && Date.now() > hoverLockUntil) setActive(p, true); });
  p.addEventListener('focus', () => setActive(p, true));
  p.addEventListener('click', e => {
    if (e.target.closest('a')) return;            // 「深入了解」照常前往
    if (!hoverable.matches && p.classList.contains('active')) { setActive(null); return; }
    setActive(p, true);
    if (!hoverable.matches) p.scrollIntoView({behavior: reduceMotion ? 'auto':'smooth', inline:'center', block:'nearest'});
  });
  p.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const a = p.querySelector('.plan-go'); if (p.classList.contains('active') && e.key === 'Enter') a.click(); else setActive(p, true); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = plans.indexOf(p) + (e.key === 'ArrowRight' ? 1 : -1); if (plans[i]) plans[i].focus(); }
  });
});
gallery.addEventListener('mouseleave', () => { if (hoverable.matches && Date.now() > hoverLockUntil) setActive(plans[0], false); });
setActive(plans[0], false);
updateLit();

/* 首屏星圖：點光點 → 進入對應計畫；桌機滑鼠微視差 */
document.querySelectorAll('.hero-orbit .node').forEach(n => n.addEventListener('click', e => {
  const target = plans.find(p => p.dataset.scene === n.dataset.scene);
  if (target) { hoverLockUntil = Date.now() + 2500; setTimeout(() => setActive(target, true), 400); }
}));
(function(){
  const hero = document.querySelector('.hero');
  const layers = [...document.querySelectorAll('.orbit-par')];
  if (reduceMotion || !window.matchMedia('(hover:hover)').matches) return;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
    layers.forEach(l => { const d = +l.dataset.depth; l.style.transform = `translate(${(-dx*d).toFixed(1)}px,${(-dy*d).toFixed(1)}px)`; });
  }, {passive:true});
  hero.addEventListener('pointerleave', () => layers.forEach(l => l.style.transform = ''));
})();

/* ---------- 發光職人：手機滑動指示 ---------- */
const track = document.getElementById('peopleTrack');
const dotsBox = document.getElementById('peopleDots');
const cards = [...track.children];
dotsBox.innerHTML = cards.map(() => '<i></i>').join('');
const dots = [...dotsBox.children];
function syncDots(){
  const mid = track.scrollLeft + track.clientWidth/2;
  let best = 0, dist = Infinity;
  cards.forEach((c,i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth/2 - mid); if (d < dist) { dist = d; best = i; } });
  dots.forEach((d,i) => d.classList.toggle('on', i === best));
}
track.addEventListener('scroll', () => requestAnimationFrame(syncDots), {passive:true}); syncDots();

/* ---------- 合作卡片 → 自動帶入合作身份 ---------- */
document.querySelectorAll('[data-role]').forEach(a => a.addEventListener('click', () => {
  const sel = document.getElementById('roleSelect'); if (sel) sel.value = a.dataset.role;
}));

/* ======================================================
   微光店家（沿用原有邏輯：縣市篩選、附近定位、神攻整合、IG 嵌入）
   ====================================================== */
const SHOP_DATA = window.SUNSEE_SHOPS || [];
const grid = document.getElementById('shopGrid'), empty = document.getElementById('emptyState');
const nearbyBtn = document.getElementById('nearbyBtn'), nearbyStatus = document.getElementById('nearbyStatus');
const filtersBox = document.getElementById('filters');
let activeCity = '全部', nearbyMode = false, userPosition = null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brandOf = s => s.brand || s.name;

/* 首屏數字 */
(function stats(){
  const brands = new Set(SHOP_DATA.map(brandOf));
  const cities = new Set(SHOP_DATA.filter(s => !s.online).map(s => s.city));
  document.getElementById('statShops').textContent = brands.size;
  document.getElementById('statSpots').textContent = SHOP_DATA.length;
  document.getElementById('statCities').textContent = cities.size;
})();

/* 縣市篩選按鈕（依原有縣市順序，新縣市自動補上） */
const baseCities = ['新北市','台北市','台中市','台南市','桃園市','雲林縣','宜蘭縣','基隆市'];
const cityList = [...baseCities.filter(c => SHOP_DATA.some(s => s.city === c)), ...[...new Set(SHOP_DATA.map(s => s.city))].filter(c => !baseCities.includes(c))];
function brandCount(city){ return new Set(SHOP_DATA.filter(s => city === '全部' || s.city === city).map(brandOf)).size; }
filtersBox.innerHTML = ['全部', ...cityList].map(c => `<button class="filter-btn${c==='全部'?' active':''}" type="button" data-city="${esc(c)}" aria-pressed="${c==='全部'}">${c==='全部'?'全部合作店家':esc(c)}<span class="n">${brandCount(c)}</span></button>`).join('');
filtersBox.addEventListener('click', e => {
  const b = e.target.closest('.filter-btn'); if (!b) return;
  filtersBox.querySelectorAll('.filter-btn').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  render(b.dataset.city);
});

function haversineKm(lat1,lon1,lat2,lon2){
  const R=6371, toRad=v=>v*Math.PI/180, dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function formatDistance(km){ return km < 1 ? `${Math.round(km*1000)} 公尺` : `${km.toFixed(km<10?1:0)} 公里`; }

const icon = {
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  fb:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v7h4v-7h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
  web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>'
};

function render(city){
  if (city) activeCity = city;
  let rows = activeCity === '全部' ? SHOP_DATA.slice() : SHOP_DATA.filter(x => x.city === activeCity);
  if (nearbyMode && userPosition){
    rows.forEach(s => { s.distance = (Number.isFinite(s.lat) && Number.isFinite(s.lng)) ? haversineKm(userPosition.lat,userPosition.lng,s.lat,s.lng) : null; });
    rows.sort((a,b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  }
  /* 品牌整合：神攻各門市保留於資料中，前台合併為一張卡 */
  const display = [], groups = {};
  rows.forEach(s => {
    if (!s.brand) { display.push(s); return; }
    if (!groups[s.brand]) {
      groups[s.brand] = {...s, name:s.brand, branches:[], city: activeCity === '全部' ? '全台門市' : activeCity};
      display.push(groups[s.brand]);
    }
    groups[s.brand].branches.push(s);
  });
  Object.values(groups).forEach(g => {
    g.type = `特色咖哩沙威瑪・${g.branches.length} 間合作門市`;
    g.distance = g.branches[0].distance;
  });

  grid.innerHTML = display.map(s => {
    const social = s.ig || s.fb || s.website || '#shops';
    const actions = [];
    if (s.detailPage) actions.push(`<a class="chip main" href="${esc(s.detailPage)}">店家介紹</a>`);
    if (s.ig) actions.push(`<a class="chip" href="${esc(s.ig)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)} 官方 Instagram">${icon.ig}IG</a>`);
    if (s.fb) actions.push(`<a class="chip" href="${esc(s.fb)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)} 官方 Facebook">${icon.fb}Facebook</a>`);
    if (s.website) actions.push(`<a class="chip${s.online && !s.detailPage ? ' main' : ''}" href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">${icon.web}${esc(s.websiteLabel || '店家資訊')}</a>`);
    if (s.orderPage) actions.push(`<a class="chip" href="${esc(s.orderPage)}">企業／大量訂購</a>`);
    const dist = nearbyMode && s.distance != null ? `<span class="distance-pill">${s.branches ? '最近門市 ' : ''}${formatDistance(s.distance)}</span>` : '';
    const details = s.branches
      ? `<details class="shop-details"><summary>查看 ${s.branches.length} 間合作門市與地址</summary><p>${esc(s.desc)}</p><ul class="branches">${s.branches.map(b => `<li><strong>${esc(b.name.replace(s.brand + '｜',''))}</strong>（${esc(b.city)}）<br>${esc(b.address)}${nearbyMode && b.distance != null ? ' · ' + formatDistance(b.distance) : ''}</li>`).join('')}</ul><p style="font-size:12.5px;color:var(--muted)">${esc(s.status)}｜${esc(s.contact)}</p></details>`
      : `<details class="shop-details"><summary>店家資訊與支持方式</summary><p>${esc(s.desc)}</p><dl><dt>支持方式</dt><dd>${esc(s.status)}</dd>${s.address ? `<dt>地址</dt><dd>${esc(s.address)}</dd>` : '<dt>購買方式</dt><dd>線上訂購</dd>'}<dt>聯絡</dt><dd>${esc(s.contact)}</dd></dl>${s.embed && s.embedUrl ? `<div class="ig-stage ig-lazy-embed" data-instagram-permalink="${esc(s.embedUrl)}"></div>` : ''}</details>`;
    return `<article class="shop-card reveal">
      <a class="shop-cover" href="${esc(s.detailPage || social)}"${s.detailPage ? '' : ' target="_blank" rel="noopener noreferrer"'} aria-label="${esc(s.name)}"><span class="shop-city">${esc(s.city)}</span>${dist}<img src="${esc(s.img)}"${s.imgPos ? ` style="object-position:${esc(s.imgPos)}"` : ''} alt="${esc(s.coverAlt || s.name)}" loading="lazy" decoding="async" data-name="${esc(s.name)}"></a>
      <div class="shop-body"><h3>${esc(s.name)}</h3><p class="shop-type">${esc(s.type)}</p><div class="shop-actions">${actions.join('')}</div>${details}</div>
    </article>`;
  }).join('');
  grid.style.display = display.length ? '' : 'none';
  empty.style.display = display.length ? 'none' : 'block';
  setupLazyInstagramEmbeds();
  observeReveal(grid);
  grid.querySelectorAll('.shop-cover img').forEach(img => {
    const fail = () => { const a = img.parentElement; a.classList.add('noimg'); img.remove(); a.insertAdjacentHTML('beforeend', `<span class="ph">${img.dataset.name}<small>商品照片待補</small></span>`); };
    if (img.complete && !img.naturalWidth) fail(); else img.addEventListener('error', fail, {once:true});
  });
}

/* 官方 Instagram 嵌入：展開店家資訊後才載入 */
let igLoading = false, igCallbacks = [];
function ensureInstagramScript(cb){
  if (window.instgrm && window.instgrm.Embeds) { cb(); return; }
  igCallbacks.push(cb); if (igLoading) return; igLoading = true;
  const s = document.createElement('script'); s.src = 'https://www.instagram.com/embed.js'; s.async = true;
  s.onload = () => { igLoading = false; igCallbacks.splice(0).forEach(fn => fn()); };
  s.onerror = () => { igLoading = false; igCallbacks = []; };
  document.body.appendChild(s);
}
function loadInstagramStage(stage){
  if (!stage || stage.dataset.loaded === '1') return;
  stage.dataset.loaded = '1';
  const bq = document.createElement('blockquote');
  bq.className = 'instagram-media'; bq.setAttribute('data-instgrm-permalink', stage.dataset.instagramPermalink); bq.setAttribute('data-instgrm-version','14');
  bq.style.cssText = 'background:#fff;border:0;margin:0 auto;max-width:540px;min-width:260px;padding:0;width:100%;';
  stage.appendChild(bq);
  ensureInstagramScript(() => window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process());
}
function setupLazyInstagramEmbeds(){
  grid.querySelectorAll('.shop-details').forEach(d => d.addEventListener('toggle', () => { if (d.open) loadInstagramStage(d.querySelector('.ig-lazy-embed')); }, {once:false}));
}

/* 附近微光：沿用原本 Nominatim 查詢與瀏覽器快取（不儲存使用者定位） */
async function geocodeShop(shop){
  if (!shop.address || (Number.isFinite(shop.lat) && Number.isFinite(shop.lng))) return false;
  const cacheKey = 'sunsee_geo_' + shop.address;
  try { const c = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (c && Number.isFinite(c.lat)) { shop.lat = c.lat; shop.lng = c.lng; return false; } } catch(_){}
  const q = encodeURIComponent(shop.address.replace(/（.*?）/g,'').replace(/[0-9]+F\b/gi,''));
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tw&accept-language=zh-TW&q=${q}`, {headers:{'Accept':'application/json'}});
    if (!res.ok) throw new Error('geocode');
    const r = await res.json();
    if (r && r[0]) { shop.lat = parseFloat(r[0].lat); shop.lng = parseFloat(r[0].lon); try { localStorage.setItem(cacheKey, JSON.stringify({lat:shop.lat,lng:shop.lng})); } catch(_){} }
  } catch(_){}
  return true; // 有實際查詢 → 需要間隔
}
function setStatusHTML(t, d){ nearbyStatus.innerHTML = `<strong>${t}</strong><span>${d}</span>`; }
nearbyBtn.addEventListener('click', () => {
  if (!window.isSecureContext && location.hostname !== 'localhost') { setStatusHTML('目前瀏覽環境無法使用定位','請使用 HTTPS 開啟 SUNSEE。'); return; }
  if (!navigator.geolocation) { setStatusHTML('你的瀏覽器不支援定位','仍可使用下方縣市篩選。'); return; }
  nearbyBtn.disabled = true; nearbyBtn.classList.add('is-loading');
  setStatusHTML('正在取得你的位置…','第一次使用時，瀏覽器會詢問定位權限。');
  navigator.geolocation.getCurrentPosition(async pos => {
    userPosition = {lat:pos.coords.latitude, lng:pos.coords.longitude};
    setStatusHTML('正在尋找附近微光…','第一次搜尋需要確認各店家位置，請稍候。');
    for (let i = 0; i < SHOP_DATA.length; i++){
      const queried = await geocodeShop(SHOP_DATA[i]);
      if (queried && i < SHOP_DATA.length - 1) await new Promise(r => setTimeout(r, 1050)); // 遵守 Nominatim 每秒一次限制；已快取者不等待
    }
    nearbyMode = true;
    nearbyBtn.disabled = false; nearbyBtn.classList.remove('is-loading'); nearbyBtn.classList.add('is-active');
    nearbyBtn.innerHTML = '<span class="nearby-btn-icon">✓</span><span>已依距離排序</span>';
    filtersBox.querySelectorAll('.filter-btn').forEach(b => { const on = b.dataset.city === '全部'; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    const located = SHOP_DATA.filter(s => Number.isFinite(s.lat)).length;   // 線上店家沒有座標，排在最後
    setStatusHTML('已找到你的附近微光', `${located} 個據點已依由近到遠排序。`);
    render('全部');
    grid.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
  }, err => {
    nearbyBtn.disabled = false; nearbyBtn.classList.remove('is-loading');
    let t = '無法取得目前位置', d = '你仍然可以使用下方縣市篩選。';
    if (err.code === 1) { t = '你尚未允許定位'; d = '若想使用附近搜尋，可在瀏覽器網址列重新開啟位置權限。'; }
    else if (err.code === 2) d = '目前裝置無法判斷位置，請稍後再試。';
    else if (err.code === 3) d = '定位等待時間較久，請再按一次搜尋附近微光。';
    setStatusHTML(t, d);
  }, {enableHighAccuracy:false, timeout:12000, maximumAge:300000});
});
render('全部');

/* ======================================================
   合作申請表單（既有 FormSubmit AJAX 流程，邏輯未變更）
   ====================================================== */
(function(){
  const form = document.getElementById('sunseeContactForm');
  const submitBtn = document.getElementById('sunseeFormSubmit');
  const statusBox = document.getElementById('sunseeAjaxStatus');
  const success = document.getElementById('sunseeSubmitSuccess');
  const localWarn = document.getElementById('sunseeLocalFormWarning');
  document.getElementById('closeLocalFormWarning').addEventListener('click', () => { localWarn.classList.remove('is-show'); localWarn.setAttribute('aria-hidden','true'); });
  const original = submitBtn.innerHTML;
  const setStatus = (m, t) => { statusBox.textContent = m || ''; statusBox.classList.remove('is-error','is-success'); if (t) statusBox.classList.add(t); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (location.protocol === 'file:') { localWarn.classList.add('is-show'); localWarn.setAttribute('aria-hidden','false'); return; }
    if (!form.reportValidity()) return;
    submitBtn.disabled = true; submitBtn.innerHTML = '送出中…'; setStatus('正在送出表單，請稍候。');
    try {
      const payload = {};
      for (const [k,v] of new FormData(form).entries()){
        if (k === '_honey' && v) throw new Error('spam');
        if (Object.prototype.hasOwnProperty.call(payload,k)) { if (!Array.isArray(payload[k])) payload[k] = [payload[k]]; payload[k].push(v); } else payload[k] = v;
      }
      payload._url = 'https://sunsee.tw/'; payload._subject = 'SUNSEE 官網｜新的合作申請'; payload._template = 'table';
      const res = await fetch('https://formsubmit.co/ajax/sunseeus@gmail.com', {method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload)});
      let data = {}; try { data = await res.json(); } catch(_){}
      if (!res.ok) throw new Error((data && data.message) || 'submit_failed');
      form.reset(); setStatus('已成功送出。','is-success');
      success.classList.add('is-show'); success.setAttribute('aria-hidden','false');
      setTimeout(() => { success.classList.remove('is-show'); success.setAttribute('aria-hidden','true'); window.scrollTo({top:0,behavior:'smooth'}); try { history.replaceState({}, document.title, location.pathname || '/'); } catch(_){} }, 2200);
    } catch(err) {
      setStatus(err && err.message === 'spam' ? '無法送出表單，請重新整理後再試。' : '目前送出失敗，請稍後再試；若持續失敗，可直接聯繫 SUNSEE。', 'is-error');
    } finally { submitBtn.disabled = false; submitBtn.innerHTML = original; }
  });
})();
})();
