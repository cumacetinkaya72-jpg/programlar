'use strict';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const JOB_TITLES = {
  install: 'Kurulum',
  upgrade: 'Paket güncellemesi',
  direct: 'Doğrudan zapret2 güncellemesi',
  rollback: 'Geri alma',
  uninstall: 'Kaldırma',
  panel_update: 'Panel güncellemesi',
  restore: 'Yedekten geri yükleme',
  check: 'Güncelleme denetimi',
};

let state = null;
let currentFile = null;
let logTimer = null;

// ------------------------------------------------------------------ API

async function api(action, params = {}, body = null, raw = false) {
  const qs = new URLSearchParams({ a: action, ...params });
  const res = await fetch('api.cgi?' + qs.toString(), {
    method: 'POST',
    headers: { 'X-Z2P': '1', 'Content-Type': 'text/plain; charset=utf-8' },
    body: body ?? '',
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    showAuth(false);
    throw new Error('Oturum süresi doldu');
  }
  if (raw) {
    const ct = res.headers.get('Content-Type') || '';
    if (ct.includes('json')) {
      const j = await res.json();
      throw new Error(j.error || 'Hata');
    }
    return res.text();
  }
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'İşlem başarısız');
  return j;
}

function toast(msg, bad = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (bad ? ' bad' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('hidden'), bad ? 6000 : 3000);
}

async function guard(fn) {
  try {
    return await fn();
  } catch (e) {
    toast(e.message, true);
  }
}

// ---------------------------------------------------------------- giriş

async function boot() {
  try {
    const s = await api('auth_state');
    if (s.auth) return startApp();
    showAuth(s.setup);
  } catch (e) {
    showAuth(false);
    $('authErr').textContent = e.message;
  }
}

function showAuth(setup) {
  $('app').classList.add('hidden');
  $('auth').classList.remove('hidden');
  $('authForm').dataset.setup = setup ? '1' : '';
  $('authPw2').classList.toggle('hidden', !setup);
  $('authPw2').required = !!setup;
  $('authPw').autocomplete = setup ? 'new-password' : 'current-password';
  $('authHint').textContent = setup ? 'İlk kullanım: panel parolası belirleyin (en az 6 karakter).' : 'Keenetic zapret2 yönetim paneli';
  $('authBtn').textContent = setup ? 'Parolayı kaydet' : 'Giriş';
  $('authPw').focus();
}

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const setup = $('authForm').dataset.setup === '1';
  const pw = $('authPw').value;
  $('authErr').textContent = '';
  if (setup && pw !== $('authPw2').value) {
    $('authErr').textContent = 'Parolalar eşleşmiyor';
    return;
  }
  $('authBtn').disabled = true;
  try {
    await api(setup ? 'setup' : 'login', {}, pw);
    $('authPw').value = $('authPw2').value = '';
    startApp();
  } catch (err) {
    $('authErr').textContent = err.message;
  } finally {
    $('authBtn').disabled = false;
  }
});

function startApp() {
  $('auth').classList.add('hidden');
  $('app').classList.remove('hidden');
  refreshStatus();
  checkRunningJob();
}

// --------------------------------------------------------------- sekmeler

$('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('hidden', t.id !== 'tab-' + b.dataset.tab));
  const tab = b.dataset.tab;
  if (tab === 'files') loadFiles();
  if (tab === 'logs') loadLog();
  if (tab === 'backups') loadBackups();
  if (tab === 'quick') loadQuick();
  if (tab === 'overview' || tab === 'panel' || tab === 'update') refreshStatus();
  if (tab !== 'logs') setLogAuto(false);
});

// ------------------------------------------------------------ genel bakış

function cmpVer(a, b) {
  const pa = String(a || '').replace(/^v/, '').split(/[^0-9]+/).map(Number);
  const pb = String(b || '').replace(/^v/, '').split(/[^0-9]+/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function verBadge(installed, latest) {
  if (!installed) return '<span class="badge bad">kurulu değil</span>';
  if (!latest) return '<span class="badge">bilinmiyor</span>';
  return cmpVer(latest, installed) > 0
    ? '<span class="badge up">güncelleme var</span>'
    : '<span class="badge ok">güncel</span>';
}

async function refreshStatus() {
  const s = await guard(() => api('status'));
  if (!s) return;
  state = s;
  const d = s.device;
  $('hdrModel').textContent = [d.model, d.hw_id].filter(Boolean).join(' · ');

  for (const [dot, txt] of [['svcDot', 'svcText'], ['svcDot2', 'svcText2']]) {
    $(dot).className = 'dot ' + (s.running ? 'on' : 'off');
    $(txt).textContent = !s.installed ? 'nfqws2 kurulu değil' : s.running ? 'nfqws2 çalışıyor' : 'nfqws2 durdu';
  }

  const kv = (rows) => rows.filter((r) => r[1] !== undefined && r[1] !== '').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  $('devInfo').innerHTML = kv([
    ['Model', d.model || '—'],
    ['Donanım', d.hw_id],
    ['KeeneticOS', d.firmware],
    ['Mimari', `${d.machine} (depo: ${d.repo_arch}, ikili: ${d.zbin || '?'})`],
    ['Çekirdek', d.kernel],
  ]);
  const modeNames = { auto: 'Otomatik', list: 'Liste', all: 'Tümü', custom: 'Özel' };
  $('svcInfo').innerHTML = kv([
    ['Mod', s.installed ? modeNames[s.mode] || s.mode : ''],
    ['ISP arayüzü', s.isp_interface],
    ['IPv6', s.installed ? (s.ipv6 === '1' ? 'açık' : 'kapalı') : ''],
  ]);

  const L = s.latest;
  const bin = s.bin_version + (s.direct_tag ? ' (doğrudan)' : '');
  $('verRows').innerHTML = [
    ['nfqws2-keenetic paketi', s.pkg_version, L.pkg, 'upgrade'],
    ['zapret2 / nfqws2 ikilisi', s.bin_version ? bin : '', L.zapret, 'direct'],
    ['Z2Panel', s.panel_version, L.panel, 'panel_update'],
  ].map(([name, inst, latest, job]) => {
    const upd = inst && latest && cmpVer(latest, inst) > 0;
    const btn = upd ? `<button class="btn small primary" data-job="${job}">Güncelle</button>` : '';
    return `<tr><td>${esc(name)}</td><td>${esc(inst || '—')}</td><td>${esc(latest || '—')}</td><td>${verBadge(inst, latest)} ${btn}</td></tr>`;
  }).join('');
  $('checkedAt').textContent = L.checked_at > 0
    ? 'Son denetim: ' + new Date(L.checked_at * 1000).toLocaleString('tr-TR')
    : 'Henüz güncelleme denetimi yapılmadı.';

  // uyarılar
  const al = [];
  if (!s.entware) al.push(['bad', 'Entware (opkg) bulunamadı. Önce Keenetic\'e Entware kurun: help.keenetic.com → “OPKG paket yöneticisi”.']);
  if (!s.kmods) al.push(['bad', 'nfnetlink_queue çekirdek modülü yok. Keenetic arayüzü → Genel ayarlar → Bileşenler → <b>“Netfilter alt sistemi çekirdek modülleri”</b> bileşenini kurun.']);
  if (s.entware && !s.installed) al.push(['', 'nfqws2 kurulu değil. <button class="btn small primary" data-job="install">Şimdi kur</button>']);
  if (s.installed && !s.running) al.push(['', 'nfqws2 servisi çalışmıyor. Günlükleri ve ISP arayüzü ayarını kontrol edin.']);
  if (s.opkg_new.trim()) al.push(['', 'Paket güncellemesiyle yeni varsayılan dosyalar geldi: <code>' + esc(s.opkg_new.trim()) + '</code> — Dosyalar sekmesinden karşılaştırabilirsiniz.']);
  if (s.direct_tag) al.push(['', `nfqws2 ikilisi doğrudan zapret2 ${esc(s.direct_tag)} sürümünden yüklendi. Sonraki paket güncellemesi bunu paket sürümüyle değiştirir.`]);
  $('alerts').innerHTML = al.map(([c, m]) => `<div class="alert ${c}">${m}</div>`).join('');

  $('btnRollback').disabled = !s.rollback;

  // panel sekmesi
  $('pVer').textContent = s.panel_version;
  $('pLatest').textContent = L.panel ? `(en güncel: ${L.panel})` : '';
  $('sCheck').checked = s.settings.auto_check;
  $('sUpgrade').checked = s.settings.auto_upgrade;
  $('sHour').value = s.settings.check_hour;
  $('cronHint').textContent = s.cron ? '' : 'Uyarı: Entware cron kurulu değil. Otomatik denetim için SSH\'tan: opkg install cron';
}

document.addEventListener('click', (e) => {
  const sb = e.target.closest('[data-svc]');
  if (sb) return serviceAction(sb.dataset.svc, sb);
  const jb = e.target.closest('[data-job]');
  if (jb) return startJob(jb.dataset.job);
});

async function serviceAction(cmd, btn) {
  if (cmd === 'stop' && !confirm('nfqws2 durdurulsun mu?')) return;
  btn.disabled = true;
  const r = await guard(() => api('service', { c: cmd }));
  btn.disabled = false;
  if (r) toast(r.output || 'Tamam', !r.ok);
  refreshStatus();
}

$('btnCheck').addEventListener('click', () => startJob('check'));

// ------------------------------------------------------------------ işler

const CONFIRM = {
  install: 'nfqws2-keenetic kurulsun mu? (opkg deposu eklenir ve paket kurulur)',
  upgrade: 'nfqws2-keenetic paketi güncellensin mi? Önce yapılandırma yedeği alınır.',
  rollback: 'Doğrudan güncelleme geri alınsın mı?',
  uninstall: 'nfqws2-keenetic kaldırılsın mı? Önce yedek alınır.',
  panel_update: 'Panel GitHub\'dan güncellensin mi?',
};

async function startJob(job, arg = '') {
  if (CONFIRM[job] && !confirm(CONFIRM[job])) return;
  const r = await guard(() => api('job_start', { j: job, arg }));
  if (r) openJob(job);
}

function openJob(job) {
  $('jobTitle').textContent = JOB_TITLES[job] || job;
  $('jobLog').textContent = '';
  $('jobModal').classList.remove('hidden');
  pollJob();
}

async function pollJob() {
  clearTimeout(pollJob.t);
  let s;
  try {
    s = await api('job_status');
  } catch (e) {
    // panel güncellemesi sırasında web sunucusu kısa süre yeniden başlar
    pollJob.t = setTimeout(pollJob, 2000);
    return;
  }
  if (s.name) $('jobTitle').textContent = JOB_TITLES[s.name] || s.name;
  const lg = $('jobLog');
  const atEnd = lg.scrollTop + lg.clientHeight >= lg.scrollHeight - 20;
  lg.textContent = s.log;
  if (atEnd) lg.scrollTop = lg.scrollHeight;
  const st = $('jobState');
  if (s.running) {
    st.className = 'badge up';
    st.textContent = 'çalışıyor…';
    if (!$('jobModal').classList.contains('hidden')) pollJob.t = setTimeout(pollJob, 1500);
  } else {
    st.className = 'badge ' + (s.rc === 0 ? 'ok' : 'bad');
    st.textContent = s.rc === 0 ? 'tamamlandı' : s.rc === null ? '—' : 'başarısız';
    refreshStatus();
  }
}

async function checkRunningJob() {
  try {
    const s = await api('job_status');
    if (s.running) openJob(s.name);
  } catch (e) { /* yok say */ }
}

$('jobClose').addEventListener('click', () => {
  $('jobModal').classList.add('hidden');
  clearTimeout(pollJob.t);
});
$('btnJobLog').addEventListener('click', () => openJob(''));

$('btnDirect').addEventListener('click', () => {
  const tag = $('directTag').value.trim();
  if (tag && !/^v[0-9][0-9A-Za-z._-]*$/.test(tag)) return toast('Etiket "v1.0.5.2" biçiminde olmalı', true);
  if (!confirm(`nfqws2 doğrudan zapret2 ${tag || 'son sürüm'} ile güncellensin mi?\n\nBu, Keenetic paketindeki yamaları içermez. Sorun olursa “Geri al” kullanılabilir.`)) return;
  guard(async () => {
    await api('job_start', { j: 'direct', arg: tag });
    openJob('direct');
  });
});

// ---------------------------------------------------------- hızlı ayarlar

async function loadQuick() {
  if (!state) await refreshStatus();
  if (!state) return;
  $('qMode').value = state.mode;
  $('qIface').value = state.isp_interface;
  $('qV6').checked = state.ipv6 === '1';
  const ifs = await guard(() => api('interfaces'));
  if (ifs) {
    const list = ifs.interfaces.filter((i) => i.addr).map((i) => `${i.name} (${i.addr})`).join(', ');
    $('qIfaceHint').textContent = `Varsayılan rota: ${ifs.default || '?'}` + (list ? ` · IP'li arayüzler: ${list}` : '');
  }
}

$('quickForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const iface = $('qIface').value.trim().split(/\s+/).join('+');
  const mode = $('qMode').value === 'custom' ? '' : $('qMode').value;
  const r = await guard(() => api('quick_save', { mode, iface, ipv6: $('qV6').checked ? '1' : '0' }));
  if (r) {
    toast('Kaydedildi' + (r.output ? '\n' + r.output : ''));
    refreshStatus();
  }
});

// --------------------------------------------------------------- dosyalar

async function loadFiles() {
  const r = await guard(() => api('files'));
  if (!r) return;
  $('fileList').innerHTML = r.files.map((f) =>
    `<li data-f="${esc(f.name)}" class="${f.name === currentFile ? 'active' : ''}"><span>${esc(f.name)}</span><span class="muted small">${f.lines}</span></li>`
  ).join('') || '<li class="muted">Dosya yok (nfqws2 kurulu mu?)</li>';
  if (!currentFile && r.files.length) openFile(r.files[0].name);
}

$('fileList').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-f]');
  if (li) openFile(li.dataset.f);
});

const CORE_FILES = ['nfqws2.conf', 'user.list', 'exclude.list', 'auto.list', 'ipset.list', 'ipset_exclude.list'];
const FILE_HINTS = {
  'nfqws2.conf': 'Ana yapılandırma. Kaydederken sözdizimi denetlenir; önceki sürüm nfqws2.conf-old olarak saklanır.',
  'user.list': 'Her satıra bir alan adı. Alt alan adları otomatik kapsanır (ör. discord.com).',
  'exclude.list': 'İşlenmeyecek alan adları.',
  'auto.list': 'Otomatik modda engellendiği algılanan alan adları buraya eklenir.',
  'ipset.list': 'IP/alt ağ listesi (ör. 1.2.3.0/24).',
  'ipset_exclude.list': 'İşlenmeyecek IP/alt ağlar.',
};

async function openFile(name) {
  if (currentFile && $('edText').dataset.dirty === '1' && !confirm('Kaydedilmemiş değişiklikler kaybolacak. Devam?')) return;
  const txt = await guard(() => api('file_get', { f: name }, null, true));
  if (txt === undefined) return;
  currentFile = name;
  $('edName').textContent = name;
  $('edText').value = txt;
  $('edText').dataset.dirty = '';
  $('edHint').textContent = FILE_HINTS[name] || (name.endsWith('-opkg') ? 'Paketle gelen yeni varsayılan dosya. İnceleyip gerekli değişiklikleri kendi dosyanıza aktarın, sonra silebilirsiniz.' : '');
  $('btnDelete').classList.toggle('hidden', CORE_FILES.includes(name));
  document.querySelectorAll('#fileList li').forEach((li) => li.classList.toggle('active', li.dataset.f === name));
}

$('edText').addEventListener('input', () => { $('edText').dataset.dirty = '1'; });

async function saveFile(restart) {
  if (!currentFile) return;
  const r = await guard(() => api('file_save', { f: currentFile, restart: restart ? '1' : '0' }, $('edText').value));
  if (!r) return;
  $('edText').dataset.dirty = '';
  toast('Kaydedildi' + (r.output ? '\n' + r.output : ''));
  loadFiles();
  if (restart) refreshStatus();
}
$('btnSave').addEventListener('click', () => saveFile(false));
$('btnSaveRestart').addEventListener('click', () => saveFile(true));

$('btnDelete').addEventListener('click', async () => {
  if (!currentFile || !confirm(`${currentFile} silinsin mi?`)) return;
  const r = await guard(() => api('file_delete', { f: currentFile }));
  if (!r) return;
  currentFile = null;
  $('edText').value = '';
  $('edName').textContent = '—';
  loadFiles();
});

$('btnNewList').addEventListener('click', async () => {
  let n = prompt('Yeni liste adı (ör. ozel):');
  if (!n) return;
  n = n.trim().replace(/\.list$/, '');
  if (!/^[A-Za-z0-9_-]+$/.test(n)) return toast('Yalnızca harf, rakam, - ve _ kullanın', true);
  const r = await guard(() => api('file_save', { f: n + '.list' }, ''));
  if (r) {
    currentFile = null;
    await loadFiles();
    openFile(n + '.list');
    toast('Liste oluşturuldu. Kullanmak için nfqws2.conf içinde --hostlist=/opt/etc/nfqws2/lists/' + n + '.list ekleyin.');
  }
});

// -------------------------------------------------------------- günlükler

async function loadLog() {
  const f = $('logSel').value;
  const t = await guard(() => api('log_get', { f }, null, true));
  if (t === undefined) return;
  const p = $('logText');
  const atEnd = p.scrollTop + p.clientHeight >= p.scrollHeight - 20;
  p.textContent = t || '(boş)';
  if (atEnd) p.scrollTop = p.scrollHeight;
}

function setLogAuto(on) {
  clearInterval(logTimer);
  logTimer = null;
  $('logAuto').checked = on;
  if (on) logTimer = setInterval(loadLog, 3000);
}

$('logSel').addEventListener('change', loadLog);
$('btnLogRefresh').addEventListener('click', loadLog);
$('logAuto').addEventListener('change', (e) => setLogAuto(e.target.checked));
$('btnLogClear').addEventListener('click', async () => {
  const f = $('logSel').value;
  if (f === 'syslog') return toast('Sistem günlüğü buradan temizlenemez', true);
  if (!confirm(f + ' temizlensin mi?')) return;
  if (await guard(() => api('log_clear', { f }))) loadLog();
});

// ---------------------------------------------------------------- yedekler

const fmtSize = (n) => n > 1024 ? (n / 1024).toFixed(1) + ' KB' : n + ' B';

async function loadBackups() {
  const r = await guard(() => api('backups'));
  if (!r) return;
  $('bkRows').innerHTML = r.backups.map((b) =>
    `<tr><td>${esc(b.name)}</td><td>${fmtSize(b.size)}</td><td class="row end">
      <a class="btn small" href="api.cgi?a=backup_download&b=${encodeURIComponent(b.name)}">İndir</a>
      <button class="btn small" data-restore="${esc(b.name)}">Geri yükle</button>
      <button class="btn small danger" data-bdel="${esc(b.name)}">Sil</button></td></tr>`
  ).join('') || '<tr><td colspan="3" class="muted">Henüz yedek yok.</td></tr>';
}

$('bkRows').addEventListener('click', async (e) => {
  const rs = e.target.closest('[data-restore]');
  if (rs) {
    if (!confirm(rs.dataset.restore + ' geri yüklensin mi? Mevcut yapılandırma önce yedeklenir.')) return;
    if (await guard(() => api('job_start', { j: 'restore', arg: rs.dataset.restore }))) openJob('restore');
    return;
  }
  const del = e.target.closest('[data-bdel]');
  if (del && confirm(del.dataset.bdel + ' silinsin mi?')) {
    if (await guard(() => api('backup_delete', { b: del.dataset.bdel }))) loadBackups();
  }
});

$('btnBackup').addEventListener('click', async () => {
  const r = await guard(() => api('backup_create', { label: 'manuel' }));
  if (r) { toast(r.output || 'Yedek alındı'); loadBackups(); }
});

// ------------------------------------------------------------------- panel

$('setForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await guard(() => api('settings_save', {
    auto_check: $('sCheck').checked ? '1' : '0',
    auto_upgrade: $('sUpgrade').checked ? '1' : '0',
    hour: String(parseInt($('sHour').value, 10) || 0),
  }));
  if (r) toast(r.cron ? 'Kaydedildi' : 'Kaydedildi, ancak cron kurulu değil (opkg install cron)', !r.cron);
});

$('pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await guard(() => api('passwd', {}, $('pwOld').value + '\n' + $('pwNew').value));
  if (r) {
    $('pwOld').value = $('pwNew').value = '';
    toast('Parola değiştirildi');
  }
});

$('btnLogout').addEventListener('click', async () => {
  await guard(() => api('logout'));
  showAuth(false);
});

boot();
