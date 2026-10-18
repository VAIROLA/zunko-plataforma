const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

const INITIAL_DATA = {
  plans: [
    {
      id: "essencial",
      name: "Site Essencial",
      tagline: "A entrada ideal para fortalecer sua presença digital",
      pagesLimit: "Até 3 páginas",
      price: 1600.00,
      prazo: "7 a 10 dias úteis",
      popular: false,
      description: "Destinado a pequenos negócios, autônomos e prestadores de serviços que precisam de um site moderno, rápido e com presença imediata no Google e WhatsApp.",
      indicacao: "Profissionais liberais, pequenos comércios e prestadores de serviços que buscam um primeiro site profissional.",
      features: [
        "Layout profissional adaptado a celulares e tablets",
        "Apresentação da empresa, serviços e canais de contato",
        "Botão flutuante de WhatsApp de alta conversão",
        "Links diretos para redes sociais",
        "Configuração básica de SEO para o Google",
        "Certificado de segurança SSL gratuito",
        "Otimização de velocidade de carregamento"
      ],
      notIncluded: [
        "Domínio e hospedagem (pagos diretamente pelo cliente)",
        "Blog ou área dinâmica de notícias",
        "Integrações complexas com sistemas externos",
        "Loja virtual ou pagamentos dentro do site"
      ],
      mockupImage: "essencial.jpg",
      cardPaymentLink: "https://pag.ae/82f_w8JnR"
    },
    {
      id: "profissional",
      name: "Site Profissional",
      tagline: "Para empresas que exigem uma apresentação comercial completa",
      pagesLimit: "Até 5 páginas",
      price: 2400.00,
      prazo: "10 a 15 dias úteis",
      popular: true,
      description: "Solução ideal para empresas que buscam credibilidade sólida, detalhamento de múltiplos serviços, formulários de captura e presença no mapa.",
      indicacao: "Empresas em expansão, consultórios, escritórios e negócios locais consolidados.",
      features: [
        "Design personalizado, exclusivo e 100% responsivo",
        "Páginas dedicadas: Início, Sobre, Serviços, Portfólio/Equipe e Contato",
        "Formulário de contato seguro com envio direto para e-mail",
        "Botão interativo de WhatsApp e chamada rápida",
        "Integração completa com Google Maps e redes sociais",
        "SEO básico e estrutura interna otimizada para buscas",
        "Banner institucional com chamadas estratégicas",
        "Certificado SSL e painel de acompanhamento"
      ],
      notIncluded: [
        "Domínio e hospedagem (pagos diretamente pelo cliente)",
        "Blog com publicação recorrente de artigos",
        "Integrações de API customizadas ou ERPs",
        "Sistema de login ou área restrita"
      ],
      mockupImage: "profissional.jpg",
      cardPaymentLink: "https://pag.ae/82f_vqcun"
    },
    {
      id: "empresarial-avancado",
      name: "Site Empresarial Avançado",
      tagline: "Estrutura robusta para posicionar sua marca como líder",
      pagesLimit: "Até 8 páginas",
      price: 3200.00,
      prazo: "15 a 20 dias úteis",
      popular: false,
      description: "Desenvolvido para médias empresas e marcas que produzem conteúdo, necessitam de catálogo detalhado de serviços ou portfólio rico.",
      indicacao: "Indústrias, empresas de médio porte, clínicas, imobiliárias e marcas com portfólio amplo.",
      features: [
        "Identidade visual completa da ZUNKO aplicada ao seu projeto",
        "Até 8 páginas estruturadas com arquitetura estratégica",
        "Portfólio interativo, galeria de fotos ou catálogo de serviços",
        "Blog institucional ou área de notícias integrada",
        "Formulários personalizados por departamento ou serviço",
        "SEO avançado integrado com Google Analytics e Tag Manager",
        "Microinterações e animações visuais elegantes",
        "Integração com WhatsApp comercial e canais múltiplos"
      ],
      notIncluded: [
        "Domínio e hospedagem (contratados à parte)",
        "Comércio eletrônico com checkout de produtos",
        "Integração de streaming ou áreas de membros"
      ],
      mockupImage: "empresarial.jpg",
      cardPaymentLink: "https://pag.ae/82f_uXghH"
    },
    {
      id: "premium",
      name: "Site Premium",
      tagline: "Design exclusivo e alto desempenho para marcas de destaque",
      pagesLimit: "Até 12 páginas",
      price: 3900.00,
      prazo: "20 a 25 dias úteis",
      popular: false,
      description: "Uma experiência digital refinada, com design sob medida, máxima velocidade, animações fluidas e integrações estratégicas de captação.",
      indicacao: "Empresas consolidadas, startups de tecnologia, marcas de luxo e grandes escritórios corporativos.",
      features: [
        "Design exclusivo, autoral e sob medida (sem templates genéricos)",
        "Até 12 páginas detalhadas para serviços, cases, equipe e compliance",
        "Blog corporativo, portfólio expandido ou catálogo avançado",
        "Animações refinadas e elementos visuais interativos de alto nível",
        "Integrações com ferramentas externas (CRM, RD Station, HubSpot, Mailchimp)",
        "SEO técnico profundo e máxima pontuação no Google PageSpeed",
        "Múltiplos formulários de conversão e rastreamento de pixels",
        "Suporte prioritário durante todo o desenvolvimento"
      ],
      notIncluded: [
        "Domínio e hospedagem (pagos diretamente pelo cliente)",
        "Desenvolvimento de sistemas de backend complexos ou portais bancários"
      ],
      mockupImage: "premium.jpg",
      cardPaymentLink: "https://pag.ae/82f_sU9Ba"
    },
    {
      id: "completo-sofisticado",
      name: "Site Completo Sofisticado",
      tagline: "O ápice do desenvolvimento web institucional para grandes projetos",
      pagesLimit: "Até 15 páginas institucionais",
      price: 4600.00,
      prazo: "25 a 35 dias úteis",
      popular: false,
      description: "A solução definitiva do catálogo ZUNKO. Todo o poder da nossa equipe dedicado a criar uma obra-prima digital para sua corporação.",
      indicacao: "Grandes corporações, holdings, indústrias, redes de franquias e empresas de grande porte.",
      features: [
        "Projeto visual premium 100% sob medida com prototipagem detalhada",
        "Até 15 páginas institucionais completas com hierarquia visual impecável",
        "Módulos avançados de blog, portfólio categorizado e catálogo rico",
        "Formulários inteligentes com validação avançada e segmentação",
        "Integrações completas com ERPs, CRMs e APIs externas viáveis",
        "SEO técnico de nível corporativo e otimização extrema de performance",
        "Treinamento básico em vídeo para sua equipe atualizar conteúdos",
        "Manual da marca digital e documentação de entrega",
        "Garantia estendida e suporte pós-entrega de 30 dias"
      ],
      notIncluded: [
        "Domínio e hospedagem (pagos diretamente pelo cliente)",
        "Sistemas customizados com login de membros e streaming (orçados à parte)"
      ],
      mockupImage: "sofisticado.jpg",
      cardPaymentLink: "https://pag.ae/82f_rxTVn"
    }
  ],
  maintenancePlans: [
    { id: "manut-basica", name: "Manutenção Básica", price: 100.00, period: "mês", scope: "Atualizações técnicas e verificação periódica de funcionamento." },
    { id: "manut-essencial", name: "Manutenção Essencial", price: 180.00, period: "mês", scope: "Manutenção básica e pequenas alterações de textos e informações." },
    { id: "manut-profissional", name: "Manutenção Profissional", price: 280.00, period: "mês", scope: "Atualizações técnicas, suporte ágil e inclusão limitada de conteúdos." },
    { id: "manut-premium", name: "Manutenção Premium", price: 400.00, period: "mês", scope: "Suporte prioritário, acompanhamento técnico contínuo e atualizações com limite contratual." }
  ],
  orders: [],
  briefings: [],
  leads: [],
  settings: {
    companyName: "ZUNKO",
    slogan: "Sua ideia ganha o mundo.",
    phone: "(21) 96672-5240",
    whatsapp: "5521966725240",
    email: "zunko.sites@hotmail.com",
    atendimentoHorario: "Segunda a Sexta, das 09:00 às 17:00 horas",
    pixDiscountPercent: 5,
    maxCardInstallments: 12,
    payment: {
      pixKey: "zunko.sites@hotmail.com",
      pixBeneficiary: "Ailton Paulo dos Santos",
      pixBank: "PagBank (PagSeguro)",
      cardPaymentLink: "https://pag.ae/82f_vqcun",
      whatsappConfirm: "5521966725240",
      planCardLinks: {
        "essencial": "https://pag.ae/82f_w8JnR",
        "profissional": "https://pag.ae/82f_vqcun",
        "empresarial-avancado": "https://pag.ae/82f_uXghH",
        "premium": "https://pag.ae/82f_sU9Ba",
        "completo-sofisticado": "https://pag.ae/82f_rxTVn"
      }
    },
    promo: {
      active: true,
      badgeText: "🔥 OFERTA POR TEMPO LIMITADO • R$ 400 OFF",
      bannerText: "🔥 OFERTA DE LANÇAMENTO: TODOS OS PLANOS COM R$ 400 DE DESCONTO + 5% NO PIX À VISTA!",
      discount: 400
    },
    video: {
      title: "Por que um site profissional multiplica suas vendas?",
      subtitle: "Descubra a metodologia da ZUNKO para posicionar sua marca com excelência.",
      badge: "Vídeo Institucional ZUNKO",
      type: "file", // 'file', 'url', 'embed'
      url: "",
      posterUrl: ""
    },
    portfolio: [
      {
        id: "demo-gastronomia",
        category: "Gastronomia",
        categorySlug: "gastronomia",
        domain: "bistrogourmet.com.br",
        title: "Bistrô & Restaurante Gourmet",
        description: "Cardápio digital, reservas e mapa interativo.",
        planRecommended: "Profissional",
        image: "",
        demoUrl: "/planos/profissional"
      },
      {
        id: "demo-varejo",
        category: "Varejo & Moda",
        categorySlug: "lojas",
        domain: "boutiquemoda.com.br",
        title: "Catálogo de Produtos & Loja",
        description: "Catálogo fotográfico com link direto para compra.",
        planRecommended: "Empresarial Avançado",
        image: "",
        demoUrl: "/planos/empresarial-avancado"
      },
      {
        id: "demo-beleza",
        category: "Saúde & Beleza",
        categorySlug: "saloes",
        domain: "clinicabemestar.com.br",
        title: "Clínica Estética & Bem-Estar",
        description: "Procedimentos, depoimentos e agendamento WhatsApp.",
        planRecommended: "Profissional",
        image: "",
        demoUrl: "/planos/profissional"
      },
      {
        id: "demo-profissionais",
        category: "Profissionais",
        categorySlug: "profissionais",
        domain: "advocaciaoliveira.com.br",
        title: "Escritório de Advocacia & Consultoria",
        description: "Apresentação de áreas de atuação e agendamento.",
        planRecommended: "Site Essencial",
        image: "",
        demoUrl: "/planos/essencial"
      },
      {
        id: "demo-empresas",
        category: "Corporativo B2B",
        categorySlug: "empresas",
        domain: "logisticsbrasil.com.br",
        title: "Empresa de Engenharia & Logística",
        description: "Projetos, frota, certificações e cotações online.",
        planRecommended: "Site Premium",
        image: "",
        demoUrl: "/planos/premium"
      },
      {
        id: "demo-sofisticado",
        category: "Holding & Indústria",
        categorySlug: "empresas",
        domain: "nexuscorp.com.br",
        title: "Grupo Industrial Internacional",
        description: "Portal multi-idiomas, relações com investidores e governança.",
        planRecommended: "Completo Sofisticado",
        image: "",
        demoUrl: "/planos/completo-sofisticado"
      }
    ]
  }
};

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadData() {
  ensureDirSync(path.dirname(DB_PATH));
  if (!fs.existsSync(DB_PATH)) {
    saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    
    // Auto-migrate settings if missing video or portfolio
    let modified = false;
    if (!data.settings) {
      data.settings = { ...INITIAL_DATA.settings };
      modified = true;
    }
    if (!data.settings.video) {
      data.settings.video = { ...INITIAL_DATA.settings.video };
      modified = true;
    }
    if (!data.settings.portfolio || !Array.isArray(data.settings.portfolio)) {
      data.settings.portfolio = [ ...INITIAL_DATA.settings.portfolio ];
      modified = true;
    }
    if (modified) {
      saveData(data);
    }
    return data;
  } catch (err) {
    console.error("Erro ao carregar banco de dados, usando dados iniciais:", err);
    return INITIAL_DATA;
  }
}

function saveData(data) {
  ensureDirSync(path.dirname(DB_PATH));
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

// Database helper functions
const db = {
  getPlans() {
    const data = loadData();
    const promo = data.settings?.promo || { active: true };
    const isPromoActive = Boolean(promo.active);

    return data.plans.map(p => {
      const regularPrice = Number(p.regularPrice || p.originalPrice || 1600);
      const promoPrice = Number(p.promoPrice || (regularPrice - 400));
      const activePrice = isPromoActive ? promoPrice : regularPrice;
      const activeCardLink = isPromoActive 
        ? (p.promoCardPaymentLink || p.cardPaymentLink) 
        : (p.regularCardPaymentLink || p.cardPaymentLink);

      return {
        ...p,
        regularPrice,
        promoPrice,
        price: activePrice,
        originalPrice: isPromoActive ? regularPrice : null,
        isPromo: isPromoActive,
        promoBadge: promo.badgeText || '🔥 OFERTA POR TEMPO LIMITADO • R$ 400 OFF',
        cardPaymentLink: activeCardLink
      };
    });
  },
  getPlanById(id) {
    const plans = this.getPlans();
    return plans.find(p => p.id === id);
  },
  updatePlan(id, updatedFields) {
    const data = loadData();
    const index = data.plans.findIndex(p => p.id === id);
    if (index === -1) return null;
    data.plans[index] = { ...data.plans[index], ...updatedFields };
    saveData(data);
    return data.plans[index];
  },
  getMaintenancePlans() {
    return loadData().maintenancePlans;
  },
  getOrders() {
    return loadData().orders;
  },
  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id || o.orderNumber === id);
  },
  createOrder(orderData) {
    const data = loadData();
    const orderNumber = "ZNK-" + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: orderNumber,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "pedido_realizado",
      paymentStatus: orderData.paymentMethod === 'pix' ? 'confirmado' : 'confirmado', // instant in test/prod
      currentStageIndex: 1, // 1: Pedido realizado, 2: Pagamento confirmado, etc.
      ...orderData
    };
    data.orders.unshift(newOrder);
    saveData(data);
    return newOrder;
  },
  updateOrderStatus(orderId, status, currentStageIndex, internalNotes) {
    const data = loadData();
    const order = data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;
    if (status) order.status = status;
    if (currentStageIndex !== undefined) order.currentStageIndex = currentStageIndex;
    if (internalNotes !== undefined) order.internalNotes = internalNotes;
    order.updatedAt = new Date().toISOString();
    saveData(data);
    return order;
  },
  saveBriefing(orderId, briefingData) {
    const data = loadData();
    const existingIndex = data.briefings.findIndex(b => b.orderId === orderId);
    const briefingRecord = {
      orderId,
      updatedAt: new Date().toISOString(),
      ...briefingData
    };
    if (existingIndex >= 0) {
      data.briefings[existingIndex] = briefingRecord;
    } else {
      data.briefings.push(briefingRecord);
    }
    // Update order status if it was waiting briefing
    const order = data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (order && order.currentStageIndex <= 3) {
      order.currentStageIndex = 4; // Em desenvolvimento
      order.status = "em_desenvolvimento";
    }
    saveData(data);
    return briefingRecord;
  },
  getBriefingByOrderId(orderId) {
    const data = loadData();
    return data.briefings.find(b => b.orderId === orderId) || null;
  },
  saveLead(leadData) {
    const data = loadData();
    const newLead = {
      id: "LEAD-" + Date.now(),
      createdAt: new Date().toISOString(),
      ...leadData
    };
    data.leads.unshift(newLead);
    saveData(data);
    return newLead;
  },
  getLeads() {
    return loadData().leads;
  },
  getSettings() {
    return loadData().settings;
  },
  updateSettings(newSettings) {
    const data = loadData();
    if (newSettings.payment) {
      const mergedPayment = {
        ...(data.settings.payment || {}),
        ...newSettings.payment,
        planCardLinks: {
          ...((data.settings.payment && data.settings.payment.planCardLinks) || {}),
          ...(newSettings.payment.planCardLinks || {})
        }
      };
      data.settings.payment = mergedPayment;

      // Sync planCardLinks into data.plans
      if (mergedPayment.planCardLinks && Array.isArray(data.plans)) {
        data.plans.forEach(plan => {
          if (mergedPayment.planCardLinks[plan.id]) {
            plan.cardPaymentLink = mergedPayment.planCardLinks[plan.id];
          }
        });
      }
      delete newSettings.payment;
    }
    if (newSettings.promo) {
      data.settings.promo = {
        ...(data.settings.promo || {}),
        ...newSettings.promo
      };
      delete newSettings.promo;
    }
    data.settings = { ...data.settings, ...newSettings };
    saveData(data);
    return data.settings;
  },
  getVideoSettings() {
    const settings = this.getSettings();
    return settings.video || {};
  },
  updateVideoSettings(videoData) {
    const data = loadData();
    data.settings.video = { ...data.settings.video, ...videoData };
    saveData(data);
    return data.settings.video;
  },
  getPortfolio() {
    const settings = this.getSettings();
    return settings.portfolio || [];
  },
  addOrUpdatePortfolioItem(item) {
    const data = loadData();
    if (!data.settings.portfolio) data.settings.portfolio = [];
    const index = data.settings.portfolio.findIndex(p => p.id === item.id);
    if (index >= 0) {
      data.settings.portfolio[index] = { ...data.settings.portfolio[index], ...item };
    } else {
      if (!item.id) item.id = 'demo-' + Date.now();
      data.settings.portfolio.push(item);
    }
    saveData(data);
    return item;
  },
  deletePortfolioItem(id) {
    const data = loadData();
    if (!data.settings.portfolio) return false;
    data.settings.portfolio = data.settings.portfolio.filter(p => p.id !== id);
    saveData(data);
    return true;
  },
  updatePlanMockup(planId, imagePath) {
    const data = loadData();
    const plan = data.plans.find(p => p.id === planId);
    if (!plan) return null;
    plan.mockupImage = imagePath;
    saveData(data);
    return plan;
  },

  // Blindagem e Autenticação Segura de Administrador (PBKDF2)
  getAdminAuth() {
    const data = loadData();
    if (!data.adminAuth) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('zunko2026', salt, 10000, 64, 'sha512').toString('hex');
      data.adminAuth = {
        username: 'admin',
        email: 'zunko.sites@hotmail.com',
        salt: salt,
        passwordHash: hash,
        updatedAt: new Date().toISOString()
      };
      saveData(data);
    }
    return data.adminAuth;
  },

  verifyAdminCredentials(login, password) {
    const auth = this.getAdminAuth();
    if (!login || !password) return false;
    const cleanLogin = login.trim().toLowerCase();
    const validUser = auth.username.toLowerCase();
    const validEmail = (auth.email || '').toLowerCase();

    if (cleanLogin !== validUser && cleanLogin !== validEmail) {
      return false;
    }

    const testHash = crypto.pbkdf2Sync(password, auth.salt, 10000, 64, 'sha512').toString('hex');
    return testHash === auth.passwordHash;
  },

  updateAdminCredentials(newUsername, newPassword) {
    const data = loadData();
    if (!data.adminAuth) data.adminAuth = this.getAdminAuth();
    if (newUsername && newUsername.trim()) {
      data.adminAuth.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(newPassword.trim(), salt, 10000, 64, 'sha512').toString('hex');
      data.adminAuth.salt = salt;
      data.adminAuth.passwordHash = hash;
    }
    data.adminAuth.updatedAt = new Date().toISOString();
    saveData(data);
    return { success: true, username: data.adminAuth.username };
  },

  // Contador e Estatísticas de Visitas em Tempo Real
  recordVisit({ path, userAgent, ip }) {
    const data = loadData();
    if (!data.analytics) {
      data.analytics = {
        totalVisits: 0,
        dailyVisits: {},
        pages: {},
        recentVisits: []
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    data.analytics.totalVisits = (data.analytics.totalVisits || 0) + 1;
    if (!data.analytics.dailyVisits) data.analytics.dailyVisits = {};
    data.analytics.dailyVisits[today] = (data.analytics.dailyVisits[today] || 0) + 1;

    const cleanPath = path || '/';
    if (!data.analytics.pages) data.analytics.pages = {};
    data.analytics.pages[cleanPath] = (data.analytics.pages[cleanPath] || 0) + 1;

    // Detect device
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent || '');
    const device = isMobile ? '📱 Celular' : '💻 Computador';

    if (!data.analytics.recentVisits) data.analytics.recentVisits = [];
    data.analytics.recentVisits.unshift({
      path: cleanPath,
      timestamp: now,
      device
    });

    if (data.analytics.recentVisits.length > 50) {
      data.analytics.recentVisits = data.analytics.recentVisits.slice(0, 50);
    }

    saveData(data);
    return data.analytics;
  },

  getAnalytics() {
    const data = loadData();
    const analytics = data.analytics || {
      totalVisits: 0,
      dailyVisits: {},
      pages: {},
      recentVisits: []
    };
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = (analytics.dailyVisits && analytics.dailyVisits[today]) || 0;

    return {
      totalVisits: analytics.totalVisits || 0,
      todayVisits,
      pages: analytics.pages || {},
      recentVisits: analytics.recentVisits || []
    };
  }
};

module.exports = db;
