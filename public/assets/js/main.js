// ZUNKO - Main Script
document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenuBtn = document.getElementById('close-mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      document.body.classList.toggle('overflow-hidden');
    });

    if (closeMenuBtn) {
      closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    }

    // Close when clicking nav links
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    });
  }

  // 3. Simple Toast Notification helper
  window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white';
    toast.className = `${bgClass} px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto`;
    toast.innerHTML = `
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // 4. Dynamic Data Loader (Homepage & Plan Pages)
  async function initDynamicContent() {
    // 4.1 Video Propaganda on Homepage
    const videoContainer = document.getElementById('video-player-container');
    if (videoContainer) {
      try {
        const res = await fetch('/api/settings/video');
        if (res.ok) {
          const data = await res.json();
          const v = data.video;
          if (v && v.url) {
            // Check if YouTube
            const ytMatch = v.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (ytMatch && ytMatch[1]) {
              videoContainer.innerHTML = `
                <iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0" class="w-full h-full border-0 rounded-3xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              `;
            } else {
              // Check if Vimeo
              const vimeoMatch = v.url.match(/(?:vimeo\.com\/)(\d+)/i);
              if (vimeoMatch && vimeoMatch[1]) {
                videoContainer.innerHTML = `
                  <iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" class="w-full h-full border-0 rounded-3xl" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                `;
              } else {
                // Direct uploaded video file (sem legenda sobreposta na tela do vídeo)
                videoContainer.innerHTML = `
                  <video id="home-main-video" controls playsinline class="w-full h-full object-contain bg-[#030712] rounded-3xl shadow-2xl" poster="${v.posterUrl || ''}" preload="metadata">
                    <source src="${v.url}" type="video/mp4">
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                `;
                // Notificar sistema de legendas sincronizadas abaixo do vídeo
                window.dispatchEvent(new CustomEvent('zunko:video-ready'));
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar vídeo dinâmico:', e);
      }
    }

    // 4.2 Portfolio Frentes dos Sites
    const portfolioGrid = document.getElementById('home-portfolio-grid');
    if (portfolioGrid) {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const data = await res.json();
          const items = data.portfolio || [];
          if (items.length > 0) {
            portfolioGrid.innerHTML = items.map(item => {
              const hasImage = item.image && item.image.length > 0;
              return `
                <div class="border border-cyan-500/25 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition bg-[#091533]/90 group">
                  <div class="browser-frame m-3 mb-0">
                    <div class="browser-header">
                      <span class="browser-dot red"></span>
                      <span class="browser-dot yellow"></span>
                      <span class="browser-dot green"></span>
                      <span class="browser-url">${item.domain || 'site-modelo.com.br'}</span>
                    </div>
                    <div class="aspect-[16/10] bg-slate-900 flex flex-col justify-end text-white relative overflow-hidden">
                      ${hasImage ? `
                        <img src="${item.image}" alt="${item.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                      ` : `
                        <div class="absolute inset-0 bg-gradient-to-tr from-[#050B18] via-[#091533] to-[#0A2050] z-10"></div>
                      `}
                      <div class="relative z-20 p-5">
                        <span class="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded uppercase shadow-[0_0_8px_rgba(255,107,0,0.5)]">${item.category || 'Site'}</span>
                        <h4 class="font-bold text-base mt-1 text-white">${item.title}</h4>
                        <p class="text-xs text-slate-300">${item.description || ''}</p>
                      </div>
                    </div>
                  </div>
                  <div class="p-4 flex items-center justify-between text-xs">
                    <span class="text-slate-400 font-medium">Plano recomendado: <strong class="text-cyan-300">${item.planRecommended || 'Profissional'}</strong></span>
                    <a href="${item.demoUrl || '/planos/profissional'}" class="text-cyan-400 font-bold hover:underline">Ver Detalhes →</a>
                  </div>
                </div>
              `;
            }).join('');
          }
        }
      } catch (e) {
        console.error('Erro ao carregar portfólio dinâmico:', e);
      }
    }

    // 4.3 Plan Mockups on Homepage Carousel & Individual Plan Pages
    try {
      const resPlans = await fetch('/api/plans');
      if (resPlans.ok) {
        const dataPlans = await resPlans.json();
        const plans = dataPlans.plans || [];

        // Homepage Carousel Cards & Pricing Hydration
        plans.forEach(p => {
          // Mockup Image
          if (p.mockupImage && (p.mockupImage.startsWith('/uploads/') || p.mockupImage.startsWith('http'))) {
            const mockupContainer = document.querySelector(`[data-plan-mockup="${p.id}"]`);
            if (mockupContainer) {
              mockupContainer.innerHTML = `<img src="${p.mockupImage}" alt="${p.name}" class="w-full h-full object-cover">`;
              mockupContainer.classList.remove('p-5');
              mockupContainer.classList.add('p-0');
            }
          }

          // Dynamic Card Price on Homepage
          const cardLink = document.querySelector(`a[href*="plano=${p.id}"]`);
          const card = cardLink ? cardLink.closest('.card-plan') : null;
          if (card) {
            const priceBlock = card.querySelector('.border-b.border-slate-800');
            if (priceBlock) {
              const isPromo = p.isPromo && p.originalPrice;
              const formattedPrice = Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              const formattedOriginal = isPromo ? Number(p.originalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
              const pixPrice = Number(p.price * 0.95).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              const isFeatured = card.classList.contains('featured');
              const accentColor = isFeatured ? 'text-orange-400' : 'text-cyan-400';
              const shadowGlow = isFeatured ? 'drop-shadow-[0_0_15px_rgba(255,119,0,0.5)]' : 'drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]';

              if (isPromo) {
                priceBlock.innerHTML = `
                  <div class="flex items-center justify-between gap-1 mb-1.5">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm uppercase tracking-wider animate-pulse">
                      ${p.promoBadge || '🔥 R$ 400 OFF LIMITADO'}
                    </span>
                    <span class="text-xs text-slate-400 line-through font-medium">De ${formattedOriginal}</span>
                  </div>
                  <div class="text-3xl font-extrabold ${accentColor} mt-0.5 filter ${shadowGlow}">
                    ${formattedPrice}
                  </div>
                  <div class="text-[11px] text-emerald-400 font-medium mt-1">
                    Ou ${pixPrice} no PIX (5% OFF) • Em até 12x no Cartão
                  </div>
                `;
              } else {
                priceBlock.innerHTML = `
                  <div class="text-xs text-slate-400 font-medium">Investimento total</div>
                  <div class="text-3xl font-extrabold ${accentColor} mt-0.5 filter ${shadowGlow}">
                    ${formattedPrice}
                  </div>
                  <div class="text-[11px] text-slate-400 mt-1">50% na aprovação e 50% na entrega</div>
                `;
              }
            }
          }
        });

        // Top Banner Toggle
        const topPromoBanner = document.getElementById('top-promo-banner');
        if (topPromoBanner) {
          const hasAnyPromo = plans.some(p => p.isPromo);
          if (hasAnyPromo) {
            topPromoBanner.classList.remove('hidden');
          } else {
            topPromoBanner.classList.add('hidden');
          }
        }

        // Individual Plan Detail Page
        const path = window.location.pathname.toLowerCase();
        let currentPlanId = null;
        if (path.includes('essencial')) currentPlanId = 'essencial';
        else if (path.includes('profissional')) currentPlanId = 'profissional';
        else if (path.includes('empresarial-avancado')) currentPlanId = 'empresarial-avancado';
        else if (path.includes('premium')) currentPlanId = 'premium';
        else if (path.includes('completo-sofisticado')) currentPlanId = 'completo-sofisticado';

        if (currentPlanId) {
          const currentPlan = plans.find(p => p.id === currentPlanId);
          if (currentPlan) {
            // Price Widget in individual plan page
            const priceWidget = document.querySelector('.bg-white.p-6.rounded-2xl.border-2.shadow-lg');
            if (priceWidget) {
              const priceEl = priceWidget.querySelector('.text-3xl.font-extrabold');
              const isPromo = currentPlan.isPromo && currentPlan.originalPrice;
              const formattedPrice = Number(currentPlan.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              const formattedOriginal = isPromo ? Number(currentPlan.originalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

              if (priceEl) {
                if (isPromo) {
                  priceEl.innerHTML = `
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        🔥 R$ 400 OFF LIMITADO
                      </span>
                      <span class="text-xs text-slate-400 line-through">De ${formattedOriginal}</span>
                    </div>
                    <div>${formattedPrice}</div>
                  `;
                } else {
                  priceEl.innerHTML = formattedPrice;
                }
              }
            }

            // Mockup Image
            if (currentPlan.mockupImage && (currentPlan.mockupImage.startsWith('/uploads/') || currentPlan.mockupImage.startsWith('http'))) {
              const browserFrame = document.querySelector('.browser-frame');
              if (browserFrame) {
                const header = browserFrame.querySelector('.browser-header');
                if (header && header.nextElementSibling) {
                  header.nextElementSibling.outerHTML = `
                    <div class="w-full overflow-hidden bg-slate-950 flex items-center justify-center border-t border-slate-800">
                      <img src="${currentPlan.mockupImage}" alt="${currentPlan.name}" class="w-full h-auto max-h-[580px] object-cover object-top hover:scale-[1.01] transition duration-500">
                    </div>
                  `;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Erro ao hidratar dados dinâmicos dos planos:', e);
    }
  }

  initDynamicContent();

  // 5. Contador de Visitas em Tempo Real (ignora o painel /admin)
  if (!window.location.pathname.startsWith('/admin')) {
    try {
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname })
      }).catch(() => {});
    } catch (e) {}
  }
});
