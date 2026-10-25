// Carrinho de Compras Interativo com WhatsApp

let cart = JSON.parse(localStorage.getItem('petiscaria_cart') || '[]');

function saveCart() {
  localStorage.setItem('petiscaria_cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: parseFloat(price), qty: 1 });
  }
  saveCart();
  showToast(`✅ "${name}" adicionado ao pedido!`);
}

function changeQty(id, delta) {
  const item = cart.find(item => item.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
}

function updateCartUI() {
  const countBadge = document.getElementById('cart-count');
  const itemsContainer = document.getElementById('cart-items-container');
  const totalDisplay = document.getElementById('cart-total-val');

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (countBadge) {
    countBadge.innerText = totalItems;
  }

  if (totalDisplay) {
    totalDisplay.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
  }

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty-msg">
          <p style="font-size: 2.5rem; margin-bottom: 10px;">🍢</p>
          <p>Seu pedido está vazio.</p>
          <p style="font-size: 0.85rem; color: #64748b;">Escolha os melhores petiscos e bebidas do cardápio!</p>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')} (${item.qty}x R$ ${item.price.toFixed(2).replace('.', ',')})</div>
          </div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
            <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.qty}</span>
            <button class="cart-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function toggleCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) {
    modal.classList.toggle('open');
  }
}

function sendWhatsAppOrder() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio! Escolha algum item antes de finalizar.");
    return;
  }

  const nameInput = document.getElementById('client-name');
  const addressInput = document.getElementById('client-address');
  const paymentInput = document.getElementById('client-payment');

  const clientName = nameInput ? nameInput.value.trim() : '';
  const clientAddress = addressInput ? addressInput.value.trim() : '';
  const clientPayment = paymentInput ? paymentInput.value : 'PIX';

  if (!clientName) {
    alert("Por favor, digite seu nome.");
    if (nameInput) nameInput.focus();
    return;
  }

  if (!clientAddress) {
    alert("Por favor, digite seu endereço ou informe se vai retirar no local.");
    if (addressInput) addressInput.focus();
    return;
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  let msg = `🔥 *NOVO PEDIDO - BRASA & PETISCO DELIVERY* 🔥\n\n`;
  msg += `👤 *Cliente:* ${clientName}\n`;
  msg += `📍 *Endereço / Retirada:* ${clientAddress}\n`;
  msg += `💳 *Forma de Pagamento:* ${clientPayment}\n\n`;
  msg += `📋 *ITENS DO PEDIDO:*\n`;

  cart.forEach(item => {
    msg += `▪ ${item.qty}x ${item.name} - R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}\n`;
  });

  msg += `\n💰 *VALOR TOTAL:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\n`;
  msg += `🕒 *Horário do pedido:* ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
  msg += `Por favor, confirmem o tempo estimado de entrega! 🙏`;

  const phone = "5521999999999"; // Número demonstrativo para a demo
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function showToast(text) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#10b981';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '25px';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    toast.style.zIndex = '3000';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    document.body.appendChild(toast);
  }
  toast.innerText = text;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2200);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
});
