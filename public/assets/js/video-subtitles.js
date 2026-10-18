/**
 * ZUNKO — Sistema de Legendas Sincronizadas em Tempo Real Abaixo do Vídeo
 * Idiomas: BR (Português para Acessibilidade/Surdos e Mudos), IN (Inglês), FR (Francês), ES (Espanhol)
 * Sincronização milissegundo a milissegundo com a fala do apresentador comercial.
 */

(function () {
  const SUBTITLES_DATA = {
    pt: [
      { start: 0.0, end: 3.5, text: "Tem uma ideia brilhante, mas não sabe como começar?" },
      { start: 3.5, end: 7.5, text: "A ZUNKO transforma sua visão em um site profissional." },
      { start: 7.5, end: 13.5, text: "Muitos empreendedores perdem oportunidades por não ter presença online." },
      { start: 13.5, end: 17.5, text: "Seu negócio merece estar visível no mundo." },
      { start: 17.5, end: 22.0, text: "Com a ZUNKO, você ganha um site rápido, bonito e pronto para vender." },
      { start: 22.0, end: 27.5, text: "Mais clientes, mais vendas, mais alcance. Seu negócio cresce com a ZUNKO, levando sua marca para o mundo inteiro." },
      { start: 27.5, end: 32.0, text: "Venha para a ZUNKO. Sua ideia ganha o mundo." },
      { start: 32.0, end: 38.25, text: "Ligue agora e comece já: WhatsApp (21) 96672-5240." }
    ],
    en: [
      { start: 0.0, end: 3.5, text: "Have a brilliant idea, but don't know where to start?" },
      { start: 3.5, end: 7.5, text: "ZUNKO transforms your vision into a professional website." },
      { start: 7.5, end: 13.5, text: "Many entrepreneurs miss opportunities because they lack an online presence." },
      { start: 13.5, end: 17.5, text: "Your business deserves to be visible to the entire world." },
      { start: 17.5, end: 22.0, text: "With ZUNKO, you get a fast, stunning website ready to sell." },
      { start: 22.0, end: 27.5, text: "More customers, more sales, greater reach. Your business grows with ZUNKO, taking your brand worldwide." },
      { start: 27.5, end: 32.0, text: "Come to ZUNKO. Your idea conquers the world." },
      { start: 32.0, end: 38.25, text: "Call now and get started today: WhatsApp +55 (21) 96672-5240." }
    ],
    fr: [
      { start: 0.0, end: 3.5, text: "Vous avez une idée brillante, mais vous ne savez pas par où commencer ?" },
      { start: 3.5, end: 7.5, text: "ZUNKO transforme votre vision en un site web professionnel." },
      { start: 7.5, end: 13.5, text: "De nombreux entrepreneurs manquent des opportunités faute de présence en ligne." },
      { start: 13.5, end: 17.5, text: "Votre entreprise mérite d'être visible dans le monde entier." },
      { start: 17.5, end: 22.0, text: "Avec ZUNKO, vous bénéficiez d'un site rapide, esthétique et prêt à vendre." },
      { start: 22.0, end: 27.5, text: "Plus de clients, plus de ventes, plus d'impact. Votre marque grandit avec ZUNKO à l'échelle mondiale." },
      { start: 27.5, end: 32.0, text: "Rejoignez ZUNKO. Votre idée conquiert le monde." },
      { start: 32.0, end: 38.25, text: "Appelez maintenant et commencez dès aujourd'hui : WhatsApp +55 (21) 96672-5240." }
    ],
    es: [
      { start: 0.0, end: 3.5, text: "¿Tienes una idea brillante, pero no sabes por dónde empezar?" },
      { start: 3.5, end: 7.5, text: "ZUNKO transforma tu visión en un sitio web profesional." },
      { start: 7.5, end: 13.5, text: "Muchos emprendedores pierden oportunidades por no tener presencia online." },
      { start: 13.5, end: 17.5, text: "Tu negocio merece ser visible para el mundo entero." },
      { start: 17.5, end: 22.0, text: "Con ZUNKO, obtienes un sitio rápido, atractivo y listo para vender." },
      { start: 22.0, end: 27.5, text: "Más clientes, más ventas, mayor alcance. Tu negocio crece con ZUNKO, llevando tu marca a todo el mundo." },
      { start: 27.5, end: 32.0, text: "Ven a ZUNKO. Tu idea conquista el mundo." },
      { start: 32.0, end: 38.25, text: "Llama ahora y comienza ya: WhatsApp +55 (21) 96672-5240." }
    ]
  };

  const PLACEHOLDERS = {
    pt: "▶️ Dê play no vídeo acima para acompanhar a fala do apresentador com legenda sincronizada.",
    en: "▶️ Play the video above to follow the presenter's speech with synchronized subtitles.",
    fr: "▶️ Lancez la vidéo ci-dessus pour suivre le discours du présentador avec sous-titres synchronisés.",
    es: "▶️ Reproduce el video para seguir el discurso del presentador con subtítulos sincronizados."
  };

  let currentSubLang = localStorage.getItem('zunko_lang') || 'pt';
  if (!SUBTITLES_DATA[currentSubLang]) currentSubLang = 'pt';
  let isSubEnabled = true;

  function getActiveVideo() {
    return document.querySelector('#video-player-container video');
  }

  function renderSubtitleBox() {
    const container = document.getElementById('video-subtitle-container');
    if (!container) return;

    container.innerHTML = `
      <div class="mt-4 p-4 sm:p-5 rounded-2xl bg-[#07132B]/95 border-2 border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all">
        
        <!-- Topo da Barra de Legendas: CC + Acessibilidade + Seletor de Idioma -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20 text-xs">
          
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-extrabold tracking-wide">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
              <span>CC • LEGENDA SINCRONIZADA</span>
            </span>

            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 font-bold" title="Recurso de acessibilidade para surdos, deficientes auditivos e inclusão global">
              <span>♿</span>
              <span class="hidden sm:inline">Acessibilidade Inclusiva</span>
            </span>
          </div>

          <!-- Botões de Idioma da Legenda -->
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-400 font-bold uppercase hidden md:inline">Idioma da Legenda:</span>
            <div class="zunko-sub-lang-wrapper inline-flex items-center bg-[#050D1E] border border-cyan-500/30 rounded-full p-0.5">
              <button type="button" class="sub-lang-btn px-2.5 py-1 rounded-full text-xs font-bold transition ${currentSubLang === 'pt' ? 'active bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(0,240,255,0.7)]' : 'text-slate-300 hover:text-white'}" data-sublang="pt">🇧🇷 BR</button>
              <button type="button" class="sub-lang-btn px-2.5 py-1 rounded-full text-xs font-bold transition ${currentSubLang === 'en' ? 'active bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(0,240,255,0.7)]' : 'text-slate-300 hover:text-white'}" data-sublang="en">🇺🇸 IN</button>
              <button type="button" class="sub-lang-btn px-2.5 py-1 rounded-full text-xs font-bold transition ${currentSubLang === 'fr' ? 'active bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(0,240,255,0.7)]' : 'text-slate-300 hover:text-white'}" data-sublang="fr">🇫🇷 FR</button>
              <button type="button" class="sub-lang-btn px-2.5 py-1 rounded-full text-xs font-bold transition ${currentSubLang === 'es' ? 'active bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(0,240,255,0.7)]' : 'text-slate-300 hover:text-white'}" data-sublang="es">🇪🇸 ES</button>
            </div>
          </div>

        </div>

        <!-- Área Principal de Exibição das Falas -->
        <div class="py-3 px-2 min-h-[72px] sm:min-h-[80px] flex items-center justify-center text-center">
          <p id="live-subtitle-text" class="text-base sm:text-lg md:text-xl font-bold text-white tracking-wide leading-relaxed transition-all duration-200">
            ${PLACEHOLDERS[currentSubLang]}
          </p>
        </div>

        <!-- Rodapé da Legenda com Indicador de Tempo da Fala -->
        <div class="pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[11px] text-slate-400">
          <div class="flex items-center gap-1.5 text-cyan-400">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span id="sub-speaker-name" class="font-bold">Apresentador Comercial ZUNKO</span>
          </div>
          <span id="sub-time-indicator" class="font-mono text-slate-400">00:00 / 00:38</span>
        </div>

      </div>
    `;

    // Escutadores dos botões de idioma da legenda
    container.querySelectorAll('.sub-lang-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const lang = this.getAttribute('data-sublang');
        setSubtitleLanguage(lang);
      });
    });
  }

  function setSubtitleLanguage(lang) {
    if (!SUBTITLES_DATA[lang]) lang = 'pt';
    currentSubLang = lang;

    // Atualiza botões
    document.querySelectorAll('.sub-lang-btn').forEach(b => {
      if (b.getAttribute('data-sublang') === lang) {
        b.className = 'sub-lang-btn px-2.5 py-1 rounded-full text-xs font-black transition active bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.7)]';
      } else {
        b.className = 'sub-lang-btn px-2.5 py-1 rounded-full text-xs font-bold transition text-slate-300 hover:text-white';
      }
    });

    // Atualiza texto da barra de legendas abaixo do vídeo
    updateSubtitleDisplay();
  }

  function updateSubtitleDisplay() {
    const textEl = document.getElementById('live-subtitle-text');
    const timeEl = document.getElementById('sub-time-indicator');
    if (!textEl) return;

    const video = getActiveVideo();
    if (!video || isNaN(video.currentTime) || video.paused && video.currentTime === 0) {
      textEl.innerHTML = `<span class="text-slate-400 font-medium">${PLACEHOLDERS[currentSubLang]}</span>`;
      if (timeEl) timeEl.textContent = "00:00 / 00:38";
      return;
    }

    const t = video.currentTime;
    if (timeEl) {
      const curMin = String(Math.floor(t / 60)).padStart(2, '0');
      const curSec = String(Math.floor(t % 60)).padStart(2, '0');
      const totalMin = String(Math.floor((video.duration || 38) / 60)).padStart(2, '0');
      const totalSec = String(Math.floor((video.duration || 38) % 60)).padStart(2, '0');
      timeEl.textContent = `${curMin}:${curSec} / ${totalMin}:${totalSec}`;
    }

    const cues = SUBTITLES_DATA[currentSubLang] || SUBTITLES_DATA.pt;
    const activeCue = cues.find(c => t >= c.start && t <= c.end);

    if (activeCue) {
      textEl.innerHTML = `
        <span class="inline-block px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-fadeIn">
          "${activeCue.text}"
        </span>
      `;
    } else {
      textEl.innerHTML = `<span class="text-slate-400 italic">...</span>`;
    }
  }

  // Monitorar o vídeo na página
  function attachVideoListener() {
    const video = getActiveVideo();
    if (!video) {
      setTimeout(attachVideoListener, 300);
      return;
    }

    // Garantir que nenhuma legenda fique sobreposta dentro do vídeo
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = 'disabled';
      }
    }
    const internalTracks = video.querySelectorAll('track');
    internalTracks.forEach(t => t.remove());

    video.addEventListener('timeupdate', updateSubtitleDisplay);
    video.addEventListener('play', updateSubtitleDisplay);
    video.addEventListener('pause', updateSubtitleDisplay);
    video.addEventListener('ended', () => {
      const textEl = document.getElementById('live-subtitle-text');
      if (textEl) {
        textEl.innerHTML = `<span class="text-cyan-300 font-bold">✨ Fim do vídeo. Escolha seu plano abaixo ou fale com a nossa equipe!</span>`;
      }
    });
  }

  // Sincronizar com mudanças globais de idioma do site (via i18n.js)
  window.addEventListener('storage', (e) => {
    if (e.key === 'zunko_lang') {
      setSubtitleLanguage(e.newValue);
    }
  });

  // Exportar função global para troca direta
  window.setVideoSubtitleLanguage = setSubtitleLanguage;

  // Escutar evento de vídeo pronto emitido pelo main.js
  window.addEventListener('zunko:video-ready', () => {
    attachVideoListener();
  });

  document.addEventListener('DOMContentLoaded', () => {
    renderSubtitleBox();
    attachVideoListener();
  });
})();
