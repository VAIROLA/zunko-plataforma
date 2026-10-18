// ZUNKO - Briefing Form Script
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('pedido');

  const briefingForm = document.getElementById('briefing-form');
  const orderBadge = document.getElementById('briefing-order-badge');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const submitBtn = document.getElementById('submit-briefing-btn');

  if (orderBadge && orderId) {
    orderBadge.textContent = `Pedido Vinculado: ${orderId}`;
  }

  // Load existing briefing if saved
  if (orderId) {
    try {
      const res = await fetch(`/api/briefing/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.briefing) {
          populateForm(data.briefing);
        }
      }
    } catch (err) {
      console.log('Sem briefing prévio para carregar.');
    }
  }

  // Also check local draft in localStorage
  const localDraft = localStorage.getItem(`zunko_briefing_${orderId || 'draft'}`);
  if (localDraft) {
    try {
      const parsed = JSON.parse(localDraft);
      populateForm(parsed);
    } catch (e) {}
  }

  function getFormData() {
    return {
      companyName: document.getElementById('bf-company-name')?.value || '',
      segment: document.getElementById('bf-segment')?.value || '',
      goal: document.getElementById('bf-goal')?.value || '',
      audience: document.getElementById('bf-audience')?.value || '',
      servicesDescription: document.getElementById('bf-services')?.value || '',
      colorsPreferences: document.getElementById('bf-colors')?.value || '',
      referenceSites: document.getElementById('bf-references')?.value || '',
      socialMedia: document.getElementById('bf-social')?.value || '',
      institutionalText: document.getElementById('bf-institutional')?.value || '',
      existingDomain: document.getElementById('bf-domain')?.value || '',
      contactDetails: document.getElementById('bf-contacts')?.value || '',
      additionalRequests: document.getElementById('bf-additionals')?.value || ''
    };
  }

  function populateForm(data) {
    if (!data) return;
    Object.keys(data).forEach(key => {
      const el = document.getElementById(`bf-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`);
      if (el && data[key]) el.value = data[key];
    });
  }

  // Save Draft button
  saveDraftBtn?.addEventListener('click', () => {
    const data = getFormData();
    localStorage.setItem(`zunko_briefing_${orderId || 'draft'}`, JSON.stringify(data));
    window.showToast?.('Rascunho salvo no seu navegador!', 'info');
  });

  // Submit Briefing
  briefingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!orderId) {
      alert('Número do pedido não identificado. Conecte o briefing a um pedido válido.');
      return;
    }

    const payload = getFormData();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando Briefing...';

    try {
      const res = await fetch(`/api/briefing/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem(`zunko_briefing_${orderId}`);
        window.showToast?.('Briefing enviado com sucesso para a equipe ZUNKO!', 'success');
        setTimeout(() => {
          window.location.href = `/area-cliente.html?pedido=${orderId}`;
        }, 1500);
      } else {
        alert('Erro ao salvar briefing. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Briefing Completo';
    }
  });
});
