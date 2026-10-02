const $ = (id) => document.getElementById(id);
let tab = 'all',
  rsvps = [],
  messages = [],
  guests = [];

const fmt = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function load() {
  try {
    const [s, r, m, g] = await Promise.all([
      get('/api/admin/summary'),
      get('/api/admin/rsvps'),
      get('/api/admin/messages'),
      get('/api/admin/guests'),
    ]);
    $('sAcc').textContent = s.accepted;
    $('sDec').textContent = s.declined;
    $('sPen').textContent = s.pending;
    $('sMsg').textContent = s.messages;
    rsvps = r;
    messages = m;
    guests = g;
    render();
  } catch (e) {
    $('list').innerHTML = '<div class="empty">Impossible de charger les données.</div>';
  }
}

function render() {
  const term = $('search').value.trim().toLowerCase();
  const list = $('list');
  list.innerHTML = '';
  let items;

  if (tab === 'messages') {
    items = messages.filter((m) => (m.author + ' ' + m.text).toLowerCase().includes(term));
    items.forEach((m) => {
      const row = document.createElement('div');
      row.className = 'row';
      const main = document.createElement('div');
      main.className = 'main';
      const n = document.createElement('div');
      n.className = 'name';
      n.textContent = m.author;
      const t = document.createElement('div');
      t.className = 'txt';
      t.textContent = '“' + m.text + '”';
      const d = document.createElement('div');
      d.className = 'meta';
      d.textContent = fmt(m.created_at);
      main.append(n, t, d);
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Supprimer';
      del.setAttribute('aria-label', 'Supprimer le message');
      del.textContent = '×';
      del.onclick = async () => {
        if (confirm('Supprimer ce message ?')) {
          await fetch('/api/admin/messages/' + m.id, { method: 'DELETE' });
          load();
        }
      };
      row.append(main, del);
      list.append(row);
    });
  } else if (tab === 'guests') {
    items = guests.filter((g) => g.name.toLowerCase().includes(term));
    items.forEach((g) => {
      const link = location.origin + '/?g=' + g.token;
      const row = document.createElement('div');
      row.className = 'row';
      const main = document.createElement('div');
      main.className = 'main';
      const n = document.createElement('div');
      n.className = 'name';
      n.textContent = g.name;
      const acts = document.createElement('div');
      acts.className = 'acts';
      const copy = document.createElement('button');
      copy.className = 'mini';
      copy.textContent = 'Copier le lien';
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          copy.textContent = 'Copié ✓';
          setTimeout(() => (copy.textContent = 'Copier le lien'), 1800);
        } catch (e) {
          prompt('Copiez ce lien :', link);
        }
      };
      const wa = document.createElement('a');
      wa.className = 'mini';
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'WhatsApp';
      wa.href =
        'https://wa.me/?text=' +
        encodeURIComponent('Bonjour ' + g.name + ', voici votre invitation personnelle à notre mariage : ' + link);
      acts.append(copy, wa);
      main.append(n, acts);
      const p = document.createElement('span');
      p.className = 'pill ' + (g.status || 'pending');
      p.textContent = g.status === 'accepted' ? 'Présent' : g.status === 'declined' ? 'Absent' : 'En attente';
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Supprimer';
      del.setAttribute('aria-label', "Supprimer l'invité");
      del.textContent = '×';
      del.onclick = async () => {
        if (confirm('Supprimer ' + g.name + ' et son lien ?')) {
          await fetch('/api/admin/guests/' + g.id, { method: 'DELETE' });
          load();
        }
      };
      row.append(main, p, del);
      list.append(row);
    });
  } else {
    items = rsvps.filter((r) => (tab === 'all' || r.status === tab) && r.name.toLowerCase().includes(term));
    items.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'row';
      const main = document.createElement('div');
      main.className = 'main';
      const n = document.createElement('div');
      n.className = 'name';
      n.textContent = r.name;
      const d = document.createElement('div');
      d.className = 'meta';
      d.textContent = fmt(r.updated_at);
      main.append(n, d);
      const p = document.createElement('span');
      p.className = 'pill ' + r.status;
      p.textContent = r.status === 'accepted' ? 'Présent' : 'Absent';
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Supprimer';
      del.setAttribute('aria-label', 'Supprimer la réponse');
      del.textContent = '×';
      del.onclick = async () => {
        if (confirm('Supprimer la réponse de ' + r.name + ' ?')) {
          await fetch('/api/admin/rsvps/' + r.id, { method: 'DELETE' });
          load();
        }
      };
      row.append(main, p, del);
      list.append(row);
    });
  }
  if (!items.length) list.innerHTML = '<div class="empty">Rien à afficher pour le moment.</div>';
}

document.querySelectorAll('.tab').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    tab = b.dataset.t;
    $('addBox').hidden = tab !== 'guests';
    render();
  };
});

$('search').oninput = render;

$('addBtn').onclick = async () => {
  const names = $('names').value;
  if (!names.trim()) return;
  const r = await fetch('/api/admin/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  if (r.ok) {
    $('names').value = '';
    load();
  } else {
    alert('Impossible de créer les liens.');
  }
};

load();
setInterval(load, 30000); // refresh every 30 s
