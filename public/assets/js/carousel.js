// ZUNKO - 5 Plans Interactive Carousel (Sem cortes e com navegação perfeita)
class ZunkoCarousel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.track = this.container.querySelector('.carousel-track');
    if (!this.track) return;

    this.cards = Array.from(this.track.children);
    this.totalCards = this.cards.length;
    this.currentIndex = 0;

    // Search controls in document so top buttons work seamlessly
    this.prevBtns = document.querySelectorAll('.carousel-prev');
    this.nextBtns = document.querySelectorAll('.carousel-next');
    this.dotsContainer = this.container.querySelector('.carousel-dots');

    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;

    this.init();
  }

  getCardsPerPage() {
    if (window.innerWidth >= 1200) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  getMaxIndex() {
    return Math.max(0, this.totalCards - this.getCardsPerPage());
  }

  init() {
    this.createDots();
    this.update();

    // Attach click events to ALL prev/next buttons
    this.prevBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.prev();
      });
    });

    this.nextBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.next();
      });
    });

    // Window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.createDots();
        this.update();
      }, 100);
    });

    // Touch support (Mobile swipe)
    this.track.addEventListener('touchstart', (e) => this.dragStart(e), { passive: true });
    this.track.addEventListener('touchmove', (e) => this.dragMove(e), { passive: true });
    this.track.addEventListener('touchend', () => this.dragEnd());

    // Mouse drag support
    this.track.addEventListener('mousedown', (e) => this.dragStart(e));
    window.addEventListener('mousemove', (e) => this.dragMove(e));
    window.addEventListener('mouseup', () => this.dragEnd());
  }

  createDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    const maxIndex = this.getMaxIndex();

    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${i === this.currentIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Ir para página ${i + 1}`);
      dot.addEventListener('click', () => {
        this.currentIndex = i;
        this.update();
      });
      this.dotsContainer.appendChild(dot);
    }
  }

  prev() {
    const maxIndex = this.getMaxIndex();
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = maxIndex;
    }
    this.update();
  }

  next() {
    const maxIndex = this.getMaxIndex();
    if (this.currentIndex < maxIndex) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.update();
  }

  update() {
    const maxIndex = this.getMaxIndex();
    if (this.currentIndex > maxIndex) this.currentIndex = maxIndex;
    if (this.currentIndex < 0) this.currentIndex = 0;

    // Use physical offsetLeft for 100% pixel-perfect translation without rounding gaps
    let offset = 0;
    if (this.cards.length > 1 && this.currentIndex > 0 && this.cards[this.currentIndex]) {
      const firstCard = this.cards[0];
      const targetCard = this.cards[this.currentIndex];
      offset = targetCard.offsetLeft - firstCard.offsetLeft;
    }

    this.track.style.transform = `translateX(-${offset}px)`;
    this.track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';

    this.updateControls();
  }

  updateControls() {
    // Update dots
    const dots = this.dotsContainer?.querySelectorAll('.carousel-dot');
    dots?.forEach((dot, idx) => {
      if (idx === this.currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  dragStart(e) {
    this.isDragging = true;
    this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    this.currentX = this.startX;
    this.track.style.transition = 'none';
  }

  dragMove(e) {
    if (!this.isDragging) return;
    this.currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  }

  dragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const diff = this.startX - this.currentX;
    const threshold = 40;

    if (diff > threshold) {
      this.next();
    } else if (diff < -threshold) {
      this.prev();
    } else {
      this.update();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ZunkoCarousel('plans-carousel');
});
