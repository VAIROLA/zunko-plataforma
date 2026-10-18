/**
 * ZUNKO — Sistema Global de Tradução Multilíngue Completa
 * Suporte a 4 Idiomas: BR (Português), IN (Inglês), FR (Francês), ES (Espanhol)
 * Traduz 100% de todo o site, preservando o layout e persistindo a escolha do usuário.
 */

(function () {
  const LANG_CONFIG = {
    'pt': { label: 'BR', flag: '🇧🇷', name: 'Português (Brasil)' },
    'en': { label: 'IN', flag: '🇺🇸', name: 'English (Inglês)' },
    'fr': { label: 'FR', flag: '🇫🇷', name: 'Français (Francês)' },
    'es': { label: 'ES', flag: '🇪🇸', name: 'Español (Espanhol)' }
  };

  // Obter idioma atual armazenado ou padrão 'pt'
  function getCurrentLang() {
    const saved = localStorage.getItem('zunko_lang');
    if (saved && LANG_CONFIG[saved]) return saved;
    return 'pt';
  }

  // Atualizar visual dos botões de idioma (Desktop e Mobile)
  function updateUI(lang) {
    document.querySelectorAll('.zunko-lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active', 'bg-cyan-500', 'text-slate-950', 'shadow-[0_0_12px_rgba(0,240,255,0.6)]', 'font-black');
        btn.classList.remove('text-slate-300', 'hover:text-white');
      } else {
        btn.classList.remove('active', 'bg-cyan-500', 'text-slate-950', 'shadow-[0_0_12px_rgba(0,240,255,0.6)]', 'font-black');
        btn.classList.add('text-slate-300', 'hover:text-white');
      }
    });
  }

  // Disparar a tradução global no Google Translate
  window.zunkoTranslate = function (langCode) {
    if (!LANG_CONFIG[langCode]) langCode = 'pt';
    const previousLang = localStorage.getItem('zunko_lang') || 'pt';
    localStorage.setItem('zunko_lang', langCode);
    updateUI(langCode);

    // Sincronizar automaticamente as legendas do vídeo
    if (window.setVideoSubtitleLanguage) {
      window.setVideoSubtitleLanguage(langCode);
    }

    if (langCode === 'pt') {
      // Limpar cookies e restaurar o português original
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      document.cookie = 'googtrans=/pt/pt; path=/;';
      document.cookie = 'googtrans=/pt/pt; path=/; domain=' + window.location.hostname;

      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = '';
        combo.dispatchEvent(new Event('change'));
      }
      if (previousLang !== 'pt') {
        window.location.reload();
      }
      return;
    }

    // Ajustar cookie para persistência entre navegação de páginas (en, fr, es)
    const cookieVal = '/pt/' + langCode;
    document.cookie = 'googtrans=' + cookieVal + '; path=/;';
    document.cookie = 'googtrans=' + cookieVal + '; path=/; domain=' + window.location.hostname;

    // Disparar o select interno do Google Translate
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event('change'));
    } else {
      setTimeout(() => {
        const retryCombo = document.querySelector('.goog-te-combo');
        if (retryCombo) {
          retryCombo.value = langCode;
          retryCombo.dispatchEvent(new Event('change'));
        } else {
          window.location.reload();
        }
      }, 350);
    }
  };

  // Inicializador chamado pelo script do Google Translate
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({
      pageLanguage: 'pt',
      includedLanguages: 'pt,en,fr,es',
      autoDisplay: false,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');

    // Após carregar, aplicar o idioma salvo
    const current = getCurrentLang();
    if (current && current !== 'pt') {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = current;
          combo.dispatchEvent(new Event('change'));
          clearInterval(interval);
        }
        if (tries > 25) clearInterval(interval);
      }, 150);
    }
  };

  // Injetar o container invisível do Google Translate e o script oficial
  function injectGoogleScript() {
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    if (!document.getElementById('google-translate-script')) {
      const s = document.createElement('script');
      s.id = 'google-translate-script';
      s.type = 'text/javascript';
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(s);
    }
  }

  // Inicializar quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', function () {
    injectGoogleScript();

    // Adicionar escutadores de clique aos botões de idiomas
    document.querySelectorAll('.zunko-lang-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const targetLang = this.getAttribute('data-lang');
        window.zunkoTranslate(targetLang);
      });
    });

    // Marcar idioma atual na interface
    updateUI(getCurrentLang());
  });
})();
