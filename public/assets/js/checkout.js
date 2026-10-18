// ZUNKO - Interactive Checkout & Payment Flow
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlanId = urlParams.get('plano') || 'profissional';

  let currentStep = 1;
  let plansData = [];
  let maintenanceData = [];
  let currentPlan = null;
  let selectedMaintenance = null;
  let paymentMethod = 'pix';
  let createdOrder = null;

  // DOM elements
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const stepPanels = document.querySelectorAll('.step-panel');
  const btnNextToStep2 = document.getElementById('btn-step1-next');
  const btnBackToStep1 = document.getElementById('btn-step2-back');
  const btnNextToStep3 = document.getElementById('btn-step2-next');
  const btnBackToStep2 = document.getElementById('btn-step3-back');
  const btnConfirmPayment = document.getElementById('btn-confirm-payment');

  let paymentConfig = {
    pixKey: 'zunko.sites@hotmail.com',
    pixBeneficiary: 'Ailton Paulo dos Santos',
    pixBank: 'PagBank (PagSeguro)',
    cardPaymentLink: 'https://pag.ae/82f_vqcun',
    whatsappConfirm: '5521966725240',
    planCardLinks: {
      'essencial': 'https://pag.ae/82f_w8JnR',
      'profissional': 'https://pag.ae/82f_vqcun',
      'empresarial-avancado': 'https://pag.ae/82f_uXghH',
      'premium': 'https://pag.ae/82f_sU9Ba',
      'completo-sofisticado': 'https://pag.ae/82f_rxTVn'
    }
  };

  // Load plans & payment settings from API
  try {
    const [resPlans, resSettings] = await Promise.all([
      fetch('/api/plans'),
      fetch('/api/settings').catch(() => null)
    ]);
    const data = await resPlans.json();
    plansData = data.plans || [];
    maintenanceData = data.maintenancePlans || [];
    currentPlan = plansData.find(p => p.id === selectedPlanId) || plansData[1] || plansData[0];

    if (resSettings && resSettings.ok) {
      const dataSettings = await resSettings.json();
      if (dataSettings.settings?.payment) {
        paymentConfig = { ...paymentConfig, ...dataSettings.settings.payment };
      }
    }

    initStep1();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }

  function formatMoney(val) {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function initStep1() {
    // Populate plan summary
    const planNameEl = document.getElementById('summary-plan-name');
    const planTaglineEl = document.getElementById('summary-plan-tagline');
    const planPagesEl = document.getElementById('summary-plan-pages');
    const planPrazoEl = document.getElementById('summary-plan-prazo');
    const planPriceEl = document.getElementById('summary-plan-price');
    const planFeaturesEl = document.getElementById('summary-plan-features');
    const planSelectDropdown = document.getElementById('change-plan-select');

    if (planNameEl) planNameEl.textContent = currentPlan.name;
    if (planTaglineEl) planTaglineEl.textContent = currentPlan.tagline;
    if (planPagesEl) planPagesEl.textContent = currentPlan.pagesLimit;
    if (planPrazoEl) planPrazoEl.textContent = currentPlan.prazo;
    if (planPriceEl) {
      if (currentPlan.isPromo && currentPlan.originalPrice) {
        planPriceEl.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs line-through text-slate-400 font-normal">De ${formatMoney(currentPlan.originalPrice)}</span>
            <span class="text-emerald-600 font-extrabold text-lg">${formatMoney(currentPlan.price)}</span>
            <span class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase">R$ 400 OFF</span>
          </div>
        `;
      } else {
        planPriceEl.textContent = formatMoney(currentPlan.price);
      }
    }

    if (planFeaturesEl) {
      planFeaturesEl.innerHTML = currentPlan.features.map(f => `
        <li class="flex items-center gap-2 text-sm text-slate-700">
          <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
          <span>${f}</span>
        </li>
      `).join('');
    }

    if (planSelectDropdown) {
      planSelectDropdown.innerHTML = plansData.map(p => `
        <option value="${p.id}" ${p.id === currentPlan.id ? 'selected' : ''}>${p.name} - ${formatMoney(p.price)}</option>
      `).join('');

      planSelectDropdown.addEventListener('change', (e) => {
        currentPlan = plansData.find(p => p.id === e.target.value);
        initStep1();
        calculateTotals();
      });
    }

    // Populate maintenance addons
    const maintenanceContainer = document.getElementById('maintenance-options-container');
    if (maintenanceContainer) {
      maintenanceContainer.innerHTML = `
        <label class="flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition ${!selectedMaintenance ? 'border-zunko-blue bg-blue-50/40' : 'border-slate-200'}">
          <input type="radio" name="maintenance-radio" value="" ${!selectedMaintenance ? 'checked' : ''} class="mt-1 text-zunko-blue focus:ring-zunko-blue">
          <div>
            <div class="font-semibold text-sm text-slate-900">Sem plano de manutenção agora</div>
            <div class="text-xs text-slate-500">Você poderá contratar separadamente após a entrega do site.</div>
          </div>
        </label>
      ` + maintenanceData.map(m => `
        <label class="flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition ${selectedMaintenance?.id === m.id ? 'border-zunko-blue bg-blue-50/40' : 'border-slate-200'}">
          <input type="radio" name="maintenance-radio" value="${m.id}" ${selectedMaintenance?.id === m.id ? 'checked' : ''} class="mt-1 text-zunko-blue focus:ring-zunko-blue">
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-slate-900">${m.name}</span>
              <span class="font-bold text-sm text-zunko-blue">${formatMoney(m.price)}/${m.period}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${m.scope}</div>
          </div>
        </label>
      `).join('');

      const radios = maintenanceContainer.querySelectorAll('input[name="maintenance-radio"]');
      radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (!e.target.value) {
            selectedMaintenance = null;
          } else {
            selectedMaintenance = maintenanceData.find(m => m.id === e.target.value);
          }
          initStep1();
          calculateTotals();
        });
      });
    }

    calculateTotals();
  }

  function calculateTotals() {
    let subtotal = currentPlan ? currentPlan.price : 0;
    let maintenancePrice = selectedMaintenance ? selectedMaintenance.price : 0;
    
    // PIX 5% discount on creation
    let discount = paymentMethod === 'pix' ? (subtotal * 0.05) : 0;
    let total = (subtotal - discount) + maintenancePrice;

    const elSubtotal = document.getElementById('calc-subtotal');
    const elOriginalRow = document.getElementById('calc-original-row');
    const elOriginal = document.getElementById('calc-original');
    const elPromoRow = document.getElementById('calc-promo-row');
    const elPromo = document.getElementById('calc-promo');
    const elDiscountRow = document.getElementById('calc-discount-row');
    const elDiscount = document.getElementById('calc-discount');
    const elMaintenanceRow = document.getElementById('calc-maintenance-row');
    const elMaintenance = document.getElementById('calc-maintenance');
    const elTotal = document.getElementById('calc-total');
    const elPixBadge = document.getElementById('pix-discount-badge');

    if (currentPlan && currentPlan.isPromo && currentPlan.originalPrice) {
      if (elOriginalRow && elOriginal) {
        elOriginalRow.classList.remove('hidden');
        elOriginal.textContent = formatMoney(currentPlan.originalPrice);
      }
      if (elPromoRow && elPromo) {
        elPromoRow.classList.remove('hidden');
        const diff = currentPlan.originalPrice - currentPlan.price;
        elPromo.textContent = `- ${formatMoney(diff)} (Economia)`;
      }
    } else {
      if (elOriginalRow) elOriginalRow.classList.add('hidden');
      if (elPromoRow) elPromoRow.classList.add('hidden');
    }

    if (elSubtotal) elSubtotal.textContent = formatMoney(subtotal);
    
    if (elDiscountRow && elDiscount) {
      if (paymentMethod === 'pix' && discount > 0) {
        elDiscountRow.classList.remove('hidden');
        elDiscount.textContent = `- ${formatMoney(discount)} (5% desconto)`;
      } else {
        elDiscountRow.classList.add('hidden');
      }
    }

    if (elMaintenanceRow && elMaintenance) {
      if (selectedMaintenance) {
        elMaintenanceRow.classList.remove('hidden');
        elMaintenance.textContent = `${selectedMaintenance.name} (${formatMoney(maintenancePrice)}/mês)`;
      } else {
        elMaintenanceRow.classList.add('hidden');
      }
    }

    if (elTotal) elTotal.textContent = formatMoney(total);
    if (elPixBadge) elPixBadge.textContent = paymentMethod === 'pix' ? '5% OFF APLICADO' : '';

    updatePaymentDetails(total);
  }

  function updatePaymentDetails(total) {
    // PIX total display
    const pixTotalEl = document.getElementById('pix-final-amount');
    if (pixTotalEl) pixTotalEl.textContent = formatMoney(total);

    // PIX dynamic QR Code and values from PagBank config
    const pixQrImg = document.getElementById('pix-qrcode-img');
    const pixKeyEl = document.getElementById('pix-key-display');
    const pixBeneficiaryEl = document.getElementById('pix-beneficiary-display');
    const pixBankEl = document.getElementById('pix-bank-display');
    const pagbankContainer = document.getElementById('pagbank-link-container');
    const pagbankOfficialBtn = document.getElementById('pagbank-official-btn');
    const activeCardLink = (currentPlan && currentPlan.cardPaymentLink) ||
                           (paymentConfig.planCardLinks && currentPlan && paymentConfig.planCardLinks[currentPlan.id]) ||
                           paymentConfig.cardPaymentLink;

    if (pagbankContainer) {
      if (activeCardLink && activeCardLink.trim() !== '') {
        pagbankContainer.classList.remove('hidden');
        if (pagbankOfficialBtn) {
          pagbankOfficialBtn.href = activeCardLink;
          const planName = currentPlan ? currentPlan.name : 'Plano';
          const planPrice = currentPlan ? formatMoney(currentPlan.price) : '';
          pagbankOfficialBtn.innerHTML = `
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            <span class="font-bold">Pagar ${planName} (${planPrice}) no PagBank Oficial (Até 12x)</span>
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          `;
        }
      } else {
        pagbankContainer.classList.add('hidden');
      }
    }

    // QR Code dinâmico
    if (pixQrImg) {
      pixQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentConfig.pixKey)}`;
    }

    // Card installments select
    const cardInstallmentsSelect = document.getElementById('card-installments');
    if (cardInstallmentsSelect) {
      cardInstallmentsSelect.innerHTML = '';
      for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        if (i === 1) {
          option.textContent = `1x de ${formatMoney(total)} (sem juros)`;
        } else if (i <= 6) {
          const installmentVal = total / i;
          option.textContent = `${i}x de ${formatMoney(installmentVal)} (sem juros)`;
        } else {
          // Standard low card gateway interest
          const installmentWithInterest = (total * 1.08) / i;
          option.textContent = `${i}x de ${formatMoney(installmentWithInterest)} (c/ juros gateway)`;
        }
        cardInstallmentsSelect.appendChild(option);
      }
    }
  }

  function goToStep(step) {
    currentStep = step;
    stepPanels.forEach((panel, idx) => {
      if (idx + 1 === step) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    stepIndicators.forEach((ind, idx) => {
      const circle = ind.querySelector('.step-circle');
      if (idx + 1 < step) {
        circle.className = 'step-circle w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm';
        circle.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
      } else if (idx + 1 === step) {
        circle.className = 'step-circle w-8 h-8 rounded-full bg-zunko-blue text-white flex items-center justify-center font-bold text-sm shadow-md';
        circle.textContent = idx + 1;
      } else {
        circle.className = 'step-circle w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm';
        circle.textContent = idx + 1;
      }
    });

    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  // Step 1 -> Step 2
  btnNextToStep2?.addEventListener('click', () => {
    goToStep(2);
  });

  // Step 2 -> Step 1
  btnBackToStep1?.addEventListener('click', () => {
    goToStep(1);
  });

  // Step 2 -> Step 3
  btnNextToStep3?.addEventListener('click', () => {
    // Validate required fields
    const form = document.getElementById('customer-info-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    goToStep(3);
    calculateTotals();
  });

  // Step 3 -> Step 2
  btnBackToStep2?.addEventListener('click', () => {
    goToStep(2);
  });

  // Payment method switcher
  const methodTabs = document.querySelectorAll('.payment-method-tab');
  const pixContent = document.getElementById('payment-pix-content');
  const cardContent = document.getElementById('payment-card-content');

  methodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const method = tab.getAttribute('data-method');
      paymentMethod = method;

      methodTabs.forEach(t => {
        if (t === tab) {
          t.classList.add('border-zunko-blue', 'text-zunko-blue', 'bg-blue-50/50');
          t.classList.remove('border-transparent', 'text-slate-500');
        } else {
          t.classList.remove('border-zunko-blue', 'text-zunko-blue', 'bg-blue-50/50');
          t.classList.add('border-transparent', 'text-slate-500');
        }
      });

      if (method === 'pix') {
        pixContent.classList.remove('hidden');
        cardContent.classList.add('hidden');
      } else {
        pixContent.classList.add('hidden');
        cardContent.classList.remove('hidden');
      }

      calculateTotals();
    });
  });

  // Copy PIX Key button
  const copyPixKeyBtn = document.getElementById('copy-pix-key-btn');
  copyPixKeyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(paymentConfig.pixKey);
    window.showToast?.(`Chave PIX (${paymentConfig.pixKey}) copiada com sucesso!`, 'success');
  });

  // Copy PIX Code button
  const copyPixBtn = document.getElementById('copy-pix-btn');
  const pixCodeInput = document.getElementById('pix-code-text');
  copyPixBtn?.addEventListener('click', () => {
    if (pixCodeInput) {
      navigator.clipboard.writeText(pixCodeInput.value);
      window.showToast?.('Chave PIX Copia e Cola copiada com sucesso!', 'success');
    }
  });

  // Confirm Payment & Create Order
  btnConfirmPayment?.addEventListener('click', async () => {
    const customerName = document.getElementById('cust-name').value.trim();
    const customerDoc = document.getElementById('cust-doc').value.trim();
    const customerEmail = document.getElementById('cust-email').value.trim();
    const customerPhone = document.getElementById('cust-phone').value.trim();
    const customerCompany = document.getElementById('cust-company').value.trim();
    const customerSegment = document.getElementById('cust-segment').value.trim();
    const customerNotes = document.getElementById('cust-notes').value.trim();

    btnConfirmPayment.disabled = true;
    btnConfirmPayment.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
      Processando Contratação...
    `;

    const subtotal = currentPlan.price;
    const discount = paymentMethod === 'pix' ? (subtotal * 0.05) : 0;
    const maintenancePrice = selectedMaintenance ? selectedMaintenance.price : 0;
    const totalAmount = (subtotal - discount) + maintenancePrice;

    const payload = {
      planId: currentPlan.id,
      planName: currentPlan.name,
      maintenancePlan: selectedMaintenance ? selectedMaintenance.name : null,
      maintenancePrice,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      customer: {
        name: customerName,
        document: customerDoc,
        email: customerEmail,
        phone: customerPhone,
        company: customerCompany,
        segment: customerSegment,
        notes: customerNotes
      }
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        createdOrder = resData.order;
        showOrderConfirmation(createdOrder);
        goToStep(4);
      } else {
        alert('Erro ao processar pedido. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      btnConfirmPayment.disabled = false;
      btnConfirmPayment.innerHTML = `Confirmar e Finalizar Contratação`;
    }
  });

  function showOrderConfirmation(order) {
    document.getElementById('conf-order-number').textContent = order.orderNumber;
    document.getElementById('conf-plan-name').textContent = order.planName;
    document.getElementById('conf-total-paid').textContent = formatMoney(order.totalAmount);
    document.getElementById('conf-payment-method').textContent = order.paymentMethod.toUpperCase();
    document.getElementById('conf-customer-name').textContent = order.customer.name;
    document.getElementById('conf-customer-email').textContent = order.customer.email;

    // Set PagBank Card final button link
    const btnCardFinal = document.getElementById('btn-card-pagbank-final');
    const activeCardLink = (currentPlan && currentPlan.cardPaymentLink) ||
                           (paymentConfig.planCardLinks && currentPlan && paymentConfig.planCardLinks[currentPlan.id]) ||
                           paymentConfig.cardPaymentLink;

    if (btnCardFinal) {
      if (order.paymentMethod === 'card' && activeCardLink) {
        btnCardFinal.classList.remove('hidden');
        btnCardFinal.href = activeCardLink;
      } else {
        btnCardFinal.classList.add('hidden');
      }
    }

    // Set WhatsApp Receipt button link
    const btnWhatsAppReceipt = document.getElementById('btn-whatsapp-receipt');
    if (btnWhatsAppReceipt) {
      const phone = paymentConfig.whatsappConfirm || '5521966725240';
      const msg = `Olá! Acabei de contratar o plano ${order.planName} na ZUNKO (Pedido: #${order.orderNumber}) no valor de ${formatMoney(order.totalAmount)} e estou enviando o comprovante de pagamento via PagBank.`;
      btnWhatsAppReceipt.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }

    // Set briefing link
    const briefingBtn = document.getElementById('btn-go-to-briefing');
    if (briefingBtn) {
      briefingBtn.href = `/briefing.html?pedido=${order.orderNumber}`;
    }

    const clientAreaBtn = document.getElementById('btn-go-to-client-area');
    if (clientAreaBtn) {
      clientAreaBtn.href = `/area-cliente.html?pedido=${order.orderNumber}`;
    }
  }
});
