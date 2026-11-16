(function () {
  'use strict';
  const { $, $$, esc, money } = BG;
  const U = BG.requireRole(['admin', 'barber']); if (!U) return;
  BG.header('painel');
  const isAdmin = U.role === 'admin';
  const MY = isAdmin ? null : U.barberId;
  const main = $('#main'), side = $('#side');
  const db = () => BG.db;
  const dayOf = t => BG.ymd(new Date(t.date));
  const TODAY = () => BG.ymd(new Date());
  const STAT = { pendente: ['warn', 'Aguardando'], confirmado: ['info', 'Confirmado'], concluido: ['ok', 'Concluído'], cancelado: ['bad', 'Cancelado'] };
  const PAY = { pendente: ['warn', 'No local'], parcial: ['info', 'Sinal pago'], pago: ['ok', 'Pago'], estornado: ['mute', 'Estornado'] };
  const F = (id, label, type, extra) => '<div class="field"><label for="' + id + '">' + label + '</label><input class="input" id="' + id + '" type="' + (type || 'text') + '" ' + (extra || '') + '></div>';
  const sum = a => a.reduce((s, x) => s + x, 0);
  const net = (from, to, filter) => sum(db().transactions.filter(t => { const d = dayOf(t); return d >= from && d <= to && (!filter || filter(t)); }).map(t => t.amount));
  const apptOf = id => db().appointments.find(a => a.id === id);
  const live = a => a.status !== 'cancelado' && a.status !== 'pendente';
  const bars = (items, fmt) => { const mx = Math.max(1, ...items.map(i => i.v)); return '<div class="bars">' + items.map(i => '<div title="' + esc(i.l + ': ' + (fmt ? fmt(i.v) : i.v)) + '"><i style="height:' + Math.max(2, i.v / mx * 100) + '%"></i><small>' + esc(i.s || i.l) + '</small></div>').join('') + '</div>'; };
  const hbars = (items, fmt) => { const mx = Math.max(1, ...items.map(i => i.v)); return items.map(i => '<div class="hbar"><span>' + esc(i.l) + '</span><span class="track"><i style="width:' + i.v / mx * 100 + '%"></i></span><b>' + (fmt ? fmt(i.v) : i.v) + '</b></div>').join('') || '<p class="muted">Sem dados.</p>'; };
  const badge = (m, k) => '<span class="badge ' + m[k][0] + '">' + m[k][1] + '</span>';
  const imgField = (cur) => '<div class="field"><label>Imagem</label><div style="display:flex;gap:.8rem;align-items:center"><img id="imgPrev" src="' + esc(cur || '') + '" alt="" style="width:80px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--graph3)"><input type="file" id="imgFile" accept="image/*" class="input" style="padding:.5rem"></div><small class="muted">Envie uma foto (JPG/PNG) — será redimensionada automaticamente.</small></div>';
  function bindImg(m, getCur) { let val = getCur; $('#imgFile', m).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const w = Math.min(700, im.width), h = im.height * w / im.width, c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); val = c.toDataURL('image/jpeg', .82); $('#imgPrev', m).src = val; m._img = val; }; im.src = r.result; }; r.readAsDataURL(f); }; m._img = val; }

  const ADMIN_TABS = [['dash', '📊', 'Dashboard'], ['agenda', '📅', 'Agenda'], ['servicos', '✂', 'Serviços'], ['barbeiros', '💈', 'Barbeiros'], ['clientes', '👥', 'Clientes'], ['pagamentos', '💳', 'Pagamentos'], ['relatorios', '📈', 'Relatórios'], ['config', '⚙', 'Configurações'], ['notif', '🔔', 'Notificações']];
  const BARBER_TABS = [['dia', '📅', 'Agenda do dia'], ['semana', '🗓', 'Agenda semanal'], ['bloq', '⛔', 'Indisponibilidade'], ['hist', '🕘', 'Histórico'], ['horarios', '⏰', 'Meus horários']];
  const TABS = isAdmin ? ADMIN_TABS : BARBER_TABS;
  let tab = (location.hash || '').slice(1); if (!TABS.some(t => t[0] === tab)) tab = TABS[0][0];
  let S = { date: TODAY(), mode: 'dia', barber: '', status: '', q: '', wk: null };

  function shell() {
    side.innerHTML = '<div class="who"><b>' + esc(U.name) + '</b><br><span class="badge">' + (isAdmin ? 'Proprietário' : 'Barbeiro') + '</span></div>' + TABS.map(t => '<button data-t="' + t[0] + '" class="' + (tab === t[0] ? 'active' : '') + '"><span>' + t[1] + '</span>' + t[2] + '</button>').join('') + '<button data-out><span>↩</span>Sair</button>';
    $$('[data-t]', side).forEach(b => b.onclick = () => { tab = b.dataset.t; history.replaceState(null, '', '#' + tab); render(); });
    $('[data-out]', side).onclick = () => { BG.logout(); location.href = 'index.html'; };
  }
  function render() { BG.reload(); shell(); main.innerHTML = ''; V[tab](); scrollTo(0, 0); }

  /* ================= ADMIN: Dashboard ================= */
  const V = {};
  V.dash = () => {
    const d = db(), t = TODAY(), now = new Date(), from7 = BG.ymd(BG.addDays(now, -6)), m0 = t.slice(0, 8) + '01';
    const ap = d.appointments.filter(live), todayAp = ap.filter(a => a.date === t).sort((a, b) => a.time.localeCompare(b.time));
    const days = []; for (let i = 13; i >= 0; i--) { const x = BG.addDays(now, -i), k = BG.ymd(x); days.push({ l: BG.fmtDate(k), s: pad2(x.getDate()), v: Math.max(0, net(k, k)) }); }
    const svcs = d.services.map(s => ({ l: s.name, v: ap.filter(a => a.serviceId === s.id).length })).sort((a, b) => b.v - a.v).slice(0, 6);
    const brs = d.barbers.map(b => ({ l: b.name, v: net(m0, t, x => { const a = apptOf(x.apptId); return a && a.barberId === b.id; }) })).sort((a, b) => b.v - a.v);
    main.innerHTML = '<h2>Dashboard</h2><p class="muted">Resumo da operação — ' + esc(BG.fmtLong(t)) + '</p><div class="kpis"><div class="kpi"><span>Faturamento hoje</span><b>' + money(net(t, t)) + '</b></div><div class="kpi"><span>Últimos 7 dias</span><b>' + money(net(from7, t)) + '</b></div><div class="kpi"><span>Mês atual</span><b>' + money(net(m0, t)) + '</b></div><div class="kpi"><span>Agendamentos hoje</span><b>' + todayAp.length + '</b><small>' + todayAp.filter(a => a.status === 'concluido').length + ' concluídos</small></div><div class="kpi"><span>Total de agendamentos</span><b>' + ap.length + '</b></div><div class="kpi"><span>Clientes cadastrados</span><b>' + d.users.filter(u => u.role === 'client').length + '</b></div></div>' +
      '<div class="cols2"><div class="panel"><h3>Faturamento — últimos 14 dias</h3>' + bars(days, money) + '</div><div class="panel"><h3>Serviços mais procurados</h3>' + hbars(svcs) + '</div></div>' +
      '<div class="cols2" style="margin-top:1.2rem"><div class="panel"><h3>Agenda de hoje</h3>' + (todayAp.length ? '<div class="tbl-wrap"><table><tbody>' + todayAp.map(a => '<tr><td><b>' + a.time + '</b></td><td>' + esc(a.clientName) + '</td><td>' + esc(a.serviceName) + '</td><td>' + esc((BG.getBarber(a.barberId) || {}).name) + '</td><td>' + badge(STAT, a.status) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Nenhum agendamento hoje.</p>') + '</div><div class="panel"><h3>Receita por barbeiro (mês)</h3>' + hbars(brs, money) + '</div></div>';
  };
  const pad2 = n => String(n).padStart(2, '0');

  /* ================= Agenda (admin: todos; barbeiro: dia) ================= */
  function apptActions(a, role) {
    let h = '';
    if (a.status === 'confirmado') {
      if (!a.barberConfirmed) h += '<button class="btn btn-sm" data-act="bconf" data-id="' + a.id + '">Confirmar</button>';
      h += '<button class="btn btn-sm btn-ok" data-act="done" data-id="' + a.id + '">Concluir</button>';
      if (role === 'admin') h += '<button class="btn btn-sm" data-act="resch" data-id="' + a.id + '">Reagendar</button><button class="btn btn-sm btn-danger" data-act="cancel" data-id="' + a.id + '">Cancelar</button>';
    }
    return '<div class="acts">' + h + '</div>';
  }
  function bindActs(root, after) {
    $$('[data-act]', root).forEach(b => b.onclick = async () => {
      const a = apptOf(b.dataset.id), act = b.dataset.act;
      if (act === 'bconf') { a.barberConfirmed = true; BG.save(); BG.toast('Atendimento confirmado', a.clientName, 'ok'); }
      if (act === 'done') { BG.completeAppointment(a.id); BG.toast('Atendimento concluído', a.clientName, 'ok'); }
      if (act === 'cancel') { if (!(await BG.confirmBox('Cancelar o agendamento de <b>' + esc(a.clientName) + '</b> (' + BG.fmtDate(a.date) + ' ' + a.time + ')?' + (a.payment.paid > 0 ? ' O valor pago será estornado.' : ''), 'Cancelar agendamento'))) return; BG.cancelAppointment(a.id, 'admin'); BG.toast('Agendamento cancelado', '', 'ok'); }
      if (act === 'resch') return reschModal(a, after);
      if (act === 'apv') return reschModal(a, after, a.changeRequest);
      after();
    });
  }
  function reschModal(a, after, req) {
    const m = BG.modal('<h3>Reagendar</h3><p class="muted" style="margin-bottom:1rem">' + esc(a.clientName) + ' — ' + esc(a.serviceName) + (req ? '<br>Cliente pediu: <b>' + BG.fmtDate(req.date) + ' às ' + req.time + '</b>' + (req.note ? ' — ' + esc(req.note) : '') : '') + '</p><div class="field"><label>Barbeiro</label><select class="select input" id="rb">' + db().barbers.filter(b => b.services.includes(a.serviceId)).map(b => '<option value="' + b.id + '" ' + (b.id === a.barberId ? 'selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select></div>' + F('rd', 'Nova data', 'date', 'value="' + (req ? req.date : a.date) + '"') + '<div class="field"><label>Horário disponível</label><select class="select input" id="rt"></select></div><div id="re"></div><button class="btn btn-gold" id="rs">Confirmar novo horário</button>', 'narrow');
    const fill = () => { const sl = BG.barberSlots($('#rb', m.el).value, $('#rd', m.el).value, a.duration, { ignoreLimits: true, ignoreId: a.id }); $('#rt', m.el).innerHTML = sl.length ? sl.map(t => '<option ' + (req && t === req.time ? 'selected' : '') + '>' + t + '</option>').join('') : '<option value="">Sem horários</option>'; };
    $('#rb', m.el).onchange = fill; $('#rd', m.el).onchange = fill; fill();
    $('#rs', m.el).onclick = () => { try { BG.rescheduleAppointment(a.id, $('#rd', m.el).value, $('#rt', m.el).value, $('#rb', m.el).value); m.close(); BG.toast('Agendamento reagendado', 'Cliente notificado (simulado).', 'ok'); after(); } catch (e) { $('#re', m.el).innerHTML = '<div class="form-msg err">' + esc(e.message) + '</div>'; } };
  }
  V.agenda = () => {
    const d = db(), t = TODAY();
    let list = d.appointments.filter(a => a.status !== 'pendente');
    if (S.mode === 'dia') list = list.filter(a => a.date === S.date); else if (S.mode === 'prox') list = list.filter(a => a.date >= t && a.date <= BG.ymd(BG.addDays(new Date(), 7)));
    if (S.barber) list = list.filter(a => a.barberId === S.barber); if (S.status) list = list.filter(a => a.status === S.status);
    if (S.q) list = list.filter(a => (a.clientName + a.serviceName).toLowerCase().includes(S.q.toLowerCase()));
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const reqs = d.appointments.filter(a => a.changeRequest && a.status === 'confirmado');
    main.innerHTML = '<h2>Agenda</h2>' + (reqs.length ? '<div class="form-msg err" style="background:rgba(224,162,31,.12);border-color:var(--warn);color:var(--warn)">⚠ ' + reqs.length + ' solicitação(ões) de alteração de horário aguardando análise.</div>' : '') +
      '<div class="toolbar"><select class="select input" id="fm"><option value="dia" ' + (S.mode === 'dia' ? 'selected' : '') + '>Dia específico</option><option value="prox" ' + (S.mode === 'prox' ? 'selected' : '') + '>Próximos 7 dias</option><option value="todos" ' + (S.mode === 'todos' ? 'selected' : '') + '>Todos</option></select><input class="input" type="date" id="fd" value="' + S.date + '" ' + (S.mode !== 'dia' ? 'disabled' : '') + '><select class="select input" id="fb"><option value="">Todos os barbeiros</option>' + d.barbers.map(b => '<option value="' + b.id + '" ' + (S.barber === b.id ? 'selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select><select class="select input" id="fs"><option value="">Todos os status</option>' + ['confirmado', 'concluido', 'cancelado'].map(s => '<option value="' + s + '" ' + (S.status === s ? 'selected' : '') + '>' + STAT[s][1] + '</option>').join('') + '</select><input class="input grow" id="fq" placeholder="Buscar cliente ou serviço" value="' + esc(S.q) + '"></div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Data / hora</th><th>Cliente</th><th>Serviço</th><th>Barbeiro</th><th>Valor</th><th>Status</th><th>Pagamento</th><th>Ações</th></tr></thead><tbody>' + (list.length ? list.map(a => '<tr><td><b>' + BG.fmtDate(a.date) + '</b><br>' + a.time + ' <span class="muted">(' + a.duration + 'min)</span></td><td>' + esc(a.clientName) + '<br><span class="muted">' + esc(a.clientPhone || '') + '</span></td><td>' + esc(a.serviceName) + '</td><td>' + esc((BG.getBarber(a.barberId) || {}).name) + '</td><td>' + money(a.price) + '</td><td>' + badge(STAT, a.status) + (a.barberConfirmed && a.status === 'confirmado' ? '<br><span class="badge ok" style="margin-top:.3rem">Barbeiro confirmou</span>' : '') + (a.changeRequest && a.status === 'confirmado' ? '<br><span class="badge warn" style="margin-top:.3rem">Pede: ' + BG.fmtDate(a.changeRequest.date) + ' ' + a.changeRequest.time + '</span>' : '') + '</td><td>' + badge(PAY, a.payment.status) + '<br><span class="muted">' + esc((a.payment.method || '').toUpperCase()) + '</span></td><td>' + (a.changeRequest && a.status === 'confirmado' ? '<div class="acts" style="margin-bottom:.4rem"><button class="btn btn-sm btn-gold" data-act="apv" data-id="' + a.id + '">Analisar pedido</button></div>' : '') + apptActions(a, 'admin') + '</td></tr>').join('') : '<tr><td colspan="8" class="empty-state">Nenhum agendamento encontrado.</td></tr>') + '</tbody></table></div>';
    const re = () => V.agenda();
    $('#fm').onchange = e => { S.mode = e.target.value; re(); }; $('#fd').onchange = e => { S.date = e.target.value || TODAY(); re(); }; $('#fb').onchange = e => { S.barber = e.target.value; re(); }; $('#fs').onchange = e => { S.status = e.target.value; re(); };
    $('#fq').onchange = e => { S.q = e.target.value; re(); };
    bindActs(main, () => { BG.reload(); V.agenda(); });
  };

  /* ================= Barbeiro: agenda do dia ================= */
  V.dia = () => {
    const d = db(), b = BG.getBarber(MY);
    const list = d.appointments.filter(a => a.barberId === MY && a.date === S.date && a.status !== 'pendente' && a.status !== 'cancelado').sort((a, b) => a.time.localeCompare(b.time));
    const blocks = d.blocks.filter(k => k.barberId === MY && k.date === S.date);
    main.innerHTML = '<h2>Agenda do dia</h2><p class="muted">' + esc(BG.fmtLong(S.date)) + '</p><div class="toolbar"><button class="btn btn-sm" id="pv">← Dia anterior</button><button class="btn btn-sm" id="tdy">Hoje</button><button class="btn btn-sm" id="nx">Próximo dia →</button><input class="input" type="date" id="dd" value="' + S.date + '"></div><div class="kpis"><div class="kpi"><span>Atendimentos</span><b>' + list.length + '</b></div><div class="kpi"><span>Concluídos</span><b>' + list.filter(a => a.status === 'concluido').length + '</b></div><div class="kpi"><span>Pendentes</span><b>' + list.filter(a => a.status === 'confirmado').length + '</b></div></div>' +
      (blocks.length ? '<div class="form-msg err" style="background:rgba(224,82,77,.1)">⛔ Indisponível: ' + blocks.map(k => k.start + '–' + k.end + (k.reason ? ' (' + esc(k.reason) + ')' : '')).join(' · ') + '</div>' : '') +
      '<div class="tbl-wrap"><table><thead><tr><th>Horário</th><th>Cliente</th><th>Contato</th><th>Serviço</th><th>Status</th><th>Ações</th></tr></thead><tbody>' + (list.length ? list.map(a => '<tr><td><b>' + a.time + '</b> – ' + BG.toTime(BG.toMin(a.time) + a.duration) + '</td><td>' + esc(a.clientName) + '</td><td>' + esc(a.clientPhone || '') + '</td><td>' + esc(a.serviceName) + '</td><td>' + badge(STAT, a.status) + (a.barberConfirmed && a.status === 'confirmado' ? ' <span class="badge ok">Confirmado</span>' : '') + '</td><td>' + apptActions(a, 'barber') + '</td></tr>').join('') : '<tr><td colspan="6" class="empty-state">Sem atendimentos neste dia.</td></tr>') + '</tbody></table></div>';
    const go = n => { S.date = BG.ymd(BG.addDays(BG.parseYmd(S.date), n)); V.dia(); };
    $('#pv').onclick = () => go(-1); $('#nx').onclick = () => go(1); $('#tdy').onclick = () => { S.date = TODAY(); V.dia(); }; $('#dd').onchange = e => { S.date = e.target.value || TODAY(); V.dia(); };
    bindActs(main, () => { BG.reload(); V.dia(); });
  };
  V.semana = () => {
    const d = db(); if (!S.wk) { const n = new Date(); const dow = (n.getDay() + 6) % 7; S.wk = BG.ymd(BG.addDays(n, -dow)); }
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => BG.ymd(BG.addDays(BG.parseYmd(S.wk), i)));
    main.innerHTML = '<h2>Agenda semanal</h2><div class="toolbar"><button class="btn btn-sm" id="pv">← Semana anterior</button><button class="btn btn-sm" id="tdy">Esta semana</button><button class="btn btn-sm" id="nx">Próxima semana →</button></div><div class="week">' + days.map(ds => {
      const ap = d.appointments.filter(a => a.barberId === MY && a.date === ds && live(a)).sort((a, b) => a.time.localeCompare(b.time)), bl = d.blocks.filter(k => k.barberId === MY && k.date === ds), dow = BG.parseYmd(ds).getDay(), off = !b_(MY).schedule[dow].open;
      return '<div class="day"><h5>' + BG.DOW3[dow] + ' ' + BG.fmtDate(ds).slice(0, 5) + (ds === TODAY() ? ' · hoje' : '') + '</h5>' + (off && !ap.length ? '<span class="muted" style="font-size:.78rem">Folga</span>' : '') + bl.map(k => '<div class="ap blk">⛔ ' + k.start + '–' + k.end + '</div>').join('') + ap.map(a => '<div class="ap ' + (a.status === 'concluido' ? 'done' : '') + '"><b>' + a.time + '</b> ' + esc(a.clientName.split(' ')[0]) + '<br><span class="muted">' + esc(a.serviceName) + '</span></div>').join('') + '</div>'; }).join('') + '</div>';
    const go = n => { S.wk = BG.ymd(BG.addDays(BG.parseYmd(S.wk), n)); V.semana(); };
    $('#pv').onclick = () => go(-7); $('#nx').onclick = () => go(7); $('#tdy').onclick = () => { S.wk = null; V.semana(); };
  };
  const b_ = id => BG.getBarber(id);
  V.bloq = () => {
    const d = db(), t = TODAY(), list = d.blocks.filter(k => k.barberId === MY && k.date >= t).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    main.innerHTML = '<h2>Indisponibilidade e bloqueios</h2><p class="muted">Bloqueie horários ou dias inteiros — eles somem automaticamente do agendamento online.</p><div class="panel" style="max-width:640px;margin:1.2rem 0"><div id="be"></div><div class="row">' + F('bd', 'Data', 'date', 'min="' + t + '" value="' + t + '"') + '<div class="field"><label>Tipo</label><select class="select input" id="bt"><option value="part">Intervalo de horas</option><option value="all">Dia inteiro (folga)</option></select></div></div><div class="row" id="hrs">' + F('bs', 'Início', 'time', 'value="12:00"') + F('be2', 'Fim', 'time', 'value="13:00"') + '</div>' + F('br', 'Motivo (opcional)', 'text', 'placeholder="Ex.: consulta médica"') + '<button class="btn btn-gold" id="bsv">Bloquear</button></div><h3 style="margin-bottom:.8rem">Bloqueios futuros</h3><div class="tbl-wrap"><table><tbody>' + (list.length ? list.map(k => '<tr><td>' + BG.fmtDate(k.date) + '</td><td>' + (k.allDay ? 'Dia inteiro' : k.start + ' – ' + k.end) + '</td><td>' + esc(k.reason || '') + '</td><td><button class="btn btn-sm btn-danger" data-k="' + k.id + '">Remover</button></td></tr>').join('') : '<tr><td class="empty-state">Nenhum bloqueio futuro.</td></tr>') + '</tbody></table></div>';
    $('#bt').onchange = e => $('#hrs').classList.toggle('hidden', e.target.value === 'all');
    $('#bsv').onclick = () => {
      const date = $('#bd').value, all = $('#bt').value === 'all', s = all ? '00:00' : $('#bs').value, e = all ? '23:59' : $('#be2').value, er = x => { $('#be').innerHTML = '<div class="form-msg err">' + x + '</div>'; };
      if (!date) return er('Informe a data.'); if (!all && (!s || !e || BG.toMin(e) <= BG.toMin(s))) return er('Horário final deve ser depois do inicial.');
      const clash = d.appointments.filter(a => a.barberId === MY && a.date === date && a.status === 'confirmado' && BG.toMin(a.time) < BG.toMin(e) && BG.toMin(a.time) + a.duration > BG.toMin(s));
      if (clash.length) return er('Há ' + clash.length + ' agendamento(s) nesse período (' + clash.map(a => a.time + ' ' + esc(a.clientName.split(' ')[0])).join(', ') + '). Peça ao proprietário para reagendar antes de bloquear.');
      d.blocks.push({ id: BG.uid('k'), barberId: MY, date, start: s, end: e, allDay: all, reason: $('#br').value.trim() }); BG.save(); BG.toast('Horário bloqueado', '', 'ok'); V.bloq();
    };
    $$('[data-k]').forEach(b => b.onclick = () => { d.blocks = d.blocks.filter(k => k.id !== b.dataset.k); BG.save(); V.bloq(); });
  };
  V.hist = () => {
    const d = db(), list = d.appointments.filter(a => a.barberId === MY && a.status === 'concluido').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const q = S.q.toLowerCase(), f = list.filter(a => !q || (a.clientName + a.serviceName).toLowerCase().includes(q));
    main.innerHTML = '<h2>Histórico de atendimentos</h2><div class="kpis"><div class="kpi"><span>Atendimentos concluídos</span><b>' + list.length + '</b></div><div class="kpi"><span>Nota média</span><b>' + BG.barberRating(MY).toFixed(1).replace('.', ',') + ' ★</b></div></div><div class="toolbar"><input class="input grow" id="fq" placeholder="Buscar cliente ou serviço" value="' + esc(S.q) + '"></div><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th></tr></thead><tbody>' + (f.length ? f.slice(0, 200).map(a => '<tr><td>' + BG.fmtDate(a.date) + ' ' + a.time + '</td><td>' + esc(a.clientName) + '</td><td>' + esc(a.serviceName) + '</td></tr>').join('') : '<tr><td colspan="3" class="empty-state">Nada encontrado.</td></tr>') + '</tbody></table></div>';
    $('#fq').onchange = e => { S.q = e.target.value; V.hist(); };
  };

  /* ================= Horários (editor reutilizável) ================= */
  function schedHTML(b) {
    return '<div class="muted" style="font-size:.8rem;margin-bottom:.6rem">Marque os dias de trabalho e informe expediente e intervalo. (Limitado ao horário de funcionamento da barbearia.)</div>' + [1, 2, 3, 4, 5, 6, 0].map(dw => { const s = b.schedule[dw]; return '<div class="sched-row" data-dw="' + dw + '"><label class="check" style="margin:0"><input type="checkbox" class="so" ' + (s.open ? 'checked' : '') + '> <b>' + BG.DOW3[dw] + '</b></label><span class="muted" style="font-size:.7rem">Das / até</span><input class="input ss" type="time" value="' + s.start + '"><input class="input se" type="time" value="' + s.end + '"><input class="input sbs" type="time" value="' + (s.bs || '') + '" title="Início do intervalo"><input class="input sbe" type="time" value="' + (s.be || '') + '" title="Fim do intervalo"></div>'; }).join('') + '<div class="muted" style="font-size:.72rem">Colunas: dia · expediente (início/fim) · intervalo (início/fim)</div>';
  }
  function readSched(root) { const o = {}; $$('.sched-row', root).forEach(r => { o[r.dataset.dw] = { open: $('.so', r).checked, start: $('.ss', r).value || '09:00', end: $('.se', r).value || '18:00', bs: $('.sbs', r).value || '', be: $('.sbe', r).value || '' }; }); return o; }
  V.horarios = () => {
    const b = BG.getBarber(MY), t = TODAY();
    main.innerHTML = '<h2>Meus horários de atendimento</h2><div class="panel" style="max-width:820px;margin-top:1rem" id="sp">' + schedHTML(b) + '<button class="btn btn-gold" id="ssv" style="margin-top:1rem">Salvar horários</button></div>';
    $('#ssv').onclick = () => { b.schedule = readSched($('#sp')); BG.save(); BG.toast('Horários atualizados', 'Já valem para novos agendamentos.', 'ok'); };
  };

  /* ================= ADMIN: Serviços ================= */
  V.servicos = () => {
    const d = db();
    main.innerHTML = '<h2>Serviços</h2><div class="toolbar"><span class="muted grow">Cadastre, edite ou exclua serviços, preços e durações.</span><button class="btn btn-gold" id="nw">+ Novo serviço</button></div><div class="tbl-wrap"><table><thead><tr><th></th><th>Serviço</th><th>Preço</th><th>Duração</th><th>Realizados</th><th>Ações</th></tr></thead><tbody>' + d.services.map(s => '<tr><td><img src="' + esc(s.img) + '" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:6px"></td><td><b>' + esc(s.name) + '</b><br><span class="muted" style="font-size:.8rem">' + esc(s.desc) + '</span></td><td>' + money(s.price) + '</td><td>' + s.duration + ' min</td><td>' + BG.serviceCount(s.id) + '</td><td><div class="acts"><button class="btn btn-sm" data-e="' + s.id + '">Editar</button><button class="btn btn-sm btn-danger" data-x="' + s.id + '">Excluir</button></div></td></tr>').join('') + '</tbody></table></div>';
    $('#nw').onclick = () => svcForm(); $$('[data-e]').forEach(b => b.onclick = () => svcForm(BG.getService(b.dataset.e)));
    $$('[data-x]').forEach(b => b.onclick = async () => { const s = BG.getService(b.dataset.x); if (d.appointments.some(a => a.serviceId === s.id && a.status === 'confirmado' && a.date >= TODAY())) return BG.toast('Não é possível excluir', 'Há agendamentos futuros com este serviço.', 'err'); if (!(await BG.confirmBox('Excluir o serviço <b>' + esc(s.name) + '</b>? O histórico será mantido.', 'Excluir'))) return; d.services = d.services.filter(x => x.id !== s.id); d.barbers.forEach(x => x.services = x.services.filter(y => y !== s.id)); BG.save(); V.servicos(); });
  };
  function svcForm(s) {
    const n = !s; s = s || { name: '', desc: '', price: 50, duration: 30, img: 'img/servico-corte.svg' };
    const m = BG.modal('<h3>' + (n ? 'Novo serviço' : 'Editar serviço') + '</h3><div id="se"></div>' + F('sn', 'Nome', 'text', 'value="' + esc(s.name) + '"') + '<div class="field"><label for="sd">Descrição</label><textarea class="input" id="sd" rows="2">' + esc(s.desc) + '</textarea></div><div class="row">' + F('sp', 'Preço (R$)', 'number', 'min="0" step="0.01" value="' + s.price + '"') + F('sdu', 'Duração (min)', 'number', 'min="10" step="5" value="' + s.duration + '"') + '</div>' + imgField(s.img) + '<button class="btn btn-gold" id="ssv">Salvar</button>', 'narrow');
    bindImg(m.el, s.img);
    $('#ssv', m.el).onclick = () => { const name = $('#sn', m.el).value.trim(), price = parseFloat($('#sp', m.el).value), dur = parseInt($('#sdu', m.el).value, 10); if (!name || !(price >= 0) || !(dur >= 10)) return $('#se', m.el).innerHTML = '<div class="form-msg err">Preencha nome, preço e duração (mín. 10 min).</div>'; const d = db(); const o = n ? { id: BG.uid('s') } : s; Object.assign(o, { name, desc: $('#sd', m.el).value.trim(), price, duration: dur, img: m.el._img }); if (n) d.services.push(o); BG.save(); m.close(); BG.toast('Serviço salvo', name, 'ok'); V.servicos(); };
  }

  /* ================= ADMIN: Barbeiros ================= */
  V.barbeiros = () => {
    const d = db();
    main.innerHTML = '<h2>Barbeiros</h2><div class="toolbar"><span class="muted grow">Cadastre profissionais, defina serviços, dias de trabalho, intervalos e folgas.</span><button class="btn btn-gold" id="nw">+ Novo barbeiro</button></div><div class="tbl-wrap"><table><thead><tr><th></th><th>Barbeiro</th><th>Acesso</th><th>Nota</th><th>Atendimentos</th><th>Ações</th></tr></thead><tbody>' + d.barbers.map(b => { const u = d.users.find(x => x.barberId === b.id); return '<tr><td><img src="' + esc(b.img) + '" alt="" style="width:48px;height:60px;object-fit:cover;border-radius:6px"></td><td><b>' + esc(b.name) + '</b><br><span class="muted">' + esc(b.specialty) + '</span></td><td>' + esc(u ? u.email : '—') + '</td><td>' + BG.barberRating(b.id).toFixed(1).replace('.', ',') + ' ★</td><td>' + d.appointments.filter(a => a.barberId === b.id && a.status === 'concluido').length + '</td><td><div class="acts"><button class="btn btn-sm" data-e="' + b.id + '">Editar</button><button class="btn btn-sm btn-danger" data-x="' + b.id + '">Excluir</button></div></td></tr>'; }).join('') + '</tbody></table></div>';
    $('#nw').onclick = () => barberForm(); $$('[data-e]').forEach(b => b.onclick = () => barberForm(BG.getBarber(b.dataset.e)));
    $$('[data-x]').forEach(b => b.onclick = async () => { const x = BG.getBarber(b.dataset.x); if (d.appointments.some(a => a.barberId === x.id && a.status === 'confirmado' && a.date >= TODAY())) return BG.toast('Não é possível excluir', 'Há agendamentos futuros. Reagende ou cancele antes.', 'err'); if (!(await BG.confirmBox('Excluir <b>' + esc(x.name) + '</b> e o acesso dele ao painel?', 'Excluir'))) return; d.barbers = d.barbers.filter(y => y.id !== x.id); d.users = d.users.filter(u => u.barberId !== x.id); BG.save(); V.barbeiros(); });
  };
  function barberForm(b) {
    const d = db(), n = !b; const u = b && d.users.find(x => x.barberId === b.id);
    b = b || { name: '', specialty: '', exp: 1, bio: '', img: 'img/barbeiro-lucas.svg', services: [], gallery: ['img/galeria-1.svg', 'img/galeria-2.svg', 'img/galeria-3.svg'], schedule: BG.sch([2, 3, 4, 5, 6], '09:00', '18:00', '12:00', '13:00'), daysOff: [] };
    const m = BG.modal('<h3>' + (n ? 'Novo barbeiro' : 'Editar barbeiro') + '</h3><div id="be"></div><div class="row">' + F('bn', 'Nome', 'text', 'value="' + esc(b.name) + '"') + F('bsp', 'Especialidade', 'text', 'value="' + esc(b.specialty) + '"') + '</div><div class="row">' + F('bex', 'Anos de experiência', 'number', 'min="0" value="' + b.exp + '"') + F('bem', 'E-mail de acesso ao painel', 'email', 'value="' + esc(u ? u.email : '') + '"') + '</div>' + (n ? F('bpw', 'Senha inicial (mín. 6)', 'password') : '') + '<div class="field"><label>Biografia</label><textarea class="input" id="bbi" rows="3">' + esc(b.bio) + '</textarea></div>' + imgField(b.img) + '<div class="field"><label>Serviços oferecidos</label><div class="chip-row" id="bsv">' + d.services.map(s => '<label class="check" style="margin:.2rem .8rem .2rem 0"><input type="checkbox" value="' + s.id + '" ' + (b.services.includes(s.id) ? 'checked' : '') + '> ' + esc(s.name) + '</label>').join('') + '</div></div><h4 style="margin:1rem 0 .5rem">Dias e horários de atendimento</h4><div id="bsc">' + schedHTML(b) + '</div><h4 style="margin:1rem 0 .5rem">Folgas (datas)</h4><div class="chip-row" id="offs"></div><div style="display:flex;gap:.5rem;margin:.6rem 0"><input class="input" type="date" id="od" style="max-width:200px"><button class="btn btn-sm" id="oa">Adicionar folga</button></div><button class="btn btn-gold" id="bsave">Salvar</button>', 'wide');
    bindImg(m.el, b.img); let offs = (b.daysOff || []).slice();
    const dr = () => { $('#offs', m.el).innerHTML = offs.length ? offs.map(o => '<span class="chip on" data-o="' + o + '">' + BG.fmtDate(o) + ' ✕</span>').join('') : '<span class="muted">Nenhuma folga cadastrada.</span>'; $$('[data-o]', m.el).forEach(c => c.onclick = () => { offs = offs.filter(x => x !== c.dataset.o); dr(); }); }; dr();
    $('#oa', m.el).onclick = () => { const v = $('#od', m.el).value; if (v && !offs.includes(v)) { offs.push(v); offs.sort(); dr(); } };
    $('#bsave', m.el).onclick = () => {
      const er = t => { $('#be', m.el).innerHTML = '<div class="form-msg err">' + esc(t) + '</div>'; m.el.scrollTo ? m.el.parentNode.scrollTo(0, 0) : 0; };
      const name = $('#bn', m.el).value.trim(), email = $('#bem', m.el).value.trim().toLowerCase(); if (!name) return er('Informe o nome.'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return er('Informe um e-mail válido para o acesso.');
      if (d.users.some(x => x.email === email && (!u || x.id !== u.id))) return er('Esse e-mail já está em uso.'); if (n && ($('#bpw', m.el).value || '').length < 6) return er('Senha inicial com ao menos 6 caracteres.');
      const sv = $$('#bsv input:checked', m.el).map(i => i.value); if (!sv.length) return er('Selecione ao menos um serviço.');
      const o = n ? { id: BG.uid('b') } : b; Object.assign(o, { name, specialty: $('#bsp', m.el).value.trim(), exp: +$('#bex', m.el).value || 0, bio: $('#bbi', m.el).value.trim(), img: m.el._img, services: sv, schedule: readSched($('#bsc', m.el)), daysOff: offs, gallery: b.gallery });
      if (n) { d.barbers.push(o); d.users.push({ id: BG.uid('u'), name, email, phone: '', pass: BG.hash($('#bpw', m.el).value), role: 'barber', barberId: o.id, marketing: false, createdAt: new Date().toISOString() }); } else if (u) { u.name = name; u.email = email; }
      BG.save(); m.close(); BG.toast('Barbeiro salvo', name, 'ok'); V.barbeiros();
    };
  }

  /* ================= ADMIN: Clientes ================= */
  V.clientes = () => {
    const d = db(), q = S.q.toLowerCase();
    const cl = d.users.filter(u => u.role === 'client' && (!q || (u.name + u.email + u.phone).toLowerCase().includes(q)));
    main.innerHTML = '<h2>Clientes</h2><div class="toolbar"><input class="input grow" id="fq" placeholder="Buscar por nome, e-mail ou telefone" value="' + esc(S.q) + '"><button class="btn btn-sm" id="csv">Exportar CSV</button></div><div class="tbl-wrap"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Cadastro</th><th>Atend.</th><th>Total gasto</th><th>Marketing</th><th></th></tr></thead><tbody>' + cl.map(u => { const ap = d.appointments.filter(a => a.clientId === u.id), tot = sum(d.transactions.filter(t => ap.some(a => a.id === t.apptId)).map(t => t.amount)); u._n = ap.filter(a => a.status === 'concluido').length; u._t = tot; return '<tr><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.email) + '<br><span class="muted">' + esc(u.phone) + '</span></td><td>' + BG.fmtDate(u.createdAt.slice(0, 10)) + '</td><td>' + u._n + '</td><td>' + money(tot) + '</td><td>' + (u.marketing ? '<span class="badge ok">Autorizou</span>' : '<span class="badge mute">Não</span>') + '</td><td><button class="btn btn-sm" data-h="' + u.id + '">Histórico</button></td></tr>'; }).join('') + '</tbody></table></div>';
    $('#fq').onchange = e => { S.q = e.target.value; V.clientes(); };
    $('#csv').onclick = () => BG.csv('clientes.csv', [['Nome', 'E-mail', 'Telefone', 'Cadastro', 'Atendimentos', 'Total gasto', 'Marketing']].concat(cl.map(u => [u.name, u.email, u.phone, BG.fmtDate(u.createdAt.slice(0, 10)), u._n, String(u._t).replace('.', ','), u.marketing ? 'sim' : 'não'])));
    $$('[data-h]').forEach(b => b.onclick = () => { const u = BG.getUser(b.dataset.h), ap = d.appointments.filter(a => a.clientId === u.id && a.status !== 'pendente').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); BG.modal('<h3>' + esc(u.name) + '</h3><p class="muted" style="margin-bottom:1rem">' + esc(u.email) + ' · ' + esc(u.phone) + '</p><div class="tbl-wrap"><table><tbody>' + (ap.length ? ap.map(a => '<tr><td>' + BG.fmtDate(a.date) + ' ' + a.time + '</td><td>' + esc(a.serviceName) + '</td><td>' + esc((BG.getBarber(a.barberId) || {}).name) + '</td><td>' + money(a.price) + '</td><td>' + badge(STAT, a.status) + '</td></tr>').join('') : '<tr><td class="empty-state">Sem histórico.</td></tr>') + '</tbody></table></div>', 'wide'); });
  };

  /* ================= ADMIN: Pagamentos ================= */
  V.pagamentos = () => {
    const d = db(); const f = S.pf || (S.pf = { m: '', from: BG.ymd(BG.addDays(new Date(), -30)), to: TODAY() });
    const tx = d.transactions.filter(t => (!f.m || t.method === f.m) && dayOf(t) >= f.from && dayOf(t) <= f.to).sort((a, b) => b.date.localeCompare(a.date));
    const rec = sum(tx.filter(t => t.amount > 0).map(t => t.amount)), est = sum(tx.filter(t => t.amount < 0).map(t => t.amount));
    main.innerHTML = '<h2>Pagamentos</h2><div class="kpis"><div class="kpi"><span>Recebido</span><b>' + money(rec) + '</b></div><div class="kpi"><span>Estornado</span><b>' + money(est) + '</b></div><div class="kpi"><span>Líquido</span><b>' + money(rec + est) + '</b></div><div class="kpi"><span>Transações</span><b>' + tx.length + '</b></div></div><div class="toolbar"><input class="input" type="date" id="pfa" value="' + f.from + '"><input class="input" type="date" id="pfb" value="' + f.to + '"><select class="select input" id="pfm"><option value="">Todos os meios</option>' + ['pix', 'credito', 'debito', 'presencial'].map(x => '<option value="' + x + '" ' + (f.m === x ? 'selected' : '') + '>' + x.toUpperCase() + '</option>').join('') + '</select><span class="grow"></span><button class="btn btn-sm" id="csv">Exportar CSV</button></div><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Cliente</th><th>Descrição</th><th>Meio</th><th>Valor</th><th>Tipo</th><th></th></tr></thead><tbody>' + (tx.length ? tx.slice(0, 300).map(t => { const a = apptOf(t.apptId), can = t.type === 'pagamento' && a && a.payment.paid > 0 && a.payment.status !== 'estornado' && a.payment.txIds[0] === t.id; return '<tr><td>' + BG.fmtDT(t.date) + '</td><td>' + esc(t.clientName) + '</td><td>' + esc(t.desc) + '</td><td>' + esc(t.method.toUpperCase()) + '</td><td style="color:' + (t.amount < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + money(t.amount) + '</td><td>' + (t.type === 'estorno' ? '<span class="badge mute">Estorno</span>' : '<span class="badge ok">Pagamento</span>') + '</td><td>' + (a ? '<div class="acts"><button class="btn btn-sm" data-rc="' + a.id + '">Comprovante</button>' + (can ? '<button class="btn btn-sm btn-danger" data-rf="' + a.id + '">Estornar</button>' : '') + '</div>' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="empty-state">Nenhuma transação no período.</td></tr>') + '</tbody></table></div><p class="muted" style="font-size:.78rem;margin-top:.8rem">[Integração] Em produção, o estorno é enviado ao gateway (ex.: Mercado Pago) e segue as regras e prazos do provedor.</p>';
    $('#pfa').onchange = e => { f.from = e.target.value; V.pagamentos(); }; $('#pfb').onchange = e => { f.to = e.target.value; V.pagamentos(); }; $('#pfm').onchange = e => { f.m = e.target.value; V.pagamentos(); };
    $('#csv').onclick = () => BG.csv('pagamentos.csv', [['Data', 'Cliente', 'Descrição', 'Meio', 'Valor', 'Tipo']].concat(tx.map(t => [BG.fmtDT(t.date), t.clientName, t.desc, t.method, String(t.amount).replace('.', ','), t.type])));
    $$('[data-rc]').forEach(b => b.onclick = () => BG.modal('<h3>Comprovante</h3>' + BG.receiptHTML(apptOf(b.dataset.rc)) + '<div class="card-actions no-print" style="margin-top:1rem"><button class="btn btn-sm" onclick="print()">Imprimir</button></div>', 'narrow'));
    $$('[data-rf]').forEach(b => b.onclick = async () => { const a = apptOf(b.dataset.rf); if (await BG.confirmBox('Estornar <b>' + money(a.payment.paid) + '</b> de ' + esc(a.clientName) + '? O agendamento será cancelado.', 'Estornar')) { BG.refund(a.id); BG.toast('Estorno registrado', 'Cliente notificado (simulado).', 'ok'); V.pagamentos(); } });
  };

  /* ================= ADMIN: Relatórios ================= */
  V.relatorios = () => {
    const d = db(), f = S.rf || (S.rf = { from: BG.ymd(BG.addDays(new Date(), -29)), to: TODAY() });
    const tx = d.transactions.filter(t => dayOf(t) >= f.from && dayOf(t) <= f.to), ap = d.appointments.filter(a => a.date >= f.from && a.date <= f.to);
    const done = ap.filter(a => a.status === 'concluido'), canc = ap.filter(a => a.status === 'cancelado');
    const rev = sum(tx.map(t => t.amount)), by = (key, list) => { const o = {}; list.forEach(x => { const k = key(x); o[k] = (o[k] || 0) + x.amount; }); return Object.entries(o).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v); };
    const byB = by(t => { const a = apptOf(t.apptId); return a ? (BG.getBarber(a.barberId) || {}).name || '—' : '—'; }, tx), byS = by(t => { const a = apptOf(t.apptId); return a ? a.serviceName : '—'; }, tx), byM = by(t => t.method.toUpperCase(), tx);
    const daily = {}; tx.forEach(t => { const k = dayOf(t); daily[k] = (daily[k] || 0) + t.amount; });
    const ds = []; for (let x = BG.parseYmd(f.from); BG.ymd(x) <= f.to && ds.length < 62; x = BG.addDays(x, 1)) { const k = BG.ymd(x); ds.push({ l: BG.fmtDate(k), s: pad2(x.getDate()), v: Math.max(0, daily[k] || 0) }); }
    main.innerHTML = '<h2>Relatórios financeiros</h2><div class="toolbar no-print"><input class="input" type="date" id="ra" value="' + f.from + '"><input class="input" type="date" id="rb" value="' + f.to + '"><button class="btn btn-sm" id="r7">7 dias</button><button class="btn btn-sm" id="r30">30 dias</button><button class="btn btn-sm" id="rm">Mês atual</button><span class="grow"></span><button class="btn btn-sm" id="csv">Exportar CSV</button><button class="btn btn-sm" onclick="print()">Imprimir</button></div><p class="muted">Período: ' + BG.fmtDate(f.from) + ' a ' + BG.fmtDate(f.to) + '</p><div class="kpis"><div class="kpi"><span>Receita líquida</span><b>' + money(rev) + '</b></div><div class="kpi"><span>Atendimentos concluídos</span><b>' + done.length + '</b></div><div class="kpi"><span>Ticket médio</span><b>' + money(done.length ? sum(done.map(a => a.price)) / done.length : 0) + '</b></div><div class="kpi"><span>Cancelamentos</span><b>' + canc.length + '</b><small>' + (ap.length ? Math.round(canc.length / ap.length * 100) : 0) + '% dos agendamentos</small></div></div><div class="panel" style="margin-bottom:1.2rem"><h3>Receita por dia</h3>' + bars(ds, money) + '</div><div class="grid g3"><div class="panel"><h3>Por barbeiro</h3>' + hbars(byB, money) + '</div><div class="panel"><h3>Por serviço</h3>' + hbars(byS, money) + '</div><div class="panel"><h3>Por meio de pagamento</h3>' + hbars(byM, money) + '</div></div>';
    const set = (a, b) => { f.from = a; f.to = b; V.relatorios(); };
    $('#ra').onchange = e => set(e.target.value, f.to); $('#rb').onchange = e => set(f.from, e.target.value); $('#r7').onclick = () => set(BG.ymd(BG.addDays(new Date(), -6)), TODAY()); $('#r30').onclick = () => set(BG.ymd(BG.addDays(new Date(), -29)), TODAY()); $('#rm').onclick = () => set(TODAY().slice(0, 8) + '01', TODAY());
    $('#csv').onclick = () => BG.csv('relatorio-financeiro.csv', [['Resumo', BG.fmtDate(f.from) + ' a ' + BG.fmtDate(f.to)], ['Receita líquida', String(rev).replace('.', ',')], ['Atendimentos concluídos', done.length], [], ['Barbeiro', 'Receita']].concat(byB.map(x => [x.l, String(x.v).replace('.', ',')]), [[], ['Serviço', 'Receita']], byS.map(x => [x.l, String(x.v).replace('.', ',')]), [[], ['Meio', 'Receita']], byM.map(x => [x.l, String(x.v).replace('.', ',')])));
  };

  /* ================= ADMIN: Configurações ================= */
  V.config = () => {
    const c = db().config;
    main.innerHTML = '<h2>Configurações</h2><div id="ce"></div><div class="grid g2"><div class="panel"><h3>Dados da barbearia</h3>' + [['cn', 'Nome', 'name'], ['ctg', 'Slogan', 'tagline'], ['cph', 'Telefone', 'phone'], ['cwa', 'WhatsApp (somente números, com DDI)', 'whatsapp'], ['cem', 'E-mail', 'email'], ['cad', 'Endereço completo', 'address'], ['cig', 'Instagram (URL)', 'instagram'], ['cfb', 'Facebook (URL)', 'facebook']].map(r => F(r[0], r[1], 'text', 'value="' + esc(c[r[2]]) + '"')).join('') + '</div><div class="panel"><h3>Regras de agendamento</h3><div class="row">' + F('cmin', 'Antecedência mínima (horas)', 'number', 'min="0" value="' + c.minAdvanceHours + '"') + F('cmax', 'Antecedência máxima (dias)', 'number', 'min="1" value="' + c.maxAdvanceDays + '"') + '</div><div class="row">' + F('ccx', 'Cancelamento gratuito até (horas antes)', 'number', 'min="0" value="' + c.cancelHours + '"') + F('cdp', 'Sinal (% do valor)', 'number', 'min="1" max="100" value="' + c.depositPct + '"') + '</div>' + F('chd', 'Reserva durante o pagamento (minutos)', 'number', 'min="3" value="' + c.holdMinutes + '"') + '<label class="check"><input type="checkbox" id="cps" ' + (c.allowPayAtShop ? 'checked' : '') + '> Permitir pagamento presencial</label><h3 style="margin:1.4rem 0 .8rem">Horário de funcionamento</h3>' + [1, 2, 3, 4, 5, 6, 0].map(dw => { const h = c.hours[dw]; return '<div class="sched-row" data-hw="' + dw + '" style="grid-template-columns:110px 1fr 1fr"><label class="check" style="margin:0"><input type="checkbox" class="ho" ' + (h.open ? 'checked' : '') + '> <b>' + BG.DOW3[dw] + '</b></label><input class="input hs" type="time" value="' + h.start + '"><input class="input he" type="time" value="' + h.end + '"></div>'; }).join('') + '</div></div><button class="btn btn-gold" id="csv" style="margin-top:1.2rem">Salvar configurações</button> <button class="btn btn-danger" id="rst" style="margin-top:1.2rem">Restaurar dados de exemplo</button>';
    $('#csv').onclick = () => {
      const g = i => $('#' + i).value.trim(); if (!g('cn')) return $('#ce').innerHTML = '<div class="form-msg err">Informe o nome da barbearia.</div>';
      Object.assign(c, { name: g('cn'), tagline: g('ctg'), phone: g('cph'), whatsapp: g('cwa').replace(/\D/g, ''), email: g('cem'), address: g('cad'), instagram: g('cig'), facebook: g('cfb'), minAdvanceHours: Math.max(0, +g('cmin') || 0), maxAdvanceDays: Math.max(1, +g('cmax') || 30), cancelHours: Math.max(0, +g('ccx') || 0), depositPct: Math.min(100, Math.max(1, +g('cdp') || 30)), holdMinutes: Math.max(3, +g('chd') || 10), allowPayAtShop: $('#cps').checked });
      $$('[data-hw]').forEach(r => { c.hours[r.dataset.hw] = { open: $('.ho', r).checked, start: $('.hs', r).value || '09:00', end: $('.he', r).value || '18:00' }; }); BG.save(); BG.toast('Configurações salvas', '', 'ok'); render();
    };
    $('#rst').onclick = async () => { if (await BG.confirmBox('Restaurar todos os dados de exemplo? Todas as alterações serão perdidas.', 'Restaurar')) { BG.reset(); location.href = 'index.html'; } };
  };

  /* ================= ADMIN: Notificações ================= */
  V.notif = () => {
    const d = db(), list = d.notifications.slice(0, 120), mk = d.users.filter(u => u.role === 'client' && u.marketing).length;
    main.innerHTML = '<h2>Notificações automáticas</h2><div class="demo-ribbon">Simulação: as mensagens abaixo seriam enviadas por e-mail/WhatsApp. Em produção, conecte um provedor (ex.: Resend / WhatsApp Business API).</div><div class="toolbar"><span class="muted grow">Confirmação de cadastro, agendamento, pagamento, lembrete (24h antes), cancelamento, alteração de horário e campanhas.</span><button class="btn btn-gold" id="cmp">Nova campanha (' + mk + ' autorizaram)</button></div><div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Canal</th><th>Para</th><th>Assunto / mensagem</th></tr></thead><tbody>' + (list.length ? list.map(n => '<tr><td style="white-space:nowrap">' + BG.fmtDT(n.date) + '</td><td><span class="badge ' + (n.channel === 'email' ? 'info' : 'ok') + '">' + (n.channel === 'email' ? 'E-mail' : 'WhatsApp') + '</span></td><td>' + esc(n.to) + '</td><td><b>' + esc(n.subject) + '</b><br><span class="muted">' + esc(n.body) + '</span></td></tr>').join('') : '<tr><td colspan="4" class="empty-state">Nenhuma mensagem enviada ainda. Faça um agendamento para ver as notificações.</td></tr>') + '</tbody></table></div>';
    $('#cmp').onclick = () => { const m = BG.modal('<h3>Nova campanha promocional</h3><p class="muted" style="margin-bottom:1rem">Enviada somente a clientes que autorizaram receber promoções (' + mk + ').</p>' + F('cs', 'Assunto', 'text', 'placeholder="Ex.: 20% off em barba esta semana"') + '<div class="field"><label>Mensagem</label><textarea class="input" id="cm" rows="4"></textarea></div><button class="btn btn-gold" id="snd">Enviar campanha</button>', 'narrow'); $('#snd', m.el).onclick = () => { const s = $('#cs', m.el).value.trim(), b = $('#cm', m.el).value.trim(); if (!s || !b) return BG.toast('Preencha assunto e mensagem', '', 'err'); BG.reload(); BG.db.users.filter(u => u.role === 'client' && u.marketing).forEach(u => { BG.pushNote('email', u.email, s, b, u.id, 'promo'); BG.pushNote('whatsapp', u.phone, s, b, u.id, 'promo'); }); BG.save(); m.close(); BG.toast('Campanha enviada', mk + ' clientes (simulado).', 'ok'); V.notif(); }; };
  };

  render(); BG.footer();
})();
