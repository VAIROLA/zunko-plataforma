(function () {
  'use strict';
  const { $, $$, esc, money } = BG;
  BG.header('agendar'); BG.seo('Agendar horário — ' + BG.db.config.name + ' Barbearia', 'Escolha serviço, barbeiro, data e horário e agende online.');
  const DKEY = 'bg_draft_v1';
  const q = new URLSearchParams(location.search);
  let S = { step: 1, service: null, barber: null, date: null, time: null, slotOpts: null, mode: 'integral', method: 'pix', month: null };
  try { const d = JSON.parse(sessionStorage.getItem(DKEY) || 'null'); if (d && q.get('resume')) S = Object.assign(S, d); } catch (e) { }
  if (!q.get('resume')) {
    if (q.get('service') && BG.getService(q.get('service'))) { S.service = q.get('service'); S.step = 2; }
    if (q.get('barber') && BG.getBarber(q.get('barber'))) { S.barber = q.get('barber'); if (S.service) { if (BG.getBarber(S.barber).services.includes(S.service)) S.step = 3; else S.barber = null; } }
  }
  const cfg = () => BG.db.config;
  const save = () => { try { sessionStorage.setItem(DKEY, JSON.stringify(S)); } catch (e) { } };
  const svc = () => S.service && BG.getService(S.service);
  const bar = () => S.barber && S.barber !== 'any' ? BG.getBarber(S.barber) : null;
  const LABELS = ['Serviço', 'Barbeiro', 'Data e hora', 'Pagamento'];

  function renderSteps() {
    $('#steps').innerHTML = LABELS.map((l, i) => '<div class="step ' + (S.step === i + 1 ? 'active' : S.step > i + 1 ? 'done' : '') + '"><i>' + (S.step > i + 1 ? '✓' : i + 1) + '</i><span>' + l + '</span></div>').join('');
  }
  function renderSummary() {
    const s = svc(), b = bar();
    $('#summary').innerHTML = '<h3>Resumo</h3><dl><div><dt>Serviço</dt><dd>' + (s ? esc(s.name) + ' <span class="muted">· ' + s.duration + ' min</span>' : '—') + '</dd></div><div><dt>Barbeiro</dt><dd>' + (S.barber === 'any' ? 'Qualquer profissional disponível' : b ? esc(b.name) : '—') + '</dd></div><div><dt>Data e horário</dt><dd>' + (S.date && S.time ? esc(BG.fmtLong(S.date)) + ' às ' + S.time : '—') + '</dd></div></dl><div class="total"><span class="muted">Total</span><span class="price">' + (s ? money(s.price) : '—') + '</span></div>';
  }
  function go(n) { S.step = n; save(); render(); scrollTo({ top: 0, behavior: 'smooth' }); }
  function nav(back, next, nextLabel, enabled) {
    return '<div class="nav-btns">' + (back ? '<button class="btn" data-back>← Voltar</button>' : '<span></span>') + '<button class="btn btn-gold" data-next ' + (enabled ? '' : 'disabled') + '>' + (nextLabel || 'Continuar →') + '</button></div>';
  }

  /* ---- Passo 1: serviço ---- */
  function step1() {
    const forced = S.barber && S.barber !== 'any' ? BG.getBarber(S.barber) : null;
    const list = BG.db.services.filter(s => !forced || forced.services.includes(s.id));
    $('#stage').innerHTML = '<div class="panel"><h3>1. Escolha o serviço' + (forced ? ' <small class="muted" style="font-size:.9rem">com ' + esc(forced.name) + '</small>' : '') + '</h3><div class="grid" style="gap:.8rem">' + list.map(s => '<button class="opt ' + (S.service === s.id ? 'sel' : '') + '" data-s="' + s.id + '"><img src="' + esc(s.img) + '" alt="" loading="lazy"><span><b>' + esc(s.name) + '</b><small>' + esc(s.desc) + '</small></span><span class="end"><b class="price" style="font-size:1.15rem">' + money(s.price) + '</b><small>⏱ ' + s.duration + ' min</small></span></button>').join('') + '</div>' + nav(false, true, 'Continuar →', !!S.service) + '</div>';
    $$('[data-s]').forEach(b => b.onclick = () => { if (S.service !== b.dataset.s) { S.service = b.dataset.s; S.date = S.time = null; if (S.barber && S.barber !== 'any' && !BG.getBarber(S.barber).services.includes(S.service)) S.barber = null; } save(); step1(); renderSummary(); });
    $('[data-next]').onclick = () => go(2);
  }

  /* ---- Passo 2: barbeiro ---- */
  function step2() {
    const cands = BG.db.barbers.filter(b => b.services.includes(S.service));
    $('#stage').innerHTML = '<div class="panel"><h3>2. Escolha o barbeiro</h3><div class="grid" style="gap:.8rem"><button class="opt ' + (S.barber === 'any' ? 'sel' : '') + '" data-b="any"><span style="width:64px;height:76px;border-radius:8px;background:var(--goldgrad);display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:#17120a;flex:none">★</span><span><b>Qualquer profissional disponível</b><small>Mais opções de horário — nós escolhemos o barbeiro para você</small></span></button>' +
      cands.map(b => { const r = BG.barberRating(b.id); return '<button class="opt bar ' + (S.barber === b.id ? 'sel' : '') + '" data-b="' + b.id + '"><img src="' + esc(b.img) + '" alt="" loading="lazy"><span><b>' + esc(b.name) + '</b><small>' + esc(b.specialty) + '</small></span><span class="end"><span class="stars">' + BG.stars(r) + '</span><br><small>' + r.toFixed(1).replace('.', ',') + ' · ' + b.exp + ' anos</small></span></button>'; }).join('') + '</div>' + nav(true, true, 'Continuar →', !!S.barber) + '</div>';
    $$('[data-b]').forEach(b => b.onclick = () => { if (S.barber !== b.dataset.b) { S.barber = b.dataset.b; S.date = S.time = null; } save(); step2(); renderSummary(); });
    $('[data-back]').onclick = () => go(1); $('[data-next]').onclick = () => go(3);
  }

  /* ---- Passo 3: data e horário ---- */
  function step3() {
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const maxD = BG.addDays(today, cfg().maxAdvanceDays);
    if (!S.month) { const base = S.date ? BG.parseYmd(S.date) : today; S.month = [base.getFullYear(), base.getMonth()]; }
    const [y, m] = S.month; const first = new Date(y, m, 1, 12), days = new Date(y, m + 1, 0).getDate();
    let cells = ''; for (let i = 0; i < first.getDay(); i++) cells += '<span class="empty"></span>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d, 12), ds = BG.ymd(dt); const inRange = dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0) && dt <= maxD;
      const ok = inRange && BG.dayHasSlots(S.service, S.barber, ds);
      cells += '<button ' + (ok ? '' : 'disabled') + ' data-d="' + ds + '" class="' + (S.date === ds ? 'sel ' : '') + (BG.ymd(today) === ds ? 'today' : '') + '">' + d + '</button>';
    }
    const prevOk = new Date(y, m, 0, 12) >= new Date(today.getFullYear(), today.getMonth(), 1), nextOk = new Date(y, m + 1, 1, 12) <= maxD;
    let slotsHtml = '<p class="muted">Selecione uma data para ver os horários disponíveis.</p>';
    if (S.date) {
      const sl = BG.slotsFor(S.service, S.barber, S.date);
      slotsHtml = sl.length ? '<div class="slots">' + sl.map(x => '<button class="slot ' + (S.time === x.time ? 'sel' : '') + '" data-t="' + x.time + '">' + x.time + (x.options ? '<small>' + x.options.length + ' barbeiro' + (x.options.length > 1 ? 's' : '') + '</small>' : '') + '</button>').join('') + '</div>' : '<p class="muted">Sem horários nesta data. Tente outro dia.</p>';
    }
    $('#stage').innerHTML = '<div class="panel"><h3>3. Escolha a data e o horário</h3><div class="cal-nav"><button data-m="-1" ' + (prevOk ? '' : 'disabled') + ' aria-label="Mês anterior">‹</button><h4>' + new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) + '</h4><button data-m="1" ' + (nextOk ? '' : 'disabled') + ' aria-label="Próximo mês">›</button></div><div class="cal">' + BG.DOW3.map(d => '<span class="dow">' + d + '</span>').join('') + cells + '</div>' +
      '<h4 style="margin:1.4rem 0 0">' + (S.date ? 'Horários — ' + esc(BG.fmtLong(S.date)) : 'Horários') + '</h4>' + slotsHtml + '<p class="muted" style="font-size:.78rem;margin-top:1rem">Agendamentos com antecedência mínima de ' + cfg().minAdvanceHours + 'h e máxima de ' + cfg().maxAdvanceDays + ' dias. Horários ocupados são bloqueados automaticamente.</p>' + nav(true, true, 'Continuar →', !!(S.date && S.time)) + '</div>';
    $$('[data-m]').forEach(b => b.onclick = () => { const t = new Date(y, m + +b.dataset.m, 1); S.month = [t.getFullYear(), t.getMonth()]; step3(); });
    $$('[data-d]').forEach(b => b.onclick = () => { S.date = b.dataset.d; S.time = null; save(); step3(); renderSummary(); });
    $$('[data-t]').forEach(b => b.onclick = () => { S.time = b.dataset.t; save(); step3(); renderSummary(); });
    $('[data-back]').onclick = () => go(2); $('[data-next]').onclick = () => go(4);
  }

  /* ---- Passo 4: confirmação e pagamento ---- */
  function step4() {
    const u = BG.current(), s = svc(), c = cfg();
    if (!S.date || !S.time) return go(3);
    if (S.mode === 'presencial' && !c.allowPayAtShop) S.mode = 'integral';
    const dep = BG.amountFor(s, 'sinal');
    const modes = [['integral', 'Pagar tudo agora', money(s.price), 'Garantia total do horário'], ['sinal', 'Pagar sinal (' + c.depositPct + '%)', money(dep), 'Restante no local: ' + money(s.price - dep)]];
    if (c.allowPayAtShop) modes.push(['presencial', 'Pagar no local', money(0), 'Pague ' + money(s.price) + ' ao ser atendido']);
    const methods = [['pix', 'PIX', 'Aprovação imediata'], ['credito', 'Cartão de crédito', 'Até 3x sem juros'], ['debito', 'Cartão de débito', 'À vista']];
    const logged = u ? '<div class="form-msg ok" style="margin-bottom:1rem">Agendando como <b>' + esc(u.name) + '</b> · ' + esc(u.email) + ' · <a href="conta.html">minha conta</a></div>' : '<div class="form-msg err">Para finalizar, entre na sua conta ou crie um cadastro rápido. Seus dados de agendamento serão mantidos.<br><a class="btn btn-gold btn-sm" style="margin-top:.7rem" href="conta.html?next=' + encodeURIComponent('agendar.html?resume=1') + '" id="goLogin">Entrar ou cadastrar</a></div>';
    $('#stage').innerHTML = '<div class="panel"><h3>4. Confirme e escolha o pagamento</h3>' + logged +
      '<div class="field"><label>Forma de pagamento</label><div class="pay-opts">' + modes.map(m => '<button class="opt ' + (S.mode === m[0] ? 'sel' : '') + '" data-mode="' + m[0] + '"><b>' + m[1] + '</b><b class="price" style="font-size:1.2rem">' + m[2] + '</b><small>' + m[3] + '</small></button>').join('') + '</div></div>' +
      (S.mode !== 'presencial' ? '<div class="field"><label>Meio de pagamento</label><div class="pay-opts">' + methods.map(m => '<button class="opt ' + (S.method === m[0] ? 'sel' : '') + '" data-method="' + m[0] + '"><b>' + m[1] + '</b><small>' + m[2] + '</small></button>').join('') + '</div></div>' : '') +
      '<div class="demo-ribbon">DEMONSTRAÇÃO: o pagamento é simulado — nenhuma cobrança real é feita e nenhum dado de cartão é armazenado.</div>' +
      '<label class="check"><input type="checkbox" id="agree"> <span>Li e aceito os <a href="#" data-pol="termos">termos de uso</a> e a <a href="#" data-pol="cancelamento">política de cancelamento</a> (cancelamento gratuito até ' + c.cancelHours + 'h antes).</span></label>' +
      '<div id="errBox"></div><div class="nav-btns"><button class="btn" data-back>← Voltar</button><button class="btn btn-gold btn-lg" id="payBtn" ' + (u ? '' : 'disabled') + '>' + (S.mode === 'presencial' ? 'Confirmar agendamento' : 'Pagar ' + money(S.mode === 'integral' ? s.price : dep) + ' e confirmar') + '</button></div></div>';
    $$('[data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; save(); step4(); });
    $$('[data-method]').forEach(b => b.onclick = () => { S.method = b.dataset.method; save(); step4(); });
    $$('[data-pol]').forEach(a => a.onclick = e => { e.preventDefault(); BG.policy(a.dataset.pol); });
    const gl = $('#goLogin'); if (gl) gl.onclick = save;
    $('[data-back]').onclick = () => go(3);
    $('#payBtn').onclick = () => submit();
  }

  function submit() {
    const box = $('#errBox'); box.innerHTML = '';
    if (!$('#agree').checked) { box.innerHTML = '<div class="form-msg err">Aceite os termos para continuar.</div>'; return; }
    let a; try { a = BG.createAppointment({ clientId: BG.current().id, serviceId: S.service, barberId: S.barber, date: S.date, time: S.time, mode: S.mode, method: S.mode === 'presencial' ? 'presencial' : S.method }); }
    catch (e) { box.innerHTML = '<div class="form-msg err">' + esc(e.message) + '</div>'; S.time = null; save(); setTimeout(() => go(3), 1400); return; }
    if (S.mode === 'presencial') return finish(BG.confirmPayment(a.id, { mode: 'presencial' }));
    payModal(a);
  }

  /* ---- Pagamento simulado ---- */
  function fakeQR(seed) {
    let h = 7; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const n = 29, cell = 6; let r = '';
    const rnd = () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
    const finder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > .52) r += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '"/>';
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([x, y]) => { r += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + 7 * cell + '" height="' + 7 * cell + '"/><rect x="' + (x + 1) * cell + '" y="' + (y + 1) * cell + '" width="' + 5 * cell + '" height="' + 5 * cell + '" fill="#fff"/><rect x="' + (x + 2) * cell + '" y="' + (y + 2) * cell + '" width="' + 3 * cell + '" height="' + 3 * cell + '"/>'; });
    return '<svg class="qr" viewBox="0 0 ' + n * cell + ' ' + n * cell + '" aria-label="QR Code de demonstração" fill="#0b0b0c">' + r + '</svg>';
  }
  function payModal(a) {
    const s = svc(), amt = BG.amountFor(s, S.mode); let paid = false, keep = false;
    const m = BG.modal('', 'narrow', () => { if (!paid && !keep) { BG.releaseHold(a.id); const b = $('#errBox'); if (b) b.innerHTML = '<div class="form-msg err">Pagamento não concluído. A reserva do horário foi liberada.</div>'; } });
    const body = h => { m.el.innerHTML = '<button class="x" aria-label="Fechar">&times;</button>' + h; $('.x', m.el).onclick = m.close; };
    const processing = (done) => { body('<div style="text-align:center;padding:1.5rem 0"><div class="spinner"></div><p>Processando pagamento…</p></div>'); setTimeout(done, 1500); };
    const approve = card => processing(() => { try { const ap = BG.confirmPayment(a.id, { mode: S.mode, method: S.method, card }); paid = true; m.close(); finish(ap); } catch (e) { body('<h3>Não foi possível concluir</h3><p class="muted" style="margin:.6rem 0 1rem">' + esc(e.message) + '</p><button class="btn" data-x>Fechar</button>'); $('[data-x]', m.el).onclick = m.close; } });
    if (S.method === 'pix') {
      const code = '00020126580014BR.GOV.BCB.PIX0136DEMO-' + a.id.slice(2, 10) + '5204000053039865406' + amt.toFixed(2).replace('.', '') + '5802BR5909BLACKGOLD6009SAO PAULO62070503***6304DEMO';
      body('<h3>Pague com PIX</h3><div class="demo-ribbon">QR Code ilustrativo — não é um PIX real.</div><p class="muted" style="text-align:center">Valor: <b class="price">' + money(amt) + '</b></p>' + fakeQR(code) + '<div class="code" id="pixc">' + esc(code) + '</div><div class="card-actions" style="margin:1rem 0;justify-content:center"><button class="btn btn-sm" id="cp">Copiar código</button></div><p class="muted" style="font-size:.8rem;text-align:center;margin-bottom:1rem">Reserva do horário mantida por ' + cfg().holdMinutes + ' minutos.</p><button class="btn btn-gold" style="width:100%" id="sim">Simular pagamento aprovado</button>');
      $('#cp').onclick = () => { try { navigator.clipboard.writeText(code); } catch (e) { } BG.toast('Código copiado'); };
      $('#sim').onclick = () => approve(null);
    } else {
      const cred = S.method === 'credito';
      body('<h3>' + (cred ? 'Cartão de crédito' : 'Cartão de débito') + '</h3><div class="demo-ribbon">Demonstração. Teste: <b>4111 1111 1111 1111</b> (aprova) · <b>4000 0000 0000 0002</b> (recusa). Nada é armazenado.</div><p class="muted" style="margin-bottom:1rem">Valor: <b class="price">' + money(amt) + '</b></p><div id="cerr"></div>' +
        '<div class="field"><label>Número do cartão</label><input class="input" id="cn" inputmode="numeric" autocomplete="off" maxlength="23" placeholder="0000 0000 0000 0000"></div><div class="field"><label>Nome impresso</label><input class="input" id="cname" autocomplete="off" placeholder="COMO NO CARTÃO"></div><div class="row"><div class="field"><label>Validade</label><input class="input" id="cv" inputmode="numeric" maxlength="5" placeholder="MM/AA" autocomplete="off"></div><div class="field"><label>CVV</label><input class="input" id="cc" inputmode="numeric" maxlength="4" placeholder="123" autocomplete="off"></div></div>' +
        (cred ? '<div class="field"><label>Parcelas</label><select class="select input" id="cp">' + [1, 2, 3].map(n => '<option value="' + n + '">' + n + 'x de ' + money(amt / n) + ' sem juros</option>').join('') + '</select></div>' : '') + '<button class="btn btn-gold" style="width:100%" id="pay">Pagar ' + money(amt) + '</button>');
      $('#cn').oninput = e => { const v = e.target.value.replace(/\D/g, '').slice(0, 19); e.target.value = v.replace(/(.{4})/g, '$1 ').trim(); };
      $('#cv').oninput = e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; };
      $('#pay').onclick = () => {
        const n = $('#cn').value.replace(/\D/g, ''), v = $('#cv').value, cvv = $('#cc').value, nm = $('#cname').value.trim(); const er = t => { $('#cerr').innerHTML = '<div class="form-msg err">' + t + '</div>'; };
        if (!BG.luhn(n)) return er('Número de cartão inválido.'); if (nm.length < 3) return er('Informe o nome impresso no cartão.');
        const mm = /^(\d{2})\/(\d{2})$/.exec(v); if (!mm || +mm[1] < 1 || +mm[1] > 12 || new Date(2000 + +mm[2], +mm[1], 0, 23, 59) < new Date()) return er('Validade inválida.'); if (!/^\d{3,4}$/.test(cvv)) return er('CVV inválido.');
        const card = { brand: BG.brandOf(n), last4: n.slice(-4) };
        if (n.endsWith('0002')) { return processing(() => { payModal.retry(); }); }
        approve(card);
      };
      payModal.retry = () => { body('<h3>Pagamento recusado</h3><p class="muted" style="margin:.6rem 0 1rem">O banco emissor recusou a transação (simulação). Tente outro cartão ou escolha PIX.</p><button class="btn btn-gold" id="again">Tentar novamente</button>'); $('#again').onclick = () => { keep = true; m.close(); payModal(a); }; };
    }
  }

  /* ---- Conclusão ---- */
  function finish(a) {
    try { sessionStorage.removeItem(DKEY); } catch (e) { }
    renderSteps(); document.querySelectorAll('.step').forEach(x => x.classList.add('done')); $$('.step i').forEach(i => i.textContent = '✓');
    $('#summary').classList.add('hidden');
    $('.layout-book').style.gridTemplateColumns = '1fr';
    $('#stage').innerHTML = '<div class="panel success"><div class="check-big">✓</div><h2 style="font-size:2rem">Agendamento confirmado!</h2><p class="muted" style="margin:.6rem 0 1.4rem">Enviamos a confirmação por e-mail e WhatsApp (simulado). Você receberá um lembrete antes do horário.</p><div style="max-width:440px;margin:0 auto;text-align:left">' + BG.receiptHTML(a) + '</div><div class="card-actions no-print" style="justify-content:center;margin-top:1.4rem"><button class="btn btn-sm" id="print">Imprimir comprovante</button><button class="btn btn-sm" id="ics">Adicionar ao calendário</button><a class="btn btn-sm" href="conta.html">Meus agendamentos</a><a class="btn btn-gold btn-sm" href="index.html">Voltar ao início</a></div></div>';
    $('#print').onclick = () => print();
    $('#ics').onclick = () => { const st = a.date.replace(/-/g, '') + 'T' + a.time.replace(':', '') + '00', en = BG.toTime(BG.toMin(a.time) + a.duration).replace(':', ''); const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'UID:' + a.id + '@barbearia', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART:' + st, 'DTEND:' + a.date.replace(/-/g, '') + 'T' + en + '00', 'SUMMARY:' + a.serviceName + ' — ' + BG.db.config.name, 'LOCATION:' + BG.db.config.address, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); l.download = 'agendamento.ics'; l.click(); };
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    renderSteps(); renderSummary();
    if (S.step === 1 || !S.service) { S.step = 1; step1(); }
    else if (S.step === 2 || !S.barber) { S.step = 2; step2(); }
    else if (S.step === 3 || !(S.date && S.time)) { S.step = 3; step3(); }
    else step4();
    renderSteps();
  }
  render(); BG.footer();
})();
