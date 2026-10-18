// ZUNKO - Customer Area & 7-Stage Order Tracker
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let orderNumber = urlParams.get('pedido');

  const searchForm = document.getElementById('search-order-form');
  const searchInput = document.getElementById('search-order-input');
  const contentArea = document.getElementById('client-order-content');
  const emptyState = document.getElementById('client-empty-state');

  const STAGES = [
    { index: 1, name: "Pedido Realizado", desc: "Seu pedido foi registrado no sistema ZUNKO." },
    { index: 2, name: "Pagamento Confirmado", desc: "Cobrança validada com sucesso pelo gateway financeiro." },
    { index: 3, name: "Aguardando Briefing", desc: "Envie as informações, referências e logotipo da sua empresa." },
    { index: 4, name: "Em Desenvolvimento", desc: "Nossa equipe está codificando e construindo o seu site." },
    { index: 5, name: "Em Revisão pelo Cliente", desc: "Link de demonstração liberado para sua conferência e testes." },
    { index: 6, name: "Ajustes Finais", desc: "Refinamentos finais de conteúdo, layout e SEO." },
    { index: 7, name: "Entregue e Publicado", desc: "Site publicado no seu domínio oficial e 100% ativo no ar!" }
  ];

  if (orderNumber) {
    loadOrderDetails(orderNumber);
  }

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = searchInput?.value.trim().toUpperCase();
    if (val) {
      loadOrderDetails(val);
      history.pushState(null, '', `?pedido=${val}`);
    }
  });

  async function loadOrderDetails(id) {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        showNotFound();
        return;
      }
      const data = await res.json();
      if (!data || !data.order) {
        showNotFound();
        return;
      }

      renderOrder(data.order, data.briefing);
    } catch (err) {
      console.error(err);
      showNotFound();
    }
  }

  function showNotFound() {
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentArea) contentArea.classList.add('hidden');
    window.showToast?.('Pedido não localizado. Verifique o código digitado.', 'error');
  }

  function renderOrder(order, briefing) {
    if (emptyState) emptyState.classList.add('hidden');
    if (contentArea) contentArea.classList.remove('hidden');

    // Header info
    document.getElementById('ord-code').textContent = order.orderNumber;
    document.getElementById('ord-plan').textContent = order.planName;
    document.getElementById('ord-date').textContent = new Date(order.createdAt).toLocaleDateString('pt-BR');
    document.getElementById('ord-client').textContent = order.customer.name;
    document.getElementById('ord-company').textContent = order.customer.company || 'Não informada';
    document.getElementById('ord-total').textContent = Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Briefing button
    const briefingBtn = document.getElementById('ord-briefing-link');
    if (briefingBtn) {
      briefingBtn.href = `/briefing.html?pedido=${order.orderNumber}`;
      if (briefing) {
        briefingBtn.innerHTML = `
          <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Ver / Atualizar Briefing Enviado</span>
        `;
      }
    }

    // Render 7 stages timeline
    const timelineContainer = document.getElementById('stages-timeline-container');
    if (timelineContainer) {
      const currentStage = order.currentStageIndex || 1;
      
      timelineContainer.innerHTML = STAGES.map(stage => {
        const isDone = stage.index < currentStage;
        const isCurrent = stage.index === currentStage;

        let badgeHtml = '';
        if (isDone) {
          badgeHtml = `<span class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg></span>`;
        } else if (isCurrent) {
          badgeHtml = `<span class="w-8 h-8 rounded-full bg-zunko-blue text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg ring-4 ring-blue-100 animate-pulse">${stage.index}</span>`;
        } else {
          badgeHtml = `<span class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm flex-shrink-0">${stage.index}</span>`;
        }

        return `
          <div class="relative flex items-start gap-4 pb-8 last:pb-0">
            ${badgeHtml}
            <div class="flex-1 -mt-0.5">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-base ${isCurrent ? 'text-zunko-blue' : isDone ? 'text-slate-900' : 'text-slate-400'}">${stage.name}</h4>
                ${isCurrent ? '<span class="text-xs bg-blue-100 text-zunko-blue font-semibold px-2 py-0.5 rounded-full">EM ANDAMENTO</span>' : ''}
                ${isDone ? '<span class="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">CONCLUÍDO</span>' : ''}
              </div>
              <p class="text-sm text-slate-500 mt-1">${stage.desc}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    // Notes
    const notesEl = document.getElementById('ord-notes');
    if (notesEl) {
      notesEl.textContent = order.internalNotes || "Nenhum comunicado adicional no momento. O time da ZUNKO está trabalhando no seu projeto!";
    }
  }
});
