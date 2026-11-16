(function () {
  'use strict';
  const { $, $$, esc, money, stars, db } = BG;
  const D = BG.db, cfg = D.config;
  BG.header('home');

  // Estatísticas do herói
  const done = D.appointments.filter(a => a.status === 'concluido').length;
  const all = D.reviews; const avg = all.reduce((s, r) => s + r.rating, 0) / (all.length || 1);
  $('#heroStats').innerHTML = '<div><b class="gold">' + avg.toFixed(1).replace('.', ',') + ' ★</b><span>Avaliação média</span></div><div><b class="gold">' + done + '+</b><span>Atendimentos</span></div><div><b class="gold">' + D.barbers.length + '</b><span>Barbeiros especialistas</span></div>';

  // Serviços
  let showAll = false;
  function svcCard(s, hot) {
    return '<article class="card reveal show"><div class="imgwrap">' + (hot ? '<span class="badge hot">Mais procurado</span>' : '') + '<img class="cover" src="' + esc(s.img) + '" alt="' + esc(s.name) + '" loading="lazy" width="600" height="450"></div><div class="body"><h3>' + esc(s.name) + '</h3><p>' + esc(s.desc) + '</p><div class="price-row"><span class="price">' + money(s.price) + '</span><span class="dur">⏱ ' + s.duration + ' min</span></div><a class="btn btn-gold btn-sm" style="margin-top:.9rem;width:100%" href="agendar.html?service=' + s.id + '">Agendar</a></div></article>';
  }
  function renderServices() {
    const pop = BG.popularServices(); const top = new Set(pop.slice(0, 4).map(s => s.id));
    const list = showAll ? D.services : pop.slice(0, 4);
    $('#svcGrid').innerHTML = list.map(s => svcCard(s, top.has(s.id))).join('');
    $('#svcChips').innerHTML = '<button class="chip ' + (!showAll ? 'on' : '') + '" data-m="top">Mais procurados</button><button class="chip ' + (showAll ? 'on' : '') + '" data-m="all">Todos os serviços (' + D.services.length + ')</button>';
    $$('#svcChips .chip').forEach(b => b.onclick = () => { showAll = b.dataset.m === 'all'; renderServices(); });
  }
  renderServices();

  // Barbeiros
  function days(b) {
    return [1, 2, 3, 4, 5, 6, 0].map(d => { const s = b.schedule[d]; return '<tr><td>' + BG.DOW[d] + '</td><td>' + (s.open ? s.start + ' – ' + s.end + (s.bs ? ' <span class="muted">(intervalo ' + s.bs + '–' + s.be + ')</span>' : '') : '<span class="muted">Folga</span>') + '</td></tr>'; }).join('');
  }
  function profile(id) {
    const b = BG.getBarber(id), r = BG.barberReviews(id), avg = BG.barberRating(id);
    const m = BG.modal('<div class="grid g2" style="grid-template-columns:240px 1fr;gap:1.5rem"><img src="' + esc(b.img) + '" alt="Foto de ' + esc(b.name) + '" style="border-radius:12px;border:1px solid rgba(201,162,75,.4)" width="240" height="300"><div><span class="badge">' + esc(b.specialty) + '</span><h3 style="margin:.6rem 0 .2rem;font-size:1.9rem">' + esc(b.name) + '</h3><div class="rate"><span class="stars">' + stars(avg) + '</span> <b>' + avg.toFixed(1).replace('.', ',') + '</b> <span class="muted">(' + r.length + ' avaliações) · ' + b.exp + ' anos de experiência</span></div><p class="muted" style="margin:.8rem 0">' + esc(b.bio) + '</p><a class="btn btn-gold" href="agendar.html?barber=' + b.id + '">Agendar com este barbeiro</a></div></div>' +
      '<h4 style="margin:1.4rem 0 .6rem">Serviços oferecidos</h4><div class="chip-row">' + b.services.map(s => { const x = BG.getService(s); return '<span class="chip">' + esc(x.name) + ' · ' + money(x.price) + '</span>'; }).join('') + '</div>' +
      '<h4 style="margin:1.4rem 0 .6rem">Galeria de cortes</h4><div class="grid g3" style="gap:.6rem">' + b.gallery.map(g => '<img src="' + esc(g) + '" alt="Trabalho de ' + esc(b.name) + '" style="border-radius:10px;aspect-ratio:4/3;object-fit:cover;width:100%" loading="lazy">').join('') + '</div>' +
      '<div class="grid g2" style="margin-top:1.4rem;gap:1.4rem"><div><h4 style="margin-bottom:.6rem">Dias e horários</h4><div class="tbl-wrap"><table><tbody>' + days(b) + '</tbody></table></div></div><div><h4 style="margin-bottom:.6rem">Avaliações</h4>' + (r.length ? r.slice(0, 4).map(x => '<div style="margin-bottom:.8rem;font-size:.88rem"><span class="stars">' + stars(x.rating) + '</span> <b>' + esc(x.clientName) + '</b><br><span class="muted">' + esc(x.text) + '</span></div>').join('') : '<p class="muted">Ainda sem avaliações.</p>') + '</div></div>', 'wide');
    return m;
  }
  $('#barberGrid').innerHTML = D.barbers.map(b => { const avg = BG.barberRating(b.id), n = BG.barberReviews(b.id).length; return '<article class="card barber-card reveal"><div class="imgwrap"><img class="cover" src="' + esc(b.img) + '" alt="' + esc(b.name) + '" loading="lazy" width="600" height="750"></div><div class="body"><h3>' + esc(b.name) + '</h3><div class="rate"><span class="stars">' + stars(avg) + '</span><b>' + avg.toFixed(1).replace('.', ',') + '</b><span class="muted">(' + n + ')</span></div><p>' + esc(b.specialty) + '</p><div class="card-actions"><button class="btn btn-sm" data-p="' + b.id + '">Ver perfil</button><a class="btn btn-gold btn-sm" href="agendar.html?barber=' + b.id + '">Agendar</a></div></div></article>'; }).join('');
  $$('[data-p]').forEach(b => b.onclick = () => profile(b.dataset.p));

  // Galeria
  const gal = ['Degradê com barba desenhada', 'Corte clássico com barba cheia', 'Cachos definidos', 'Pompadour', 'Corte curto e barba', 'Degradê com cavanhaque', 'Clássico com barba por fazer', 'Degradê grisalho'];
  $('#gallery').innerHTML = gal.map((t, i) => '<button data-i="' + (i + 1) + '" aria-label="Ampliar: ' + t + '"><img src="img/galeria-' + (i + 1) + '.svg" alt="' + t + '" loading="lazy" width="600" height="600"></button>').join('');
  $$('#gallery button').forEach(b => b.onclick = () => BG.modal('<img src="img/galeria-' + b.dataset.i + '.svg" alt="' + esc(gal[b.dataset.i - 1]) + '"><p style="text-align:center;margin-top:.6rem" class="muted">' + esc(gal[b.dataset.i - 1]) + '</p>', 'lightbox narrow'));

  // Depoimentos
  const best = D.reviews.filter(r => r.rating === 5).slice(0, 3);
  $('#testi').innerHTML = best.map((r, i) => '<div class="card testi reveal"><div class="stars">' + stars(r.rating) + '</div><q>' + esc(r.text) + '</q><div class="who"><img src="img/cliente-' + (i + 1) + '.svg" alt="" width="46" height="46"><div><b>' + esc(r.clientName) + '</b><br><small>Atendido por ' + esc(BG.getBarber(r.barberId).name) + '</small></div></div></div>').join('');

  // Local
  const h = cfg.hours;
  $('#locInfo').innerHTML = '<div class="info-item"><span class="ic">📍</span><div><b>Endereço</b><span>' + esc(cfg.address) + '</span></div></div>' +
    '<div class="info-item"><span class="ic">🕒</span><div><b>Horários</b><span>' + [1, 2, 3, 4, 5, 6, 0].map(d => BG.DOW3[d] + ': ' + (h[d].open ? h[d].start + '–' + h[d].end : 'fechado')).join('<br>') + '</span></div></div>' +
    '<div class="info-item"><span class="ic">💬</span><div><b>WhatsApp e telefone</b><span><a href="https://wa.me/' + esc(cfg.whatsapp) + '" target="_blank" rel="noopener">Chamar no WhatsApp</a> · ' + esc(cfg.phone) + '</span></div></div>' +
    '<div class="info-item"><span class="ic">📷</span><div><b>Redes sociais</b><span><a href="' + esc(cfg.instagram) + '">Instagram</a> · <a href="' + esc(cfg.facebook) + '">Facebook</a></span></div></div>';
  $('#map').innerHTML = '<div class="fallback">Mapa — ' + esc(cfg.address) + '<br>(carrega quando houver internet)</div><iframe title="Mapa da barbearia" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(cfg.address) + '&output=embed"></iframe>';

  BG.footer(); BG.reveal();
})();
