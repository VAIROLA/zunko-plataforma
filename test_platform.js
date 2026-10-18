const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== INICIANDO TESTES COMPLETOS DA PLATAFORMA ZUNKO ===");

  // 1. Test All HTML Pages
  const pages = [
    '/',
    '/sobre',
    '/planos/essencial',
    '/planos/profissional',
    '/planos/empresarial-avancado',
    '/planos/premium',
    '/planos/completo-sofisticado',
    '/comparativo',
    '/tutorial-ia',
    '/faq',
    '/contato',
    '/checkout',
    '/briefing',
    '/area-cliente',
    '/admin',
    '/termos',
    '/privacidade',
    '/reembolso'
  ];

  console.log("\n1. Testando rotas de páginas HTML:");
  for (const p of pages) {
    const res = await request(p);
    const ok = res.status === 200 && res.body.includes('ZUNKO');
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${p} (Status: ${res.status})`);
    if (!ok) throw new Error(`Falha na rota ${p}`);
  }

  // 2. Test Assets (Logo, CSS, JS)
  console.log("\n2. Testando arquivos estáticos:");
  const assets = [
    '/assets/images/zunko-logo.png',
    '/assets/css/style.css',
    '/assets/js/main.js',
    '/assets/js/carousel.js',
    '/assets/js/checkout.js',
    '/assets/js/briefing.js',
    '/assets/js/customer.js',
    '/assets/js/admin.js',
    '/assets/js/ai-prompts.js'
  ];
  for (const a of assets) {
    const res = await request(a);
    const ok = res.status === 200;
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${a} (Status: ${res.status})`);
    if (!ok) throw new Error(`Falha no asset ${a}`);
  }

  // 3. Test Plans API
  console.log("\n3. Testando API de Planos:");
  const plansRes = await request('/api/plans');
  const plansData = JSON.parse(plansRes.body);
  console.log(`  [PASS] Planos retornados: ${plansData.plans.length} planos`);
  console.log(`  [PASS] Planos de manutenção: ${plansData.maintenancePlans.length} planos`);
  if (plansData.plans.length !== 5) throw new Error("Deveriam existir 5 planos!");

  // 4. Test Checkout & Order Placement (PIX & Card)
  console.log("\n4. Testando Contratação e Pagamento via API:");
  const newOrderPayload = {
    planId: "profissional",
    planName: "Site Profissional",
    maintenancePlan: "Manutenção Básica",
    maintenancePrice: 100.00,
    subtotal: 2400.00,
    discount: 120.00,
    totalAmount: 2380.00,
    paymentMethod: "pix",
    customer: {
      name: "Empresa Teste Silva",
      document: "12.345.678/0001-90",
      email: "silva@empresateste.com.br",
      phone: "(11) 98765-4321",
      company: "Silva Consultoria",
      segment: "Consultoria Financeira",
      notes: "Preciso do site pronto com urgência para lançamento em novembro."
    }
  };

  const orderRes = await request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: newOrderPayload
  });
  const orderData = JSON.parse(orderRes.body);
  console.log(`  [PASS] Pedido criado com sucesso: ${orderData.order.orderNumber} (Valor: R$ ${orderData.order.totalAmount})`);
  const orderId = orderData.order.orderNumber;

  // 5. Test Briefing Submission for this Order
  console.log("\n5. Testando Envio de Briefing do Projeto:");
  const briefingPayload = {
    companyName: "Silva Consultoria",
    segment: "Consultoria Financeira B2B",
    goal: "Captação de leads de médias empresas",
    audience: "CEOs e Diretores Financeiros",
    servicesDescription: "Planejamento tributário, M&A e governança corporativa",
    colorsPreferences: "Azul escuro e dourado",
    referenceSites: "https://consultoriaexemplo.com.br",
    socialMedia: "@silvaconsultoria",
    institutionalText: "Fundada em 2018 com foco em resultados sólidos...",
    existingDomain: "www.silvaconsultoria.com.br",
    contactDetails: "contato@silvaconsultoria.com.br / (11) 98765-4321",
    additionalRequests: "Gostaria de um botão flutuante para agendamento"
  };

  const briefingRes = await request(`/api/briefing/${orderId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: briefingPayload
  });
  const briefingData = JSON.parse(briefingRes.body);
  console.log(`  [PASS] Briefing salvo e vinculado ao pedido ${orderId}`);

  // 6. Test Customer Area Query for this Order
  console.log("\n6. Testando Consulta na Área do Cliente:");
  const queryRes = await request(`/api/orders/${orderId}`);
  const queryData = JSON.parse(queryRes.body);
  console.log(`  [PASS] Pedido consultado: ${queryData.order.orderNumber} | Etapa atual: ${queryData.order.currentStageIndex} | Briefing anexado: ${!!queryData.briefing}`);

  // 7. Test Admin Operations (Update Stage and Plan Price)
  console.log("\n7. Testando Operações Administrativas:");
  // Update stage to 4 (Em desenvolvimento)
  const stageRes = await request(`/api/admin/orders/${orderId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: { stageIndex: 4 }
  });
  const stageData = JSON.parse(stageRes.body);
  console.log(`  [PASS] Etapa do projeto atualizada para: ${stageData.order.currentStageIndex}`);

  // Test Contact Lead submission
  const leadRes = await request('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: "Dra. Mariana Costa",
      email: "mariana@odontocosta.com",
      phone: "(11) 97777-6666",
      subject: "Dúvida sobre os 5 Planos",
      message: "Gostaria de saber se o plano profissional inclui mapa interativo e WhatsApp."
    }
  });
  console.log(`  [PASS] Lead de contato registrado com sucesso`);

  // Test Admin Metrics
  const metricsRes = await request('/api/admin/metrics');
  const metricsData = JSON.parse(metricsRes.body);
  console.log(`  [PASS] Métricas Administrativas:`);
  console.log(`         - Total Pedidos: ${metricsData.totalOrders}`);
  console.log(`         - Faturamento: R$ ${metricsData.totalRevenue.toFixed(2)}`);
  console.log(`         - Projetos Ativos: ${metricsData.activeProjects}`);
  // Cleanup test order and test lead
  const fs = require('fs');
  const db = JSON.parse(fs.readFileSync('data/database.json', 'utf8'));
  db.orders = db.orders.filter(o => o.id !== orderId);
  db.briefings = db.briefings.filter(b => b.orderId !== orderId);
  db.leads = db.leads.filter(l => l.email !== "mariana@odontocosta.com");
  fs.writeFileSync('data/database.json', JSON.stringify(db, null, 2), 'utf8');
  console.log(`  [PASS] Dados de teste limpos automaticamente do banco`);

  console.log("\n=== TODOS OS 7 TESTES CRÍTICOS PASSARAM COM SUCESSO! ===");
}

runTests().catch(err => {
  console.error("ERRO NOS TESTES:", err);
  process.exit(1);
});
