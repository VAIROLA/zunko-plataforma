/* =====================================================================
   Núcleo do sistema — Barbearia (VERSÃO DEMONSTRATIVA)
   - Banco de dados: localStorage (troque por API/banco real em produção)
   - Pagamento e notificações: SIMULADOS (pontos de integração marcados com [INTEGRAÇÃO])
   ===================================================================== */
(function () {
  'use strict';
  const KEY = 'bg_db_v1', SESSION = 'bg_session_v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseYmd = s => new Date(s + 'T12:00:00');
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const DOW = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const DOW3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fmtDate = s => parseYmd(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtLong = s => parseYmd(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtDT = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const uid = p => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const hash = s => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; s = 'bg$' + s; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
  const stars = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));

  /* ------------------------- Banco de dados ------------------------- */
  let db = null;
  function load() { try { const r = localStorage.getItem(KEY); if (r) { db = JSON.parse(r); return; } } catch (e) { } db = seed(); save(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { } }
  function reload() { try { const r = localStorage.getItem(KEY); if (r) db = JSON.parse(r); } catch (e) { } }
  function reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(SESSION); sessionStorage.clear(); } catch (e) { } db = seed(); save(); }

  function sch(days, start, end, bs, be) { const o = {}; for (let d = 0; d < 7; d++) o[d] = days.includes(d) ? { open: true, start, end, bs, be } : { open: false, start, end, bs, be }; return o; }

  function seed() {
    let s = 20260101; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const D = {
      config: {
        name: 'Black Gold', tagline: 'Barbearia Premium', phone: '(21) 3000-0000', whatsapp: '5521999990000', email: 'contato@blackgold.demo',
        address: 'Av. Roberto Silveira, 1000 — Centro, Maricá/RJ', instagram: '#', facebook: '#',
        hours: { 0: { open: false, start: '09:00', end: '18:00' }, 1: { open: true, start: '09:00', end: '20:00' }, 2: { open: true, start: '09:00', end: '20:00' }, 3: { open: true, start: '09:00', end: '20:00' }, 4: { open: true, start: '09:00', end: '20:00' }, 5: { open: true, start: '09:00', end: '20:00' }, 6: { open: true, start: '08:00', end: '18:00' } },
        minAdvanceHours: 2, maxAdvanceDays: 30, cancelHours: 4, depositPct: 30, allowPayAtShop: true, holdMinutes: 10
      },
      services: [
        { id: 's1', name: 'Corte masculino', desc: 'Corte clássico ou moderno, finalizado com máquina e tesoura, lavagem e styling.', price: 50, duration: 45, img: 'img/servico-corte.svg', popular: true },
        { id: 's2', name: 'Corte degradê (Fade)', desc: 'Degradê preciso — low, mid ou high fade — com acabamento na navalha.', price: 60, duration: 50, img: 'img/servico-degrade.svg', popular: true },
        { id: 's3', name: 'Corte infantil', desc: 'Atendimento paciente e divertido para os pequenos, até 12 anos.', price: 40, duration: 30, img: 'img/servico-infantil.svg', popular: false },
        { id: 's4', name: 'Barba tradicional', desc: 'Toalha quente, óleo aromático, navalha e hidratação para uma barba impecável.', price: 40, duration: 30, img: 'img/servico-barba.svg', popular: true },
        { id: 's5', name: 'Barba desenhada', desc: 'Contornos milimétricos e linhas definidas para quem gosta de barba estilizada.', price: 55, duration: 40, img: 'img/servico-barba-desenhada.svg', popular: false },
        { id: 's6', name: 'Cabelo + barba', desc: 'O combo completo: corte, barba, toalha quente e finalização premium.', price: 90, duration: 80, img: 'img/servico-combo.svg', popular: true },
        { id: 's7', name: 'Pigmentação', desc: 'Pigmentação de cabelo ou barba para disfarçar falhas e realçar o desenho.', price: 80, duration: 60, img: 'img/servico-pigmentacao.svg', popular: false },
        { id: 's8', name: 'Sobrancelha', desc: 'Design de sobrancelha masculino, natural e alinhado ao formato do rosto.', price: 25, duration: 20, img: 'img/servico-sobrancelha.svg', popular: false },
        { id: 's9', name: 'Tratamentos capilares', desc: 'Hidratação, redução de oleosidade e controle de queda com produtos profissionais.', price: 70, duration: 45, img: 'img/servico-tratamento.svg', popular: false }
      ],
      barbers: [
        { id: 'b1', name: 'Carlos Mendes', specialty: 'Barba & Pompadour', exp: 12, img: 'img/barbeiro-carlos.svg', bio: 'Referência em barbas e cortes clássicos, Carlos começou aos 18 anos e já passou por competições nacionais de barbearia. Atende com calma, conversa boa e atenção aos detalhes.', services: ['s1', 's4', 's5', 's6', 's8'], gallery: ['img/galeria-1.svg', 'img/galeria-5.svg', 'img/servico-barba-desenhada.svg'], schedule: sch([2, 3, 4, 5, 6], '09:00', '19:00', '12:00', '13:00'), daysOff: [] },
        { id: 'b2', name: 'Rafael Souza', specialty: 'Degradê & cortes modernos', exp: 8, img: 'img/barbeiro-rafael.svg', bio: 'Especialista em degradês de alta precisão e tendências do momento. Rafael acompanha eventos internacionais e traz o que há de mais moderno para a cadeira.', services: ['s1', 's2', 's3', 's6', 's7', 's8'], gallery: ['img/galeria-6.svg', 'img/galeria-8.svg', 'img/servico-degrade.svg'], schedule: sch([1, 2, 3, 4, 5], '10:00', '20:00', '13:00', '14:00'), daysOff: [] },
        { id: 'b3', name: 'Diego Almeida', specialty: 'Cabelos cacheados e crespos', exp: 6, img: 'img/barbeiro-diego.svg', bio: 'Diego é o especialista da casa em cabelos cacheados, crespos e tratamentos capilares. Cuida do corte, da textura e da saúde do fio com produtos profissionais.', services: ['s1', 's2', 's4', 's7', 's9'], gallery: ['img/galeria-3.svg', 'img/galeria-2.svg', 'img/servico-tratamento.svg'], schedule: sch([1, 2, 3, 4, 5, 6], '09:00', '18:00', '12:00', '13:00'), daysOff: [] },
        { id: 'b4', name: 'Lucas Ferreira', specialty: 'Clássicos & atendimento infantil', exp: 5, img: 'img/barbeiro-lucas.svg', bio: 'Cortes clássicos, tesoura e navalha. Lucas é queridinho dos pais pela paciência e pelo jeito divertido com as crianças.', services: ['s1', 's3', 's4', 's6', 's8'], gallery: ['img/galeria-7.svg', 'img/galeria-4.svg', 'img/servico-infantil.svg'], schedule: sch([3, 4, 5, 6], '10:00', '19:00', '13:00', '14:00'), daysOff: [] }
      ],
      users: [], appointments: [], blocks: [], transactions: [], notifications: [], reviews: [], resets: []
    };
    const U = (name, email, phone, pass, role, extra) => D.users.push(Object.assign({ id: uid('u'), name, email, phone, pass: hash(pass), role, marketing: true, createdAt: new Date().toISOString() }, extra || {}));
    U('Proprietário Demo', 'admin@blackgold.demo', '(21) 99999-0001', 'admin123', 'admin');
    [['b1', 'carlos'], ['b2', 'rafael'], ['b3', 'diego'], ['b4', 'lucas']].forEach(([bid, n]) => { const b = D.barbers.find(x => x.id === bid); U(b.name, n + '@blackgold.demo', '(21) 99999-01' + bid.slice(1) + '0', 'barbeiro123', 'barber', { barberId: bid }); });
    U('Cliente Demo', 'cliente@demo.com', '(21) 98888-0000', 'cliente123', 'client');
    ['João Pedro Silva', 'Marcos Vinícius', 'André Luiz Costa', 'Felipe Santos', 'Bruno Oliveira', 'Thiago Rocha', 'Gustavo Lima', 'Pedro Henrique'].forEach((n, i) => U(n, 'cliente' + (i + 1) + '@exemplo.com', '(21) 97' + (100 + i * 7) + '-' + (1000 + i * 131), 'cliente123', 'client'));
    const clients = D.users.filter(u => u.role === 'client');

    // Avaliações
    const rv = [['b1', 'João Pedro', 5, 'Melhor barba que já fiz. Atendimento impecável e ambiente muito agradável.'], ['b1', 'Marcos V.', 5, 'O Carlos é um artista. Saí de lá outro homem.'], ['b1', 'André Costa', 4, 'Excelente trabalho, só precisei esperar uns minutos.'], ['b2', 'Felipe S.', 5, 'Degradê perfeito, do jeito que pedi. Voltarei sempre.'], ['b2', 'Bruno O.', 5, 'Rafael entende de tendência e acerta em cheio.'], ['b2', 'Gustavo L.', 5, 'Pontualidade e capricho. Recomendo!'], ['b2', 'Pedro H.', 4, 'Corte ótimo, ambiente top.'], ['b3', 'Thiago R.', 5, 'Finalmente achei quem entende de cabelo cacheado.'], ['b3', 'Marcos V.', 5, 'Tratamento capilar muito bom, cabelo renovado.'], ['b3', 'João Pedro', 4, 'Gostei bastante do resultado.'], ['b4', 'André Costa', 5, 'Levei meu filho e ele adorou. Super paciente!'], ['b4', 'Bruno O.', 5, 'Corte clássico impecável com navalha.'], ['b4', 'Felipe S.', 4, 'Atendimento muito educado.']];
    rv.forEach(r => D.reviews.push({ id: uid('r'), barberId: r[0], clientName: r[1], rating: r[2], text: r[3], date: ymd(addDays(new Date(), -Math.floor(rnd() * 60))) }));

    // Agendamentos (histórico + futuros)
    const now = new Date(); const today = ymd(now); const tmpDb = db; db = D;
    for (let off = -35; off <= 10; off++) {
      const date = ymd(addDays(now, off));
      D.barbers.forEach(b => {
        const n = off < 0 ? 2 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) {
          const sid = pick(b.services); const svc = D.services.find(x => x.id === sid);
          const free = barberSlots(b.id, date, svc.duration, { ignoreLimits: true });
          if (!free.length) continue;
          const time = pick(free); const c = pick(clients);
          const a = { id: uid('a'), clientId: c.id, clientName: c.name, clientPhone: c.phone, serviceId: svc.id, serviceName: svc.name, barberId: b.id, date, time, duration: svc.duration, price: svc.price, status: 'confirmado', createdAt: new Date(addDays(now, off - 2)).toISOString(), payment: { mode: 'presencial', method: 'presencial', paid: 0, status: 'pendente', txIds: [] } };
          const isPast = date < today || (date === today && toMin(time) + svc.duration < now.getHours() * 60 + now.getMinutes());
          if (isPast) {
            if (rnd() < 0.08) { a.status = 'cancelado'; }
            else {
              a.status = 'concluido'; const m = rnd(); const method = m < .45 ? 'pix' : m < .7 ? 'credito' : m < .85 ? 'debito' : 'presencial';
              a.payment = { mode: method === 'presencial' ? 'presencial' : 'integral', method, paid: svc.price, status: 'pago', txIds: [] };
              const t = { id: uid('t'), apptId: a.id, clientName: c.name, type: 'pagamento', method, amount: svc.price, date: new Date(date + 'T' + time + ':00').toISOString(), status: 'aprovado', desc: svc.name }; D.transactions.push(t); a.payment.txIds.push(t.id);
            }
          } else if (rnd() < 0.6) {
            const method = pick(['pix', 'credito', 'debito']); const dep = rnd() < .5; const amt = dep ? Math.round(svc.price * D.config.depositPct) / 100 : svc.price;
            a.payment = { mode: dep ? 'sinal' : 'integral', method, paid: amt, status: dep ? 'parcial' : 'pago', txIds: [] };
            const t = { id: uid('t'), apptId: a.id, clientName: c.name, type: 'pagamento', method, amount: amt, date: a.createdAt, status: 'aprovado', desc: svc.name + (dep ? ' (sinal)' : '') }; D.transactions.push(t); a.payment.txIds.push(t.id);
          }
          D.appointments.push(a);
        }
      });
    }
    db = tmpDb;
    return D;
  }

  /* ------------------------- Consultas ------------------------- */
  const getService = id => db.services.find(s => s.id === id);
  const getBarber = id => db.barbers.find(b => b.id === id);
  const getUser = id => db.users.find(u => u.id === id);
  const barberReviews = id => db.reviews.filter(r => r.barberId === id);
  const barberRating = id => { const r = barberReviews(id); return r.length ? r.reduce((a, x) => a + x.rating, 0) / r.length : 0; };
  const serviceCount = id => db.appointments.filter(a => a.serviceId === id && a.status !== 'cancelado').length;
  const popularServices = () => db.services.slice().sort((a, b) => serviceCount(b.id) - serviceCount(a.id));

  /* ------------------------- Motor de agenda ------------------------- */
  function isBusy(a) { return a.status === 'confirmado' || a.status === 'concluido' || (a.status === 'pendente' && a.holdUntil && a.holdUntil > Date.now()); }
  function barberSlots(barberId, date, duration, opts) {
    opts = opts || {}; const b = getBarber(barberId); if (!b) return [];
    const dow = parseYmd(date).getDay(); const bs = b.schedule[dow]; const shop = db.config.hours[dow];
    if (!bs || !bs.open || !shop || !shop.open) return [];
    if ((b.daysOff || []).includes(date)) return [];
    const start = Math.max(toMin(bs.start), toMin(shop.start)), end = Math.min(toMin(bs.end), toMin(shop.end));
    const busy = db.appointments.filter(a => a.barberId === barberId && a.date === date && isBusy(a) && a.id !== opts.ignoreId).map(a => [toMin(a.time), toMin(a.time) + a.duration]);
    db.blocks.filter(k => k.barberId === barberId && k.date === date).forEach(k => busy.push([toMin(k.start), toMin(k.end)]));
    if (bs.bs && bs.be) busy.push([toMin(bs.bs), toMin(bs.be)]);
    const now = Date.now(), minTs = now + db.config.minAdvanceHours * 3600e3, maxTs = now + db.config.maxAdvanceDays * 86400e3;
    const out = [];
    for (let t = start; t + duration <= end; t += 30) {
      if (busy.some(([x, y]) => t < y && t + duration > x)) continue;
      if (!opts.ignoreLimits) { const ts = new Date(date + 'T' + toTime(t) + ':00').getTime(); if (ts < minTs || ts > maxTs) continue; }
      out.push(toTime(t));
    }
    return out;
  }
  function slotsFor(serviceId, barberId, date) {
    const s = getService(serviceId); if (!s) return [];
    if (barberId && barberId !== 'any') return barberSlots(barberId, date, s.duration).map(t => ({ time: t, barberId }));
    const map = {};
    db.barbers.filter(b => b.services.includes(serviceId)).forEach(b => barberSlots(b.id, date, s.duration).forEach(t => { (map[t] = map[t] || []).push(b.id); }));
    return Object.keys(map).sort().map(t => ({ time: t, barberId: 'any', options: map[t] }));
  }
  function dayHasSlots(serviceId, barberId, date) { return slotsFor(serviceId, barberId, date).length > 0; }

  function createAppointment(p) {
    reload();
    const svc = getService(p.serviceId); if (!svc) throw new Error('Serviço inválido.');
    let barberId = p.barberId;
    if (!barberId || barberId === 'any') {
      const cands = db.barbers.filter(b => b.services.includes(svc.id) && barberSlots(b.id, p.date, svc.duration).includes(p.time));
      if (!cands.length) throw new Error('Esse horário acabou de ser reservado. Escolha outro.');
      cands.sort((x, y) => db.appointments.filter(a => a.barberId === x.id && a.date === p.date && isBusy(a)).length - db.appointments.filter(a => a.barberId === y.id && a.date === p.date && isBusy(a)).length);
      barberId = cands[0].id;
    } else {
      if (!getBarber(barberId).services.includes(svc.id)) throw new Error('Este barbeiro não realiza esse serviço.');
      if (!barberSlots(barberId, p.date, svc.duration).includes(p.time)) throw new Error('Esse horário acabou de ser reservado. Escolha outro.');
    }
    const c = getUser(p.clientId);
    const a = { id: uid('a'), clientId: c.id, clientName: c.name, clientPhone: c.phone, serviceId: svc.id, serviceName: svc.name, barberId, date: p.date, time: p.time, duration: svc.duration, price: svc.price, status: 'pendente', holdUntil: Date.now() + db.config.holdMinutes * 60000, createdAt: new Date().toISOString(), payment: { mode: p.mode || 'presencial', method: p.method || 'presencial', paid: 0, status: 'pendente', txIds: [] } };
    db.appointments.push(a); save(); return a;
  }
  function releaseHold(id) { reload(); const a = db.appointments.find(x => x.id === id); if (a && a.status === 'pendente') { a.status = 'cancelado'; a.cancelReason = 'Pagamento não concluído'; save(); } }
  const canCancel = a => (new Date(a.date + 'T' + a.time + ':00').getTime() - Date.now()) >= db.config.cancelHours * 3600e3;
  function apptStart(a) { return new Date(a.date + 'T' + a.time + ':00').getTime(); }

  /* ------------------------- Pagamento (SIMULADO) ------------------------- */
  // [INTEGRAÇÃO] Em produção: criar a cobrança no Mercado Pago (Checkout Transparente / Bricks) no servidor
  // e confirmar via webhook. Dados de cartão nunca passam pelo site: apenas o token do gateway.
  function amountFor(svc, mode) { return mode === 'integral' ? svc.price : mode === 'sinal' ? Math.round(svc.price * db.config.depositPct) / 100 : 0; }
  function brandOf(n) { n = n.replace(/\D/g, ''); return /^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n) ? 'Elo' : 'Cartão'; }
  function luhn(n) { n = n.replace(/\D/g, ''); if (n.length < 13) return false; let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; }
  function addTx(a, type, method, amount, desc) { const t = { id: uid('t'), apptId: a.id, clientName: a.clientName, type, method, amount, date: new Date().toISOString(), status: 'aprovado', desc: desc || a.serviceName }; db.transactions.push(t); a.payment.txIds.push(t.id); return t; }
  function confirmPayment(apptId, p) {
    reload(); const a = db.appointments.find(x => x.id === apptId); if (!a) throw new Error('Agendamento não encontrado.');
    if (a.status === 'cancelado') throw new Error('Reserva expirada. Faça um novo agendamento.');
    if (p.mode === 'presencial') { a.payment = { mode: 'presencial', method: 'presencial', paid: 0, status: 'pendente', txIds: [] }; }
    else { const amt = amountFor(a, p.mode) || (p.mode === 'integral' ? a.price : Math.round(a.price * db.config.depositPct) / 100); a.payment = { mode: p.mode, method: p.method, paid: amt, status: p.mode === 'integral' ? 'pago' : 'parcial', txIds: [], card: p.card || null }; addTx(a, 'pagamento', p.method, amt, a.serviceName + (p.mode === 'sinal' ? ' (sinal)' : '')); }
    a.status = 'confirmado'; delete a.holdUntil; save();
    notifyAppt(a, 'booked'); if (a.payment.paid > 0) notifyAppt(a, 'paid');
    return a;
  }
  function completeAppointment(id) {
    reload(); const a = db.appointments.find(x => x.id === id); if (!a) return;
    const rest = Math.round((a.price - a.payment.paid) * 100) / 100;
    if (rest > 0.001 && a.payment.status !== 'estornado') { addTx(a, 'pagamento', 'presencial', rest, a.serviceName + ' (no local)'); a.payment.paid = a.price; a.payment.status = 'pago'; if (a.payment.method === 'presencial' || !a.payment.method) a.payment.method = 'presencial'; }
    a.status = 'concluido'; save();
  }
  function refund(id) {
    reload(); const a = db.appointments.find(x => x.id === id); if (!a || a.payment.paid <= 0 || a.payment.status === 'estornado') return false;
    addTx(a, 'estorno', a.payment.method, -a.payment.paid, 'Estorno — ' + a.serviceName); a.payment.status = 'estornado'; a.payment.refunded = a.payment.paid; if (a.status !== 'concluido') a.status = 'cancelado'; save(); notifyAppt(a, 'refund'); return true;
  }
  function cancelAppointment(id, by) {
    reload(); const a = db.appointments.find(x => x.id === id); if (!a) return;
    a.status = 'cancelado'; a.cancelReason = by === 'client' ? 'Cancelado pelo cliente' : 'Cancelado pela barbearia'; a.cancelledAt = new Date().toISOString();
    if (a.payment.paid > 0 && a.payment.status !== 'estornado' && (by !== 'client' || canCancel({ date: a.date, time: a.time }) ) ) { addTx(a, 'estorno', a.payment.method, -a.payment.paid, 'Estorno — ' + a.serviceName); a.payment.status = 'estornado'; a.payment.refunded = a.payment.paid; }
    save(); notifyAppt(a, 'cancel');
  }
  function rescheduleAppointment(id, date, time, barberId) {
    reload(); const a = db.appointments.find(x => x.id === id); if (!a) throw new Error('Agendamento não encontrado.');
    const bid = barberId || a.barberId; if (!barberSlots(bid, date, a.duration, { ignoreLimits: true, ignoreId: id }).includes(time)) throw new Error('Horário indisponível para este barbeiro.');
    a.date = date; a.time = time; a.barberId = bid; delete a.changeRequest; a.reminderSent = false; save(); notifyAppt(a, 'reschedule');
  }

  /* ------------------------- Notificações (SIMULADAS) ------------------------- */
  // [INTEGRAÇÃO] Em produção: enviar por e-mail (Resend, SendGrid, SES) e WhatsApp (API oficial / Twilio / Z-API)
  // a partir do servidor. Aqui, cada mensagem é registrada na "caixa de saída" e visível no Painel > Notificações.
  const TPL = {
    signup: u => ['Bem-vindo à ' + db.config.name + '!', 'Olá, ' + u.name.split(' ')[0] + '! Seu cadastro foi concluído. Agora você pode agendar seus horários online.'],
    booked: a => ['Agendamento confirmado ✔', 'Olá, ' + a.clientName.split(' ')[0] + '! ' + a.serviceName + ' com ' + (getBarber(a.barberId) || {}).name + ' em ' + fmtDate(a.date) + ' às ' + a.time + '.'],
    paid: a => ['Pagamento confirmado', 'Recebemos ' + money(a.payment.paid) + ' (' + a.payment.method.toUpperCase() + ') referente a ' + a.serviceName + '. O comprovante está na sua conta.'],
    reminder: a => ['Lembrete: seu horário é amanhã/hoje', 'Não esqueça: ' + a.serviceName + ' às ' + a.time + ' do dia ' + fmtDate(a.date) + ' com ' + (getBarber(a.barberId) || {}).name + '.'],
    cancel: a => ['Agendamento cancelado', 'O agendamento de ' + a.serviceName + ' em ' + fmtDate(a.date) + ' às ' + a.time + ' foi cancelado.'],
    reschedule: a => ['Horário alterado', 'Seu agendamento foi alterado para ' + fmtDate(a.date) + ' às ' + a.time + ' com ' + (getBarber(a.barberId) || {}).name + '.'],
    refund: a => ['Estorno solicitado', 'O estorno de ' + money(a.payment.refunded || 0) + ' foi solicitado e será creditado conforme o prazo do meio de pagamento.']
  };
  function pushNote(channel, to, subject, body, userId, kind) { db.notifications.unshift({ id: uid('n'), channel, to, subject, body, userId: userId || null, kind: kind || '', date: new Date().toISOString() }); db.notifications = db.notifications.slice(0, 300); }
  function notifyUser(u, kind) { const [s, b] = TPL[kind](u); pushNote('email', u.email, s, b, u.id, kind); pushNote('whatsapp', u.phone, s, b, u.id, kind); save(); toast('📧 E-mail e WhatsApp enviados', 'simulado — ' + s, 'ok'); }
  function notifyAppt(a, kind) { const u = getUser(a.clientId); if (!u) return; const [s, b] = TPL[kind](a); pushNote('email', u.email, s, b, u.id, kind); pushNote('whatsapp', u.phone, s, b, u.id, kind); save(); if (kind !== 'paid') toast('📧 E-mail e WhatsApp enviados', 'simulado — ' + s, 'ok'); }
  function runReminders() {
    reload(); let changed = false; const now = Date.now();
    db.appointments.forEach(a => { if (a.status === 'confirmado' && !a.reminderSent) { const t = apptStart(a) - now; if (t > 0 && t <= 24 * 3600e3) { const u = getUser(a.clientId); if (u) { const [s, b] = TPL.reminder(a); pushNote('email', u.email, s, b, u.id, 'reminder'); pushNote('whatsapp', u.phone, s, b, u.id, 'reminder'); } a.reminderSent = true; changed = true; } } });
    if (changed) save();
  }

  /* ------------------------- Autenticação ------------------------- */
  const session = () => { try { return localStorage.getItem(SESSION); } catch (e) { return null; } };
  function current() { reload(); const id = session(); return id ? getUser(id) || null : null; }
  function login(email, pass) { reload(); const u = db.users.find(x => x.email.toLowerCase() === String(email).trim().toLowerCase()); if (!u || u.pass !== hash(pass)) throw new Error('E-mail ou senha incorretos.'); try { localStorage.setItem(SESSION, u.id); } catch (e) { } return u; }
  function logout() { try { localStorage.removeItem(SESSION); } catch (e) { } }
  function register(d) {
    reload(); const email = String(d.email).trim().toLowerCase();
    if (!d.name || d.name.trim().split(/\s+/).length < 2) throw new Error('Informe seu nome completo.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('E-mail inválido.');
    if (String(d.phone).replace(/\D/g, '').length < 10) throw new Error('Informe um telefone/WhatsApp válido com DDD.');
    if (!d.pass || d.pass.length < 6) throw new Error('A senha deve ter ao menos 6 caracteres.');
    if (db.users.some(u => u.email === email)) throw new Error('Este e-mail já está cadastrado.');
    const u = { id: uid('u'), name: d.name.trim(), email, phone: d.phone.trim(), pass: hash(d.pass), role: 'client', marketing: !!d.marketing, createdAt: new Date().toISOString() };
    db.users.push(u); save(); try { localStorage.setItem(SESSION, u.id); } catch (e) { } notifyUser(u, 'signup'); return u;
  }
  function updateProfile(id, d) { reload(); const u = getUser(id); if (!d.name || d.name.trim().split(/\s+/).length < 2) throw new Error('Informe seu nome completo.'); if (String(d.phone).replace(/\D/g, '').length < 10) throw new Error('Telefone inválido.'); const em = String(d.email).trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) throw new Error('E-mail inválido.'); if (db.users.some(x => x.email === em && x.id !== id)) throw new Error('E-mail já utilizado por outra conta.'); Object.assign(u, { name: d.name.trim(), phone: d.phone.trim(), email: em, marketing: !!d.marketing }); db.appointments.filter(a => a.clientId === id).forEach(a => { a.clientName = u.name; a.clientPhone = u.phone; }); save(); return u; }
  function changePassword(id, oldP, newP) { reload(); const u = getUser(id); if (u.pass !== hash(oldP)) throw new Error('Senha atual incorreta.'); if (newP.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres.'); u.pass = hash(newP); save(); }
  function resetRequest(email) { reload(); const u = db.users.find(x => x.email === String(email).trim().toLowerCase()); if (!u) throw new Error('Não encontramos esse e-mail.'); const code = String(Math.floor(100000 + Math.random() * 900000)); db.resets = db.resets.filter(r => r.userId !== u.id); db.resets.push({ userId: u.id, code, exp: Date.now() + 15 * 60000 }); pushNote('email', u.email, 'Recuperação de senha', 'Seu código de recuperação é ' + code + '. Ele expira em 15 minutos.', u.id, 'reset'); save(); return code; }
  function resetConfirm(email, code, newP) { reload(); const u = db.users.find(x => x.email === String(email).trim().toLowerCase()); const r = u && db.resets.find(x => x.userId === u.id); if (!r || r.code !== code.trim() || r.exp < Date.now()) throw new Error('Código inválido ou expirado.'); if (newP.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres.'); u.pass = hash(newP); db.resets = db.resets.filter(x => x !== r); save(); }
  function requireRole(roles, redirect) { const u = current(); if (!u || !roles.includes(u.role)) { location.href = (redirect || 'conta.html') + '?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return null; } return u; }

  /* ------------------------- Interface comum ------------------------- */
  function toast(title, sub, type) {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.innerHTML = '<b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : ''); box.appendChild(t);
    setTimeout(() => { t.style.transition = '.4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 4200);
  }
  function modal(html, cls, onClose) {
    const bg = document.createElement('div'); bg.className = 'modal-bg ' + (cls && cls.includes('lightbox') ? 'lightbox' : '');
    bg.innerHTML = '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true"><button class="x" aria-label="Fechar">&times;</button>' + html + '</div>';
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc_); if (onClose) onClose(); };
    const esc_ = e => { if (e.key === 'Escape') close(); };
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(); }); $('.x', bg).onclick = close; document.addEventListener('keydown', esc_);
    document.body.appendChild(bg); return { el: $('.modal', bg), close };
  }
  function confirmBox(msg, okLabel) {
    return new Promise(res => { const m = modal('<h3>Confirmação</h3><p style="margin-bottom:1.4rem;color:#cfcbc2">' + msg + '</p><div class="card-actions" style="justify-content:flex-end"><button class="btn" data-n>Voltar</button><button class="btn btn-gold" data-y>' + esc(okLabel || 'Confirmar') + '</button></div>', 'narrow', () => res(false)); $('[data-n]', m.el).onclick = () => { m.close(); }; $('[data-y]', m.el).onclick = () => { res(true); m.el.parentNode.remove(); }; });
  }
  function csv(name, rows) { const body = rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

  function header(active) {
    const u = current(); const c = db.config;
    const staff = u && (u.role === 'admin' || u.role === 'barber');
    const el = document.createElement('header'); el.className = 'header' + (active !== 'home' ? ' always' : ''); el.id = 'hdr';
    el.innerHTML = '<div class="container"><a class="brand" href="index.html" aria-label="' + esc(c.name) + '"><img src="img/logo.svg" alt="" width="46" height="46"><span><b>' + esc(c.name.toUpperCase()) + '</b><small>' + esc(c.tagline) + '</small></span></a>' +
      '<button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<nav class="nav" id="nav"><a href="index.html"' + (active === 'home' ? ' class="active"' : '') + '>Início</a><a href="index.html#servicos">Serviços</a><a href="index.html#barbeiros">Barbeiros</a>' +
      '<a href="conta.html"' + (active === 'conta' ? ' class="active"' : '') + '>' + (u ? 'Olá, ' + esc(u.name.split(' ')[0]) : 'Minha conta') + '</a>' +
      (staff ? '<a href="painel.html"' + (active === 'painel' ? ' class="active"' : '') + '>Painel</a>' : '') +
      '<a class="btn btn-gold btn-sm" href="agendar.html">Agendar horário</a></nav></div>';
    document.body.prepend(el);
    const nav = $('#nav', el), bg = $('.burger', el);
    bg.onclick = () => { const o = nav.classList.toggle('open'); bg.setAttribute('aria-expanded', o); };
    $$('a', nav).forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    if (active === 'home') { const f = () => el.classList.toggle('solid', scrollY > 40); addEventListener('scroll', f, { passive: true }); f(); }
  }
  function policy(kind) {
    const c = db.config, P = {
      privacidade: ['Política de privacidade', '<p>Em conformidade com a <b>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</b>, coletamos apenas os dados necessários para prestar nossos serviços: nome, e-mail, telefone/WhatsApp e histórico de agendamentos.</p><h4>Finalidade</h4><p>Seus dados são usados para identificar você, gerenciar agendamentos, enviar confirmações e lembretes e, com seu consentimento, comunicar promoções.</p><h4>Pagamentos</h4><p>Não armazenamos números de cartão. O processamento é feito por gateway de pagamento certificado (PCI-DSS).</p><h4>Seus direitos</h4><p>Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento pelo e-mail ' + esc(c.email) + '. Também pode revogar o consentimento de marketing em Minha conta.</p>'],
      termos: ['Termos de uso', '<p>Ao utilizar este site, você concorda com os termos abaixo.</p><h4>Conta</h4><p>Você é responsável pelas informações fornecidas e pela segurança da sua senha.</p><h4>Agendamentos</h4><p>Os horários são reservados mediante confirmação. A barbearia pode remarcar em casos de força maior, avisando com antecedência.</p><h4>Atrasos</h4><p>Toleramos até 10 minutos de atraso. Após esse prazo, o horário poderá ser cedido.</p><h4>Conteúdo</h4><p>Imagens, marca e textos pertencem à barbearia e não podem ser reproduzidos sem autorização.</p>'],
      cancelamento: ['Política de cancelamento', '<p>Você pode cancelar ou solicitar alteração pelo próprio site, em <b>Minha conta</b>.</p><h4>Cancelamento gratuito</h4><p>Até <b>' + c.cancelHours + ' horas</b> antes do horário agendado, com estorno integral de valores já pagos (prazo conforme o meio de pagamento).</p><h4>Fora do prazo</h4><p>Com menos de ' + c.cancelHours + ' horas de antecedência, o cancelamento online não é liberado e o sinal pago não é reembolsado. Entre em contato pelo WhatsApp para solicitar uma alteração.</p><h4>Não comparecimento</h4><p>O não comparecimento sem aviso implica perda do sinal.</p>']
    }[kind];
    modal('<h3>' + P[0] + '</h3><div class="legal">' + P[1] + '</div>');
  }
  function footer() {
    const c = db.config; const h = c.hours;
    const f = document.createElement('footer'); f.className = 'footer';
    f.innerHTML = '<div class="container"><div class="fgrid"><div><a class="brand" href="index.html"><img src="img/logo.svg" alt="" width="46" height="46"><span><b>' + esc(c.name.toUpperCase()) + '</b><small>' + esc(c.tagline) + '</small></span></a><p class="muted" style="margin-top:1rem;font-size:.9rem">Estilo, tradição e atendimento premium para o homem moderno.</p><div class="social"><a href="' + esc(c.instagram) + '" aria-label="Instagram">IG</a><a href="' + esc(c.facebook) + '" aria-label="Facebook">FB</a><a href="https://wa.me/' + esc(c.whatsapp) + '" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a></div></div>' +
      '<div><h4>Contato</h4><ul><li>' + esc(c.address) + '</li><li>' + esc(c.phone) + '</li><li><a href="https://wa.me/' + esc(c.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a></li><li>' + esc(c.email) + '</li></ul></div>' +
      '<div><h4>Horários</h4><ul>' + [1, 2, 3, 4, 5, 6, 0].map(d => '<li>' + DOW3[d] + ': ' + (h[d].open ? h[d].start + ' – ' + h[d].end : 'Fechado') + '</li>').join('') + '</ul></div>' +
      '<div><h4>Informações</h4><ul><li><a href="agendar.html">Agendar horário</a></li><li><a href="conta.html">Minha conta</a></li><li><a data-pol="privacidade">Política de privacidade</a></li><li><a data-pol="termos">Termos de uso</a></li><li><a data-pol="cancelamento">Política de cancelamento</a></li></ul></div></div>' +
      '<div class="copy">© ' + new Date().getFullYear() + ' ' + esc(c.name) + ' — Todos os direitos reservados.</div></div>';
    document.body.appendChild(f);
    $$('[data-pol]', f).forEach(a => a.onclick = e => { e.preventDefault(); policy(a.dataset.pol); });
    const w = document.createElement('a'); w.className = 'wapp'; w.href = 'https://wa.me/' + c.whatsapp; w.target = '_blank'; w.rel = 'noopener'; w.setAttribute('aria-label', 'WhatsApp'); w.style.bottom = '48px'; w.textContent = 'WA'; document.body.appendChild(w);
    const d = document.createElement('div'); d.className = 'demo-banner'; d.innerHTML = '<b>Versão demonstrativa</b> — dados salvos apenas neste navegador · pagamentos e notificações simulados · <a href="#" id="resetDemo">restaurar dados de exemplo</a>'; document.body.appendChild(d);
    $('#resetDemo', d).onclick = async e => { e.preventDefault(); if (await confirmBox('Restaurar todos os dados de exemplo? Cadastros e agendamentos feitos serão apagados.', 'Restaurar')) { reset(); location.href = 'index.html'; } };
  }
  function reveal() { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { threshold: .12 }); $$('.reveal').forEach(el => io.observe(el)); }
  function seo(title, desc) { document.title = title; let m = $('meta[name=description]'); if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); } m.content = desc; }

  // Cartão de comprovante
  function receiptHTML(a) {
    const c = db.config, b = getBarber(a.barberId), tx = a.payment.txIds.map(id => db.transactions.find(t => t.id === id)).filter(Boolean);
    return '<div class="receipt" id="receipt"><h4>' + esc(c.name.toUpperCase()) + '</h4><p style="text-align:center;font-size:.78rem;color:#6b6659;margin-bottom:.8rem">Comprovante de agendamento / pagamento — DEMONSTRAÇÃO<br>' + esc(c.address) + '</p>' +
      '<div class="line"><span>Protocolo</span><b>' + a.id.slice(2, 10).toUpperCase() + '</b></div><div class="line"><span>Cliente</span><b>' + esc(a.clientName) + '</b></div><div class="line"><span>Serviço</span><b>' + esc(a.serviceName) + '</b></div><div class="line"><span>Barbeiro</span><b>' + esc(b ? b.name : '-') + '</b></div><div class="line"><span>Data e hora</span><b>' + fmtDate(a.date) + ' às ' + a.time + '</b></div><div class="line"><span>Valor do serviço</span><b>' + money(a.price) + '</b></div>' +
      tx.map(t => '<div class="line"><span>' + (t.type === 'estorno' ? 'Estorno' : 'Pago') + ' · ' + esc(t.method.toUpperCase()) + ' · ' + fmtDT(t.date) + '</span><b>' + money(t.amount) + '</b></div>').join('') +
      '<div class="line tot"><span style="color:#1a1a1a">Saldo a pagar no local</span><b>' + money(Math.max(0, a.price - (a.payment.status === 'estornado' ? 0 : a.payment.paid))) + '</b></div></div>';
  }

  /* ------------------------- Inicialização ------------------------- */
  load(); runReminders();
  window.BG = { $, $$, esc, money, ymd, parseYmd, toMin, toTime, addDays, DOW, DOW3, fmtDate, fmtLong, fmtDT, uid, stars, hash,
    get db() { return db; }, save, reload, reset, getService, getBarber, getUser, barberReviews, barberRating, serviceCount, popularServices,
    barberSlots, slotsFor, dayHasSlots, createAppointment, releaseHold, canCancel, apptStart, amountFor, brandOf, luhn, confirmPayment, completeAppointment, refund, cancelAppointment, rescheduleAppointment,
    notifyUser, notifyAppt, pushNote, current, login, logout, register, updateProfile, changePassword, resetRequest, resetConfirm, requireRole,
    toast, modal, confirmBox, csv, header, footer, policy, reveal, seo, receiptHTML, sch };
})();
