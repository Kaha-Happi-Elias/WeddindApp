/* ====== Configuration ====== */
const WEDDING_DATE = '2026-11-07T09:30:00+01:00'; // countdown target: town hall, 09h30 Douala time
const TICKET = { bg: '/ticket-bg.jpg' }; // the invitation background image

/* ====== Helpers ====== */
const $ = (id) => document.getElementById(id);
const target = new Date(WEDDING_DATE);

function tick() {
  const t = Math.max(0, target - Date.now()) / 1000 | 0;
  const p = (n) => String(n).padStart(2, '0');
  $('d').textContent = p((t / 86400) | 0);
  $('h').textContent = p(((t % 86400) / 3600) | 0);
  $('m').textContent = p(((t % 3600) / 60) | 0);
  $('s').textContent = p(t % 60);
}
tick();
setInterval(tick, 1000);

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
}

const store = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
};

async function api(url, method = 'GET', body = null) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Erreur, veuillez réessayer.');
  return data;
}

/* ====== RSVP & Personal Links ====== */
let TOKEN = new URLSearchParams(location.search).get('g');
let guest = TOKEN ? { name: '', status: '' } : store.get('guest', { name: '', status: '' });
$('name').value = guest.name;

async function loadGuest() {
  if (!TOKEN) return;
  try {
    const g = await api('/api/guest/' + encodeURIComponent(TOKEN));
    guest = {
      name: g.name,
      status: g.status === 'accepted' || g.status === 'declined' ? g.status : '',
    };
    $('name').value = g.name;
    $('name').readOnly = true;
    $('greet').textContent = 'Cher(e) ' + g.name;
    showStatus();
  } catch (e) {
    TOKEN = null;
    toast("Ce lien d'invitation n'est pas valide.");
  }
}

function showStatus() {
  $('status').textContent =
    guest.status === 'accepted'
      ? 'Présence confirmée 🎉'
      : guest.status === 'declined'
      ? 'Nous regrettons votre absence.'
      : '';
  $('pname').textContent = guest.name || 'Invité';

  const isConfirmed = guest.status === 'accepted';
  $('passSec').hidden = !isConfirmed;
  if (isConfirmed) drawQR();
}

async function rsvp(status, btn) {
  const name = $('name').value.trim();
  if (!name) {
    toast('Indiquez votre nom complet');
    $('name').focus();
    return;
  }

  btn.disabled = true;
  try {
    await api('/api/rsvp', 'POST', { name, status, token: TOKEN });
    guest = { name: TOKEN ? guest.name : name, status };
    if (!TOKEN) store.set('guest', guest);
    showStatus();
    toast(status === 'accepted' ? 'Merci ! Votre billet est prêt 🎉' : 'Réponse enregistrée');

    if (status === 'accepted') {
      setTimeout(() => $('passSec').scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
    }
  } catch (e) {
    toast(e.message);
  }
  btn.disabled = false;
}

$('yes').onclick = (e) => rsvp('accepted', e.currentTarget);
$('no').onclick = (e) => rsvp('declined', e.currentTarget);

/* ====== QR Guest Pass ====== */
function drawQR() {
  const q = $('qr');
  q.innerHTML = '';
  if (window.QRCode) {
    new QRCode(q, {
      text: TOKEN ? 'EC-' + TOKEN : 'invitation:irene-benjamin:' + (guest.name || 'invite'),
      width: 150,
      height: 150,
      colorDark: '#5a4526',
      colorLight: '#ffffff',
    });
  }
}

/* ====== Guestbook ====== */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

async function loadMessages() {
  try {
    const list = await api('/api/messages');
    $('count').textContent = list.length + (list.length > 1 ? ' messages' : ' message');
    $('msgs').innerHTML = '';
    list.forEach((m) => {
      const e = document.createElement('div');
      e.className = 'msg';
      const qn = document.createElement('q');
      qn.textContent = m.text;
      const r = document.createElement('div');
      const a = document.createElement('span');
      const s = document.createElement('small');
      a.textContent = m.author;
      s.textContent = fmtDate(m.created_at);
      r.append(a, s);
      e.append(qn, r);
      $('msgs').append(e);
    });
  } catch (e) {
    $('count').textContent = '';
  }
}

$('send').onclick = async (e) => {
  const btn = e.currentTarget;
  const text = $('msg').value.trim();
  if (!text) {
    toast('Écrivez un message');
    return;
  }

  btn.disabled = true;
  try {
    await api('/api/messages', 'POST', {
      author: $('name').value.trim() || guest.name || 'Invité',
      text,
      token: TOKEN,
    });
    $('msg').value = '';
    toast("Message envoyé au livre d'or ✨");
    loadMessages();
  } catch (err) {
    toast(err.message);
  }
  btn.disabled = false;
};

/* ====== PDF Ticket Generation ====== */
function fitText(ctx, text, pre, family, size, maxW) {
  let sz = size;
  for (; sz > 20; sz -= 2) {
    ctx.font = pre + sz + 'px ' + family;
    if (ctx.measureText(text).width <= maxW) break;
  }
  return sz;
}

function say(ctx, text, x, y, pre, family, size, maxW, color) {
  const sz = fitText(ctx, text, pre, family, size, maxW);
  ctx.font = pre + sz + 'px ' + family;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function makeQR(text) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(d);
  new QRCode(d, {
    text,
    width: 460,
    height: 460,
    colorDark: '#3d2f18',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
  const el = d.querySelector('canvas') || d.querySelector('img');
  return { el, done: () => d.remove() };
}

function loadImg(src) {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });
}

async function drawTicket() {
  await Promise.all([
    document.fonts.load('80px "Pinyon Script"'),
    document.fonts.load('600 40px "Cormorant Garamond"'),
    document.fonts.load('italic 30px "Cormorant Garamond"'),
  ]).catch(() => {});

  const bg = await loadImg(TICKET.bg);
  const W = bg.naturalWidth;
  const H0 = bg.naturalHeight;
  const F = 340;
  const H = H0 + F;

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const SCRIPT = '"Pinyon Script", "Brush Script MT", cursive';
  const SERIF = '"Cormorant Garamond", Georgia, serif';
  const INK = '#2e2a28';
  const GOLD = '#a8741a';
  const SOFT = '#6b5d4e';
  const who = guest.name || 'cher invité';

  ctx.drawImage(bg, 0, 0);
  say(ctx, 'Vous convient ' + who, W / 2 - 2, 534, '600 ', SERIF, 38, 520, INK);

  // Footer strip
  let r = 0, g = 0, b = 0;
  [0.4, 0.5, 0.6].forEach((f) => {
    const d = ctx.getImageData(Math.round(W * f), H0 - 4, 1, 1).data;
    r += d[0];
    g += d[1];
    b += d[2];
  });
  ctx.fillStyle = 'rgb(' + Math.round(r / 3) + ',' + Math.round(g / 3) + ',' + Math.round(b / 3) + ')';
  ctx.fillRect(0, H0, W, F);

  const line = ctx.createLinearGradient(60, 0, W - 60, 0);
  line.addColorStop(0, 'rgba(184,137,44,0)');
  line.addColorStop(0.5, 'rgba(184,137,44,.9)');
  line.addColorStop(1, 'rgba(184,137,44,0)');
  ctx.fillStyle = line;
  ctx.fillRect(60, H0 + 8, W - 120, 2);

  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(W / 2, H0 - 2);
  ctx.lineTo(W / 2 + 12, H0 + 9);
  ctx.lineTo(W / 2, H0 + 20);
  ctx.lineTo(W / 2 - 12, H0 + 9);
  ctx.closePath();
  ctx.fill();

  const cx = (W - 320) / 2 + 20;
  say(ctx, 'Merci ' + who, cx, H0 + 140, '', SCRIPT, 72, 600, GOLD);
  say(ctx, "d'avoir confirmé votre présence", cx, H0 + 205, 'italic 500 ', SERIF, 42, 600, INK);
  say(ctx, "Présentez ce billet à l'entrée", cx, H0 + 265, 'italic 500 ', SERIF, 30, 600, SOFT);

  // QR Code
  const qr = makeQR(TOKEN ? 'EC-' + TOKEN : 'invitation:irene-benjamin:' + (guest.name || 'invite'));
  if (qr.el.decode) {
    try {
      await qr.el.decode();
    } catch (e) {}
  }
  const qx = W - 320;
  const qy = H0 + 42;
  const qs = 260;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(184,137,44,.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(qx, qy, qs, qs, 14);
  else ctx.rect(qx, qy, qs, qs);
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(qr.el, qx + 20, qy + 20, qs - 40, qs - 40);
  qr.done();

  say(ctx, 'BILLET PERSONNEL', qx + qs / 2, qy + qs + 34, '600 ', SERIF, 24, qs, GOLD);
  return c;
}

$('dl').onclick = async (e) => {
  const btn = e.currentTarget;
  const label = btn.textContent;
  if (guest.status !== 'accepted') return;
  if (!window.jspdf) {
    toast("Le module PDF ne s'est pas chargé. Vérifiez votre connexion.");
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Création du billet…';

  try {
    const canvas = await drawTicket();
    const PW = 120;
    const PH = (PW * canvas.height) / canvas.width;
    const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: [PW, PH] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PW, PH);

    const file =
      ('billet-' + (guest.name || 'invite'))
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase() + '.pdf';

    pdf.save(file);
    toast('Billet téléchargé ✨');
  } catch (err) {
    toast('Impossible de créer le billet, réessayez.');
  }

  btn.disabled = false;
  btn.textContent = label;
};

// Initial state bootstrap
showStatus();
loadMessages();
loadGuest();
