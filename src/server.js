const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Active admin sessions & rate limiting
const activeAdminSessions = new Map(); // token -> { user, createdAt, expiresAt }
const loginRateLimit = new Map(); // ip -> { count, lockedUntil }

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSessionFromReq(req) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (!token) {
    const cookies = parseCookies(req);
    token = cookies['zunko_admin_token'];
  }
  if (!token) return null;
  const session = activeAdminSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return null;
  }
  return { ...session, token };
}

function isAuthenticated(req) {
  return !!getSessionFromReq(req);
}

function requireAdminAuth(req, res, next) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: 'Acesso restrito. Faça login para continuar.' });
  }
  req.adminSession = session;
  next();
}

// Ensure upload folders exist
const uploadsBase = path.resolve(__dirname, '..', 'public', 'uploads');
const videosDir = path.join(uploadsBase, 'videos');
const sitesDir = path.join(uploadsBase, 'sites');
const portfolioDir = path.join(uploadsBase, 'portfolio');

[videosDir, sitesDir, portfolioDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Configure Multer storage engines
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `video-propaganda-${Date.now()}${ext}`);
  }
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB
});

const siteStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, sitesDir),
  filename: (req, file, cb) => {
    const planId = req.params.planId || 'plan';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `mockup-${planId}-${Date.now()}${ext}`);
  }
});
const uploadSiteMockup = multer({
  storage: siteStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, portfolioDir),
  filename: (req, file, cb) => {
    const id = req.params.portfolioId || 'demo';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `site-${id}-${Date.now()}${ext}`);
  }
});
const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const posterStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `poster-${Date.now()}${ext}`);
  }
});
const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Security Gate: Intercept admin page requests BEFORE express.static
const publicDir = path.resolve(__dirname, '..', 'public');
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin.html') {
    if (!isAuthenticated(req)) {
      return res.sendFile(path.resolve(publicDir, 'admin-login.html'), { dotfiles: 'allow' });
    }
    return res.sendFile(path.resolve(publicDir, 'admin.html'), { dotfiles: 'allow' });
  }
  next();
});

// Admin Authentication Endpoints (Unprotected)
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginRateLimit.get(ip) || { count: 0, lockedUntil: 0 };

  if (attempts.lockedUntil > now) {
    const waitSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
    return res.status(429).json({ error: `Muitas tentativas. Tente novamente em ${waitSeconds}s.` });
  }

  const { login, password } = req.body || {};
  const valid = db.verifyAdminCredentials(login, password);

  if (!valid) {
    attempts.count += 1;
    if (attempts.count >= 5) {
      attempts.lockedUntil = now + 5 * 60 * 1000; // 5 min lock
      attempts.count = 0;
    }
    loginRateLimit.set(ip, attempts);
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique usuário e senha.' });
  }

  // Reset rate limit on success
  loginRateLimit.delete(ip);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days session
  activeAdminSessions.set(token, {
    user: login,
    createdAt: now,
    expiresAt
  });

  res.setHeader('Set-Cookie', `zunko_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
  res.json({
    success: true,
    token,
    username: login
  });
});

app.post('/api/admin/logout', (req, res) => {
  const session = getSessionFromReq(req);
  if (session) {
    activeAdminSessions.delete(session.token);
  }
  res.setHeader('Set-Cookie', 'zunko_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({ authenticated: true, user: req.adminSession.user });
});

app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body || {};
    if (!currentPassword || !db.verifyAdminCredentials(req.adminSession.user, currentPassword)) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }
    const result = db.updateAdminCredentials(newUsername, newPassword);
    res.json({ success: true, message: 'Credenciais atualizadas com sucesso!', username: result.username });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar credenciais: ' + err.message });
  }
});

// Protect all remaining /api/admin routes
app.use('/api/admin', requireAdminAuth);

// Serve static assets with automatic .html extension resolution
app.use(express.static(path.resolve(__dirname, '..', 'public'), { extensions: ['html'], dotfiles: 'allow' }));

// Friendly HTML Page routes
function sendPage(res, filename) {
  const filePath = path.resolve(publicDir, filename);
  res.sendFile(filePath, { dotfiles: 'allow' }, (err) => {
    if (err && !res.headersSent) {
      res.status(err.status || 500).send("Página não encontrada ou erro interno");
    }
  });
}

app.get('/', (req, res) => sendPage(res, 'index.html'));
app.get('/sobre', (req, res) => sendPage(res, 'sobre.html'));

// 5 Plans individual pages
app.get('/planos/essencial', (req, res) => sendPage(res, path.join('planos', 'essencial.html')));
app.get('/planos/profissional', (req, res) => sendPage(res, path.join('planos', 'profissional.html')));
app.get('/planos/empresarial-avancado', (req, res) => sendPage(res, path.join('planos', 'empresarial-avancado.html')));
app.get('/planos/premium', (req, res) => sendPage(res, path.join('planos', 'premium.html')));
app.get('/planos/completo-sofisticado', (req, res) => sendPage(res, path.join('planos', 'completo-sofisticado.html')));

app.get('/comparativo', (req, res) => sendPage(res, 'comparativo.html'));
app.get('/tutorial-ia', (req, res) => sendPage(res, 'tutorial-ia.html'));
app.get('/faq', (req, res) => sendPage(res, 'faq.html'));
app.get('/contato', (req, res) => sendPage(res, 'contato.html'));
app.get('/checkout', (req, res) => sendPage(res, 'checkout.html'));
app.get('/briefing', (req, res) => sendPage(res, 'briefing.html'));
app.get('/area-cliente', (req, res) => sendPage(res, 'area-cliente.html'));
app.get('/termos', (req, res) => sendPage(res, 'termos.html'));
app.get('/privacidade', (req, res) => sendPage(res, 'privacidade.html'));
app.get('/reembolso', (req, res) => sendPage(res, 'reembolso.html'));

// API Routes
app.get('/api/plans', (req, res) => {
  res.json({
    plans: db.getPlans(),
    maintenancePlans: db.getMaintenancePlans()
  });
});

app.get('/api/plans/:id', (req, res) => {
  const plan = db.getPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
  res.json({ plan });
});

app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !orderData.planId || !orderData.customer) {
      return res.status(400).json({ error: 'Dados incompletos para contratação' });
    }
    const order = db.createOrder(orderData);
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

app.get('/api/orders', requireAdminAuth, (req, res) => {
  res.json({ orders: db.getOrders() });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não localizado' });
  const briefing = db.getBriefingByOrderId(order.orderNumber);
  res.json({ order, briefing });
});

app.post('/api/briefing/:orderId', (req, res) => {
  try {
    const briefing = db.saveBriefing(req.params.orderId, req.body);
    res.json({ success: true, briefing });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar briefing' });
  }
});

app.get('/api/briefing/:orderId', (req, res) => {
  const briefing = db.getBriefingByOrderId(req.params.orderId);
  res.json({ briefing });
});

app.post('/api/contact', (req, res) => {
  try {
    const lead = db.saveLead(req.body);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar contato' });
  }
});

// Visitor Tracking Endpoint (Public, silent)
app.post('/api/track-visit', (req, res) => {
  try {
    const { path, location, city, state, country } = req.body || {};
    if (path && !path.startsWith('/admin')) {
      const userAgent = req.headers['user-agent'] || '';
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.ip || req.connection?.remoteAddress || '';
      
      let finalCountry = country || 'Brasil';
      const cfCountry = req.headers['cf-ipcountry'];
      if (cfCountry && (cfCountry === 'BR' || cfCountry === 'Brazil')) {
        finalCountry = 'Brasil';
      }

      db.recordVisit({ 
        path, 
        userAgent, 
        ip, 
        location: location || finalCountry, 
        city, 
        state, 
        country: finalCountry 
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false });
  }
});

app.get('/api/admin/metrics', (req, res) => {
  const orders = db.getOrders();
  const leads = db.getLeads();
  const analytics = db.getAnalytics();
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const activeProjects = orders.filter(o => o.currentStageIndex >= 1 && o.currentStageIndex <= 6).length;
  res.json({
    totalOrders: orders.length,
    totalRevenue,
    activeProjects,
    totalLeads: leads.length,
    totalVisits: analytics.totalVisits,
    todayVisits: analytics.todayVisits,
    pages: analytics.pages,
    recentVisits: analytics.recentVisits
  });
});

app.get('/api/admin/leads', (req, res) => {
  res.json({ leads: db.getLeads() });
});

app.patch('/api/admin/plans/:id', (req, res) => {
  const updated = db.updatePlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Plano não encontrado' });
  res.json({ success: true, plan: updated });
});

app.patch('/api/admin/orders/:id/stage', (req, res) => {
  const { stageIndex } = req.body;
  const updated = db.updateOrderStatus(req.params.id, null, stageIndex);
  if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ success: true, order: updated });
});

app.patch('/api/admin/orders/:id/notes', (req, res) => {
  const { notes } = req.body;
  const updated = db.updateOrderStatus(req.params.id, null, undefined, notes);
  if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json({ success: true, order: updated });
});

// Settings & Video APIs
app.get('/api/settings', (req, res) => {
  res.json({ settings: db.getSettings() });
});

app.all('/api/admin/settings', (req, res) => {
  if (req.method === 'PATCH' || req.method === 'POST') {
    try {
      const updated = db.updateSettings(req.body);
      return res.json({ success: true, settings: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }
  res.json({ settings: db.getSettings() });
});

app.get('/api/settings/video', (req, res) => {
  res.json({ video: db.getVideoSettings() });
});

app.patch('/api/admin/settings/video', (req, res) => {
  try {
    const updated = db.updateVideoSettings(req.body);
    res.json({ success: true, video: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar vídeo propaganda' });
  }
});

// Upload Video File
app.post('/api/admin/upload/video', uploadVideo.single('videoFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de vídeo enviado' });
    }
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const updatedVideo = db.updateVideoSettings({
      url: videoUrl,
      type: 'file',
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
    res.json({ success: true, url: videoUrl, video: updatedVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer upload do vídeo: ' + err.message });
  }
});

// Upload Video Poster Image
app.post('/api/admin/upload/video-poster', uploadPoster.single('posterFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada para o poster' });
    }
    const posterUrl = `/uploads/videos/${req.file.filename}`;
    const updatedVideo = db.updateVideoSettings({ posterUrl });
    res.json({ success: true, posterUrl, video: updatedVideo });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer upload do poster: ' + err.message });
  }
});

// Upload Mockup / "Frente do Site" para um dos 5 Planos
app.post('/api/admin/upload/plan-mockup/:planId', uploadSiteMockup.single('mockupFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada para o plano' });
    }
    const imageUrl = `/uploads/sites/${req.file.filename}`;
    const plan = db.updatePlanMockup(req.params.planId, imageUrl);
    if (!plan) return res.status(404).json({ error: 'Plano não localizado' });
    res.json({ success: true, mockupImage: imageUrl, plan });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer upload da imagem do plano: ' + err.message });
  }
});

// Portfolio / Frentes dos Sites de Demonstração
app.get('/api/portfolio', (req, res) => {
  res.json({ portfolio: db.getPortfolio() });
});

app.post('/api/admin/portfolio', (req, res) => {
  try {
    const item = db.addOrUpdatePortfolioItem(req.body);
    res.json({ success: true, item, portfolio: db.getPortfolio() });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar item do portfólio' });
  }
});

app.post('/api/admin/upload/portfolio/:portfolioId', uploadPortfolio.single('portfolioFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado para o portfólio' });
    }
    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    const item = db.addOrUpdatePortfolioItem({
      id: req.params.portfolioId,
      image: imageUrl
    });
    res.json({ success: true, image: imageUrl, item });
  } catch (err) {
    res.status(500).json({ error: 'Erro no upload da imagem de demonstração: ' + err.message });
  }
});

app.delete('/api/admin/portfolio/:id', (req, res) => {
  try {
    const ok = db.deletePortfolioItem(req.params.id);
    res.json({ success: ok, portfolio: db.getPortfolio() });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover item do portfólio' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Plataforma ZUNKO ativa e operando em http://localhost:${PORT}`);
});
