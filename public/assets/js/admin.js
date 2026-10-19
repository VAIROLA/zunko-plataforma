// ZUNKO - Admin Dashboard Manager & Protected Gate
// Intercept fetch to automatically attach Authorization header and handle 401
const originalFetch = window.fetch;
window.fetch = async function(input, init = {}) {
  init = init || {};
  init.headers = init.headers || {};
  const token = sessionStorage.getItem('zunko_admin_token');
  if (token) {
    if (init.headers instanceof Headers) {
      if (!init.headers.has('Authorization')) init.headers.set('Authorization', 'Bearer ' + token);
    } else if (Array.isArray(init.headers)) {
      init.headers.push(['Authorization', 'Bearer ' + token]);
    } else {
      if (!init.headers['Authorization']) init.headers['Authorization'] = 'Bearer ' + token;
    }
  }
  const response = await originalFetch(input, init);
  if (response.status === 401 && !String(input).includes('/api/admin/login')) {
    sessionStorage.removeItem('zunko_admin_token');
    sessionStorage.removeItem('zunko_admin_auth');
    sessionStorage.removeItem('zunko_admin_user');
    window.location.href = '/admin';
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('admin-logout-btn');
  const userBadge = document.getElementById('admin-user-display');

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        sessionStorage.clear();
        window.location.href = '/admin';
        return;
      }
      if (userBadge) {
        userBadge.textContent = data.user || 'Administrador';
      }
      localStorage.setItem('zunko_is_admin', 'true');
      loadAllDashboardData();
    } catch (e) {
      console.error('Falha na autenticação do admin:', e);
      window.location.href = '/admin';
    }
  }

  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Deseja realmente sair da sessão administrativa?')) {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch (e) {
        console.error(e);
      }
      sessionStorage.clear();
      window.location.href = '/admin';
    }
  });

  // Tab navigation in Admin
  const adminTabs = document.querySelectorAll('.admin-nav-tab');
  const adminSections = document.querySelectorAll('.admin-section');

  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      adminTabs.forEach(t => {
        if (t === tab) {
          t.classList.add('bg-zunko-blue', 'text-white');
          t.classList.remove('text-slate-600', 'hover:bg-slate-200');
        } else {
          t.classList.remove('bg-zunko-blue', 'text-white');
          t.classList.add('text-slate-600', 'hover:bg-slate-200');
        }
      });

      adminSections.forEach(sec => {
        if (sec.id === `section-${target}`) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      });
    });
  });

  // Atalhos rápidos ao clicar nos cards de métricas
  document.getElementById('card-total-visits')?.addEventListener('click', () => {
    document.querySelector('.admin-nav-tab[data-tab="visitas"]')?.click();
  });
  document.getElementById('card-today-visits')?.addEventListener('click', () => {
    document.querySelector('.admin-nav-tab[data-tab="visitas"]')?.click();
  });
  document.getElementById('card-total-orders')?.addEventListener('click', () => {
    document.querySelector('.admin-nav-tab[data-tab="pedidos"]')?.click();
  });

  if (window.location.hash === '#visitas') {
    document.querySelector('.admin-nav-tab[data-tab="visitas"]')?.click();
  }

  // Data Loading
  async function loadAllDashboardData() {
    loadMetrics();
    loadOrders();
    loadVideoSettings();
    loadPlans();
    loadPortfolio();
    loadLeads();
    loadPaymentSettings();
  }

  // 1. METRICS & VISITS
  async function loadMetrics() {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      document.getElementById('metric-total-orders').textContent = data.totalOrders || 0;
      document.getElementById('metric-total-revenue').textContent = Number(data.totalRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      document.getElementById('metric-active-projects').textContent = data.activeProjects || 0;
      document.getElementById('metric-total-leads').textContent = data.totalLeads || 0;

      const elTotalVisits = document.getElementById('metric-total-visits');
      const elTodayVisits = document.getElementById('metric-today-visits');
      if (elTotalVisits) elTotalVisits.textContent = data.totalVisits || 0;
      if (elTodayVisits) elTodayVisits.textContent = data.todayVisits || 0;

      renderVisitsDetails(data);
    } catch (e) {
      console.error(e);
    }
  }

  function renderVisitsDetails(data) {
    // 1. Top Pages
    const topPagesList = document.getElementById('top-pages-list');
    if (topPagesList && data.pages) {
      const entries = Object.entries(data.pages).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        topPagesList.innerHTML = `<div class="text-slate-400 py-3 text-center">Nenhum dado registrado ainda.</div>`;
      } else {
        topPagesList.innerHTML = entries.map(([p, count]) => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
            <span class="font-mono text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">${p}</span>
            <span class="font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs">${count} ${count === 1 ? 'visita' : 'visitas'}</span>
          </div>
        `).join('');
      }
    }

    // 2. Cidades & Estados dos Visitantes
    const recents = data.recentVisits || [];
    const topCitiesList = document.getElementById('top-cities-list');
    if (topCitiesList) {
      const cityCounts = {};
      recents.forEach(r => {
        const loc = r.location || 'Brasil';
        cityCounts[loc] = (cityCounts[loc] || 0) + 1;
      });
      const cityEntries = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (cityEntries.length === 0) {
        topCitiesList.innerHTML = `<div class="text-slate-400 py-3 text-center">Nenhum dado de cidade registrado ainda.</div>`;
      } else {
        topCitiesList.innerHTML = cityEntries.map(([loc, count], idx) => `
          <div class="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
            <span class="font-medium text-slate-800 truncate flex items-center gap-1.5 text-xs">
              <span class="text-[10px] font-bold text-amber-500">#${idx + 1}</span>
              ${loc}
            </span>
            <span class="font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs">${count}</span>
          </div>
        `).join('');
      }
    }

    // 3. Devices count
    let mobiles = 0;
    let desktops = 0;
    recents.forEach(r => {
      if (r.device && r.device.includes('Celular')) mobiles++;
      else desktops++;
    });
    const elMobile = document.getElementById('visits-mobile-count');
    const elDesktop = document.getElementById('visits-desktop-count');
    if (elMobile) elMobile.textContent = mobiles;
    if (elDesktop) elDesktop.textContent = desktops;

    // 3. Recent Visits Table
    const recentTable = document.getElementById('recent-visits-table-body');
    if (recentTable) {
      if (recents.length === 0) {
        recentTable.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">Nenhum acesso registrado ainda.</td></tr>`;
      } else {
        recentTable.innerHTML = recents.map(r => {
          const dateStr = new Date(r.timestamp).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const loc = r.location || 'Brasil';
          return `
            <tr class="hover:bg-slate-50 transition">
              <td class="py-3 px-4 font-mono text-slate-500">${dateStr}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">${r.path}</td>
              <td class="py-3 px-4 text-slate-700 font-medium">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                  <i class="fas fa-map-marker-alt text-amber-500 text-[10px]"></i>
                  ${loc}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600">${r.device}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  document.getElementById('btn-refresh-visits')?.addEventListener('click', () => {
    loadMetrics();
    window.showToast?.('Estatísticas de visitas atualizadas!', 'success');
  });

  // 2. ORDERS MANAGEMENT
  async function loadOrders() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const orders = data.orders || [];

      if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500 text-sm">Nenhum pedido registrado ainda.</td></tr>`;
        return;
      }

      tableBody.innerHTML = orders.map(o => `
        <tr class="border-b hover:bg-slate-50 transition text-sm">
          <td class="py-3 px-4 font-mono font-bold text-zunko-blue">${o.orderNumber}</td>
          <td class="py-3 px-4 font-medium text-slate-800">
            ${o.customer.name}<br>
            <span class="text-xs text-slate-400">${o.customer.company || o.customer.email}</span>
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-700">${o.planName}</td>
          <td class="py-3 px-4 font-bold text-slate-900">${Number(o.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          <td class="py-3 px-4 text-xs">
            <span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              ${o.paymentMethod === 'pix' ? 'PIX Aprovado' : 'Cartão 12x'}
            </span>
          </td>
          <td class="py-3 px-4">
            <select class="border rounded-lg text-xs p-1.5 font-bold stage-selector bg-white" data-order-id="${o.orderNumber}">
              <option value="1" ${o.currentStageIndex === 1 ? 'selected' : ''}>1. Pedido Realizado</option>
              <option value="2" ${o.currentStageIndex === 2 ? 'selected' : ''}>2. Pagamento Confirmado</option>
              <option value="3" ${o.currentStageIndex === 3 ? 'selected' : ''}>3. Aguardando Briefing</option>
              <option value="4" ${o.currentStageIndex === 4 ? 'selected' : ''}>4. Em Desenvolvimento</option>
              <option value="5" ${o.currentStageIndex === 5 ? 'selected' : ''}>5. Revisão & Ajustes</option>
              <option value="6" ${o.currentStageIndex === 6 ? 'selected' : ''}>6. Configuração de Domínio</option>
              <option value="7" ${o.currentStageIndex === 7 ? 'selected' : ''}>7. Site Publicado (Concluído)</option>
            </select>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 view-order-btn" data-order-id="${o.orderNumber}">
              Ver Briefing
            </button>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('.stage-selector').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const orderId = sel.getAttribute('data-order-id');
          const stageIndex = parseInt(sel.value);
          try {
            await fetch(`/api/admin/orders/${orderId}/stage`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stageIndex })
            });
            window.showToast?.(`Etapa do pedido ${orderId} atualizada para etapa ${stageIndex}!`, 'success');
            loadMetrics();
          } catch (err) {
            alert('Erro ao atualizar etapa: ' + err.message);
          }
        });
      });

      tableBody.querySelectorAll('.view-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-order-id');
          openOrderModal(orderId);
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  async function openOrderModal(orderId) {
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    if (!modal || !content) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      const o = data.order;
      const b = data.briefing;

      content.innerHTML = `
        <div class="space-y-4 text-sm">
          <div class="bg-slate-50 p-4 rounded-xl border space-y-1">
            <div class="font-bold text-base text-slate-900">${o.orderNumber} - ${o.planName}</div>
            <div><strong>Cliente:</strong> ${o.customer.name} (${o.customer.company || 'Pessoa Física'})</div>
            <div><strong>E-mail:</strong> ${o.customer.email}</div>
            <div><strong>Telefone/WhatsApp:</strong> ${o.customer.phone}</div>
            <div><strong>CPF/CNPJ:</strong> ${o.customer.document || '-'}</div>
            <div><strong>Segmento:</strong> ${o.customer.segment || '-'}</div>
          </div>

          <div class="border-t pt-3">
            <h5 class="font-bold text-slate-900 mb-2">Briefing do Projeto:</h5>
            ${b ? `
              <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                <p><strong>Objetivo do Site:</strong> ${b.goal || 'Não informado'}</p>
                <p><strong>Público-Alvo:</strong> ${b.audience || 'Não informado'}</p>
                <p><strong>Serviços:</strong> ${b.servicesDescription || 'Não informado'}</p>
                <p><strong>Preferência de Cores/Identidade:</strong> ${b.colorsPreferences || 'Não informado'}</p>
                <p><strong>Sites de Referência:</strong> ${b.referenceSites || 'Não informado'}</p>
                <p><strong>Domínio Atual:</strong> ${b.existingDomain || 'Nenhum'}</p>
                <p><strong>Observações Extras:</strong> ${b.additionalRequests || 'Nenhuma'}</p>
              </div>
            ` : `<p class="text-amber-600 font-medium">Cliente ainda não enviou o briefing completo.</p>`}
          </div>

          <div class="border-t pt-3">
            <label class="block font-bold text-slate-900 mb-1">Notas Internas da Equipe ZUNKO:</label>
            <textarea id="modal-internal-notes" class="w-full border rounded-xl p-2.5 text-sm" rows="3">${o.internalNotes || ''}</textarea>
            <button id="save-notes-btn" class="mt-2 btn-primary text-xs py-1.5 px-4">Salvar Observações</button>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');

      document.getElementById('save-notes-btn')?.addEventListener('click', async () => {
        const notes = document.getElementById('modal-internal-notes').value;
        await fetch(`/api/admin/orders/${orderId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        });
        window.showToast?.('Observações salvas com sucesso!', 'success');
      });

      document.getElementById('close-order-modal')?.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    } catch (err) {
      console.error(err);
    }
  }

  // 3. VÍDEO PROPAGANDA OFICIAL DA ZUNKO (HOME)
  let currentVideoData = {};

  async function loadVideoSettings() {
    try {
      const res = await fetch('/api/settings/video');
      const data = await res.json();
      currentVideoData = data.video || {};

      document.getElementById('video-badge-input').value = currentVideoData.badge || 'Vídeo Institucional ZUNKO';
      document.getElementById('video-title-input').value = currentVideoData.title || 'Por que um site profissional multiplica suas vendas?';
      document.getElementById('video-subtitle-input').value = currentVideoData.subtitle || 'Descubra a metodologia da ZUNKO para posicionar sua marca com excelência.';
      document.getElementById('video-url-input').value = currentVideoData.url || '';

      updateVideoPreview(currentVideoData);
    } catch (err) {
      console.error('Erro ao carregar configurações de vídeo:', err);
    }
  }

  function updateVideoPreview(video) {
    const previewContainer = document.getElementById('admin-preview-player-container');
    const pathSpan = document.getElementById('admin-current-video-path');
    const typeSpan = document.getElementById('admin-current-video-type');
    const statusTag = document.getElementById('video-status-tag');
    if (!previewContainer) return;

    if (!video.url) {
      previewContainer.innerHTML = `
        <div class="text-center p-4 text-slate-400 text-xs" id="admin-video-placeholder">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          <span>Nenhum vídeo carregado no momento.<br>Suba um arquivo MP4 ao lado ou insira um link.</span>
        </div>
      `;
      pathSpan.textContent = 'Nenhum';
      typeSpan.textContent = 'Padrão / Placeholder';
      statusTag.textContent = 'Sem vídeo';
      statusTag.className = 'text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono';
      return;
    }

    pathSpan.textContent = video.url;
    statusTag.textContent = 'Ativo na Home';
    statusTag.className = 'text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono';

    // Check if YouTube
    const ytMatch = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      typeSpan.textContent = 'YouTube Embed';
      previewContainer.innerHTML = `
        <iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      `;
      return;
    }

    // Check if Vimeo
    const vimeoMatch = video.url.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      typeSpan.textContent = 'Vimeo Embed';
      previewContainer.innerHTML = `
        <iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" class="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
      `;
      return;
    }

    // Standard HTML5 video file or direct MP4 link
    typeSpan.textContent = video.type === 'file' ? 'Arquivo MP4 Local' : 'Link Direto MP4';
    previewContainer.innerHTML = `
      <video controls class="w-full h-full object-contain" poster="${video.posterUrl || ''}" preload="metadata">
        <source src="${video.url}" type="video/mp4">
        Seu navegador não suporta reprodução de vídeo HTML5.
      </video>
    `;
  }

  // Setup Video Upload & Save Listeners
  const btnUploadVideo = document.getElementById('btn-upload-video-file');
  const videoFileInput = document.getElementById('video-file-input');
  const progressBar = document.getElementById('video-progress-bar');
  const progressText = document.getElementById('video-progress-text');
  const progressContainer = document.getElementById('video-upload-progress');

  btnUploadVideo?.addEventListener('click', async () => {
    if (!videoFileInput.files || videoFileInput.files.length === 0) {
      alert('Por favor, selecione um arquivo de vídeo do seu computador primeiro!');
      return;
    }

    const file = videoFileInput.files[0];
    const formData = new FormData();
    formData.append('videoFile', file);

    progressContainer.classList.remove('hidden');
    progressBar.style.width = '30%';
    progressText.textContent = `Enviando "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`;

    try {
      const res = await fetch('/api/admin/upload/video', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro no envio');

      progressBar.style.width = '100%';
      progressText.textContent = 'Vídeo enviado com sucesso!';
      window.showToast?.('Vídeo propaganda enviado e salvo no servidor com sucesso!', 'success');

      document.getElementById('video-url-input').value = data.url;
      currentVideoData = data.video;
      updateVideoPreview(currentVideoData);

      setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
      }, 3000);
    } catch (err) {
      alert('Erro ao enviar vídeo: ' + err.message);
      progressContainer.classList.add('hidden');
    }
  });

  // Poster upload
  const btnUploadPoster = document.getElementById('btn-upload-poster-file');
  const posterFileInput = document.getElementById('poster-file-input');

  btnUploadPoster?.addEventListener('click', async () => {
    if (!posterFileInput.files || posterFileInput.files.length === 0) {
      alert('Selecione uma imagem de capa primeiro!');
      return;
    }
    const file = posterFileInput.files[0];
    const formData = new FormData();
    formData.append('posterFile', file);

    try {
      const res = await fetch('/api/admin/upload/video-poster', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro no envio da capa');
      window.showToast?.('Capa do vídeo atualizada com sucesso!', 'success');
      currentVideoData = data.video;
      updateVideoPreview(currentVideoData);
    } catch (err) {
      alert('Erro ao enviar capa: ' + err.message);
    }
  });

  // Save all video settings button (with automatic upload if file selected)
  document.getElementById('btn-save-video-settings')?.addEventListener('click', async () => {
    const saveBtn = document.getElementById('btn-save-video-settings');
    const badge = document.getElementById('video-badge-input').value.trim();
    const title = document.getElementById('video-title-input').value.trim();
    const subtitle = document.getElementById('video-subtitle-input').value.trim();
    let url = document.getElementById('video-url-input').value.trim();

    try {
      saveBtn.textContent = '⏳ Salvando alterações do vídeo...';
      saveBtn.disabled = true;

      // 1. If a video file was selected, upload it first!
      if (videoFileInput.files && videoFileInput.files.length > 0) {
        const file = videoFileInput.files[0];
        const formData = new FormData();
        formData.append('videoFile', file);

        progressContainer.classList.remove('hidden');
        progressBar.style.width = '50%';
        progressText.textContent = `Enviando vídeo "${file.name}"...`;

        const uploadRes = await fetch('/api/admin/upload/video', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error(uploadData.error || 'Erro no envio do vídeo');

        url = uploadData.url;
        document.getElementById('video-url-input').value = url;
        currentVideoData = uploadData.video;
        progressBar.style.width = '100%';
        progressText.textContent = 'Vídeo gravado com sucesso!';
      }

      // 2. If a poster was selected, upload it too!
      if (posterFileInput.files && posterFileInput.files.length > 0) {
        const posterFile = posterFileInput.files[0];
        const posterFormData = new FormData();
        posterFormData.append('posterFile', posterFile);

        const posterRes = await fetch('/api/admin/upload/video-poster', {
          method: 'POST',
          body: posterFormData
        });
        const posterData = await posterRes.json();
        if (posterData.video) currentVideoData = posterData.video;
      }

      // 3. Save text settings
      const res = await fetch('/api/admin/settings/video', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge, title, subtitle, url })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao salvar configurações');

      window.showToast?.('Vídeo Propaganda e configurações salvos e ativos na Home!', 'success');
      currentVideoData = data.video;
      updateVideoPreview(currentVideoData);

      setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
      }, 3000);
    } catch (err) {
      alert('Erro ao salvar vídeo: ' + err.message);
    } finally {
      saveBtn.textContent = '💾 Salvar Todas as Alterações do Vídeo Propaganda';
      saveBtn.disabled = false;
    }
  });

  // 4. GESTÃO DOS 5 PLANOS & FRENTES DE CADA SITE (MOCKUPS)
  async function loadPlans() {
    const container = document.getElementById('admin-plans-list');
    if (!container) return;
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      const plans = data.plans || [];

      container.innerHTML = plans.map(p => {
        const mockupSrc = p.mockupImage && (p.mockupImage.startsWith('/') || p.mockupImage.startsWith('http')) 
          ? p.mockupImage 
          : (p.mockupImage ? `/assets/images/${p.mockupImage}` : '/assets/images/zunko-logo.png');

        return `
          <div class="border border-slate-700/60 rounded-2xl p-5 bg-[#091226] text-white shadow-lg flex flex-col justify-between" id="card-plan-${p.id}">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-base text-white">${p.name}</h4>
                <span class="text-xs bg-cyan-950 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full font-semibold">${p.pagesLimit}</span>
              </div>
              <p class="text-xs text-slate-400 mb-3">${p.tagline}</p>

              <!-- Frente do Site (Mockup Atual & Preview) -->
              <div class="mb-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/70">
                <label class="text-xs font-bold text-cyan-400 block mb-1.5 flex items-center justify-between">
                  <span>🖼️ Frente do Site (Mockup / Tela Inicial):</span>
                </label>
                
                <div class="aspect-video rounded-xl overflow-hidden bg-black/90 border border-slate-700 mb-2 relative group flex items-center justify-center shadow-inner">
                  <img src="${mockupSrc}" alt="${p.name}" class="w-full h-full object-cover plan-preview-img-${p.id}" onerror="this.onerror=null; this.src='/assets/images/zunko-logo.png';">
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                    Foto Atual do Site
                  </div>
                </div>

                <!-- Mensagem de status do arquivo -->
                <div class="plan-status-msg-${p.id} text-[11px] text-slate-400 mb-2">
                  Imagem gravada no servidor.
                </div>

                <!-- Input de Seleção de Arquivo -->
                <div>
                  <label class="block text-[11px] font-bold text-slate-300 mb-1">Escolher nova imagem da frente:</label>
                  <input type="file" accept="image/*" class="w-full text-xs text-slate-300 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-800/90 p-2 rounded-xl border border-slate-700 plan-file-input" data-plan-id="${p.id}">
                </div>
              </div>

              <!-- Preço e Prazo -->
              <div class="mb-3">
                <label class="text-xs font-semibold text-slate-300 block mb-1">Preço Atual (R$):</label>
                <input type="number" step="0.01" class="border border-slate-700 rounded-lg px-3 py-1.5 w-full text-sm font-bold text-cyan-400 bg-slate-800 plan-price-input" data-plan-id="${p.id}" value="${p.price}">
              </div>
              <div class="mb-4">
                <label class="text-xs font-semibold text-slate-300 block mb-1">Prazo de Entrega:</label>
                <input type="text" class="border border-slate-700 rounded-lg px-3 py-1.5 w-full text-sm text-white bg-slate-800 plan-prazo-input" data-plan-id="${p.id}" value="${p.prazo}">
              </div>
            </div>

            <!-- Botão Unificado: Salva Foto + Preço + Prazo num só clique -->
            <button type="button" class="btn-primary w-full text-xs py-3 font-bold shadow-lg save-plan-btn flex items-center justify-center gap-2" data-plan-id="${p.id}">
              <span>💾 Salvar Alterações do Plano</span>
            </button>
          </div>
        `;
      }).join('');

      // 1. Instant Preview when file is selected
      container.querySelectorAll('.plan-file-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const planId = input.getAttribute('data-plan-id');
          const file = input.files?.[0];
          const imgEl = container.querySelector(`.plan-preview-img-${planId}`);
          const statusEl = container.querySelector(`.plan-status-msg-${planId}`);

          if (file && imgEl) {
            const previewUrl = URL.createObjectURL(file);
            imgEl.src = previewUrl;
            if (statusEl) {
              statusEl.innerHTML = `<span class="text-amber-400 font-bold">⚠️ Foto "${file.name}" selecionada! Clique no botão azul abaixo para salvar.</span>`;
            }
          }
        });
      });

      // 2. Save Button: uploads file (if selected) AND updates price & deadline
      container.querySelectorAll('.save-plan-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const planId = btn.getAttribute('data-plan-id');
          const fileInput = container.querySelector(`.plan-file-input[data-plan-id="${planId}"]`);
          const priceInput = container.querySelector(`.plan-price-input[data-plan-id="${planId}"]`);
          const prazoInput = container.querySelector(`.plan-prazo-input[data-plan-id="${planId}"]`);
          const statusEl = container.querySelector(`.plan-status-msg-${planId}`);
          const imgEl = container.querySelector(`.plan-preview-img-${planId}`);

          const originalText = btn.innerHTML;
          btn.innerHTML = `<span>⏳ Enviando foto e salvando...</span>`;
          btn.disabled = true;

          try {
            let uploadedUrl = null;

            // Se tem arquivo de imagem selecionado, faz o upload para o servidor!
            if (fileInput.files && fileInput.files.length > 0) {
              const file = fileInput.files[0];
              const formData = new FormData();
              formData.append('mockupFile', file);

              const uploadRes = await fetch(`/api/admin/upload/plan-mockup/${planId}`, {
                method: 'POST',
                body: formData
              });
              const uploadData = await uploadRes.json();
              if (!uploadData.success) throw new Error(uploadData.error || 'Erro no upload da foto');

              uploadedUrl = uploadData.mockupImage;
              if (imgEl) imgEl.src = uploadedUrl + '?t=' + Date.now();
            }

            // Atualiza preço e prazo
            const newPrice = parseFloat(priceInput.value);
            const newPrazo = prazoInput.value.trim();

            const updateRes = await fetch(`/api/admin/plans/${planId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ price: newPrice, prazo: newPrazo })
            });
            const updateData = await updateRes.json();
            if (!updateData.success) throw new Error(updateData.error || 'Erro ao atualizar dados do plano');

            if (statusEl) {
              statusEl.innerHTML = `<span class="text-emerald-400 font-bold">✅ Imagem e dados salvos no servidor com sucesso!</span>`;
            }

            window.showToast?.(`Plano ${planId} e foto da frente salvos com sucesso!`, 'success');
            fileInput.value = ''; // Limpa para nova seleção futura se desejar
          } catch (err) {
            alert('Erro ao salvar alterações: ' + err.message);
            if (statusEl) {
              statusEl.innerHTML = `<span class="text-red-400 font-bold">❌ Erro: ${err.message}</span>`;
            }
          } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // 5. GESTÃO DAS FRENTES DOS SITES DE DEMONSTRAÇÃO (PORTFÓLIO)
  async function loadPortfolio() {
    const container = document.getElementById('admin-portfolio-list');
    if (!container) return;
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      const portfolio = data.portfolio || [];

      if (portfolio.length === 0) {
        container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-sm">Nenhum site demonstrativo cadastrado. Clique no botão acima para adicionar.</div>`;
        return;
      }

      container.innerHTML = portfolio.map(item => {
        const imgSrc = item.image && item.image.length > 0 ? item.image : '/assets/images/zunko-logo.png';
        return `
          <div class="border border-slate-700/60 rounded-2xl p-5 bg-[#091226] text-white shadow-lg flex flex-col justify-between" id="portfolio-card-${item.id}">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] bg-blue-900 border border-blue-500/40 text-cyan-300 font-bold px-2 py-0.5 rounded uppercase">${item.category || 'Geral'}</span>
                <button type="button" class="text-red-400 hover:text-red-300 text-xs font-bold btn-delete-portfolio" data-id="${item.id}">
                  Excluir ✕
                </button>
              </div>

              <!-- Imagem da Frente do Site no Navegador -->
              <div class="mb-3 bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                <div class="bg-slate-800 px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span class="w-2 h-2 rounded-full bg-red-500"></span>
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="ml-2 font-mono text-slate-400">${item.domain || 'site-modelo.com.br'}</span>
                </div>
                <div class="aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img src="${imgSrc}" alt="${item.title}" class="w-full h-full object-cover portfolio-img-${item.id}" onerror="this.onerror=null; this.src='/assets/images/zunko-logo.png';">
                </div>
              </div>

              <!-- Status do arquivo de portfólio -->
              <div class="port-status-msg-${item.id} text-[11px] text-slate-400 mb-2">
                Foto salva no servidor.
              </div>

              <!-- Upload da Foto da Frente -->
              <div class="mb-3 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Subir nova foto para este modelo:</label>
                <input type="file" accept="image/*" class="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-bold file:bg-slate-700 file:text-white cursor-pointer portfolio-file-input" data-id="${item.id}">
              </div>

              <div class="space-y-2 mb-4">
                <div>
                  <label class="text-[11px] font-bold text-slate-400 block">Título do Projeto:</label>
                  <input type="text" class="w-full border border-slate-700 bg-slate-800 rounded-lg p-1.5 text-xs text-white font-bold port-title-${item.id}" value="${item.title || ''}">
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-400 block">Segmento / Categoria:</label>
                  <input type="text" class="w-full border border-slate-700 bg-slate-800 rounded-lg p-1.5 text-xs text-white port-cat-${item.id}" value="${item.category || ''}" placeholder="Ex: Gastronomia, Moda, Saúde...">
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-400 block">Domínio Fictício:</label>
                  <input type="text" class="w-full border border-slate-700 bg-slate-800 rounded-lg p-1.5 text-xs text-white port-dom-${item.id}" value="${item.domain || ''}">
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-400 block">Descrição Resumida:</label>
                  <input type="text" class="w-full border border-slate-700 bg-slate-800 rounded-lg p-1.5 text-xs text-white port-desc-${item.id}" value="${item.description || ''}">
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-400 block">Plano Recomendado:</label>
                  <input type="text" class="w-full border border-slate-700 bg-slate-800 rounded-lg p-1.5 text-xs text-white port-plan-${item.id}" value="${item.planRecommended || 'Profissional'}">
                </div>
              </div>
            </div>

            <!-- Botão Unificado do Portfólio -->
            <button type="button" class="btn-primary w-full text-xs py-2.5 font-bold btn-save-portfolio-item flex items-center justify-center gap-1.5" data-id="${item.id}">
              <span>💾 Salvar Dados do Modelo</span>
            </button>
          </div>
        `;
      }).join('');

      // 1. Instant Preview on portfolio file selection
      container.querySelectorAll('.portfolio-file-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = input.getAttribute('data-id');
          const file = input.files?.[0];
          const imgEl = container.querySelector(`.portfolio-img-${id}`);
          const statusEl = container.querySelector(`.port-status-msg-${id}`);

          if (file && imgEl) {
            imgEl.src = URL.createObjectURL(file);
            if (statusEl) {
              statusEl.innerHTML = `<span class="text-amber-400 font-bold">⚠️ Foto selecionada! Clique no botão azul "Salvar Dados do Modelo" abaixo para gravar.</span>`;
            }
          }
        });
      });

      // 2. Save Button: uploads image (if selected) AND saves text fields
      container.querySelectorAll('.btn-save-portfolio-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const fileInput = container.querySelector(`.portfolio-file-input[data-id="${id}"]`);
          const title = container.querySelector(`.port-title-${id}`).value.trim();
          const category = container.querySelector(`.port-cat-${id}`).value.trim();
          const domain = container.querySelector(`.port-dom-${id}`).value.trim();
          const description = container.querySelector(`.port-desc-${id}`).value.trim();
          const planRecommended = container.querySelector(`.port-plan-${id}`).value.trim();
          const statusEl = container.querySelector(`.port-status-msg-${id}`);
          const imgEl = container.querySelector(`.portfolio-img-${id}`);

          const originalText = btn.innerHTML;
          btn.innerHTML = `<span>⏳ Enviando foto e salvando...</span>`;
          btn.disabled = true;

          try {
            // Upload file if selected
            if (fileInput.files && fileInput.files.length > 0) {
              const file = fileInput.files[0];
              const formData = new FormData();
              formData.append('portfolioFile', file);

              const uploadRes = await fetch(`/api/admin/upload/portfolio/${id}`, {
                method: 'POST',
                body: formData
              });
              const uploadData = await uploadRes.json();
              if (!uploadData.success) throw new Error(uploadData.error || 'Erro no upload da foto');

              if (imgEl) imgEl.src = uploadData.image + '?t=' + Date.now();
            }

            // Save details
            const res = await fetch('/api/admin/portfolio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, title, category, domain, description, planRecommended })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Erro ao salvar');

            if (statusEl) {
              statusEl.innerHTML = `<span class="text-emerald-400 font-bold">✅ Modelo e foto gravados com sucesso!</span>`;
            }

            window.showToast?.(`Modelo "${title}" atualizado com sucesso!`, 'success');
            fileInput.value = '';
          } catch (err) {
            alert('Erro ao salvar modelo: ' + err.message);
          } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        });
      });

      // Delete portfolio item
      container.querySelectorAll('.btn-delete-portfolio').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Deseja realmente excluir este modelo demonstrativo?')) return;

          try {
            const res = await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.success) throw new Error('Erro ao excluir');
            window.showToast?.('Modelo removido com sucesso!', 'success');
            loadPortfolio();
          } catch (err) {
            alert('Erro ao excluir: ' + err.message);
          }
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Add new demo site button
  document.getElementById('btn-add-portfolio-item')?.addEventListener('click', async () => {
    const newItem = {
      id: 'demo-' + Date.now(),
      title: 'Novo Modelo de Site',
      category: 'Serviços',
      categorySlug: 'empresas',
      domain: 'novomodelo.com.br',
      description: 'Estrutura profissional com foco em captação de clientes.',
      planRecommended: 'Profissional',
      image: '',
      demoUrl: '/planos/profissional'
    };

    try {
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (!data.success) throw new Error('Erro ao adicionar');
      window.showToast?.('Novo modelo adicionado! Agora suba a foto da frente dele.', 'success');
      loadPortfolio();
    } catch (err) {
      alert('Erro ao adicionar modelo: ' + err.message);
    }
  });

  // 6. LEADS
  async function loadLeads() {
    const container = document.getElementById('leads-table-body');
    if (!container) return;
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      const leads = data.leads || [];

      if (leads.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-500 text-sm">Nenhum contato recebido no momento.</td></tr>`;
        return;
      }

      container.innerHTML = leads.map(l => `
        <tr class="border-b text-sm hover:bg-slate-50">
          <td class="py-3 px-4 font-semibold text-slate-900">${l.name}</td>
          <td class="py-3 px-4 text-slate-600">${l.email}<br><span class="text-xs text-slate-400">${l.phone}</span></td>
          <td class="py-3 px-4 font-medium text-slate-700">${l.subject || 'Contato Geral'}</td>
          <td class="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">${l.message}</td>
          <td class="py-3 px-4 text-right text-xs text-slate-400">${new Date(l.createdAt).toLocaleDateString('pt-BR')}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  }

  // 6. PAYMENT SETTINGS (PIX & PAGBANK)
  async function loadPaymentSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const p = data.settings?.payment || {};

      const pixKeyInput = document.getElementById('cfg-pix-key');
      const pixBenInput = document.getElementById('cfg-pix-beneficiary');
      const pixBankInput = document.getElementById('cfg-pix-bank');
      const waConfirmInput = document.getElementById('cfg-whatsapp-confirm');

      if (pixKeyInput && p.pixKey) pixKeyInput.value = p.pixKey;
      if (pixBenInput && p.pixBeneficiary) pixBenInput.value = p.pixBeneficiary;
      if (pixBankInput && p.pixBank) pixBankInput.value = p.pixBank;
      if (waConfirmInput && p.whatsappConfirm) waConfirmInput.value = p.whatsappConfirm;

      // Plan links
      const planKeys = ['essencial', 'profissional', 'empresarial-avancado', 'premium', 'completo-sofisticado'];
      planKeys.forEach(k => {
        const inp = document.getElementById(`cfg-link-${k}`);
        if (inp && p.planCardLinks && p.planCardLinks[k]) {
          inp.value = p.planCardLinks[k];
        }
      });

      // Promo checkbox
      const promoActiveInput = document.getElementById('cfg-promo-active');
      if (promoActiveInput) {
        promoActiveInput.checked = Boolean(data.settings?.promo?.active ?? true);
      }
    } catch (e) {
      console.error('Erro ao carregar dados de pagamento:', e);
    }
  }

  const paymentForm = document.getElementById('admin-payment-form');
  paymentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-payment-cfg');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Salvando...';
    }

    const isPromoActive = document.getElementById('cfg-promo-active')?.checked ?? true;

    const planCardLinks = {
      'essencial': document.getElementById('cfg-link-essencial')?.value.trim() || '',
      'profissional': document.getElementById('cfg-link-profissional')?.value.trim() || '',
      'empresarial-avancado': document.getElementById('cfg-link-empresarial-avancado')?.value.trim() || '',
      'premium': document.getElementById('cfg-link-premium')?.value.trim() || '',
      'completo-sofisticado': document.getElementById('cfg-link-completo-sofisticado')?.value.trim() || ''
    };

    const payload = {
      promo: {
        active: isPromoActive,
        badgeText: '🔥 OFERTA POR TEMPO LIMITADO • R$ 400 OFF',
        bannerText: '🔥 OFERTA DE LANÇAMENTO: TODOS OS PLANOS COM R$ 400 DE DESCONTO + 5% NO PIX À VISTA!',
        discount: 400
      },
      payment: {
        pixKey: document.getElementById('cfg-pix-key').value.trim(),
        pixBeneficiary: document.getElementById('cfg-pix-beneficiary').value.trim(),
        pixBank: document.getElementById('cfg-pix-bank').value.trim(),
        cardPaymentLink: planCardLinks['profissional'] || '',
        whatsappConfirm: document.getElementById('cfg-whatsapp-confirm').value.trim(),
        planCardLinks
      }
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        window.showToast?.('Configurações de PIX e PagBank salvas com sucesso!', 'success');
      } else {
        alert(data.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Salvar Configurações de Pagamento';
      }
    }
  });

  checkAuth();
});
