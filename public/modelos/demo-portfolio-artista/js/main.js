// Script do Portfólio de Artista

// Player de Áudio Demonstrativo
let isPlaying = false;
let currentTrackIndex = 0;

const tracks = [
  { title: "Luar da Minha Terra (Ao Vivo)", artist: "Lucas Rossi", duration: "3:45" },
  { title: "No Compasso do Coração", artist: "Lucas Rossi", duration: "4:12" },
  { title: "Voz e Violão no Teatro", artist: "Lucas Rossi", duration: "3:20" }
];

function toggleAudio() {
  const btn = document.getElementById('btn-play-icon');
  const bar = document.getElementById('audio-progress-bar');
  
  isPlaying = !isPlaying;
  if (isPlaying) {
    if (btn) btn.innerText = "⏸";
    simulatePlayback();
  } else {
    if (btn) btn.innerText = "▶";
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  updateTrackUI();
}

function updateTrackUI() {
  const titleEl = document.getElementById('current-track-title');
  const artistEl = document.getElementById('current-track-artist');
  if (titleEl) titleEl.innerText = tracks[currentTrackIndex].title;
  if (artistEl) artistEl.innerText = tracks[currentTrackIndex].artist;
}

function simulatePlayback() {
  let progress = 0;
  const bar = document.getElementById('audio-progress-bar');
  const timer = setInterval(() => {
    if (!isPlaying) {
      clearInterval(timer);
      return;
    }
    progress += 2;
    if (bar) bar.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(timer);
      nextTrack();
      if (isPlaying) simulatePlayback();
    }
  }, 1000);
}

// Enviar Proposta de Show via WhatsApp
function sendBookingWhatsApp(event) {
  event.preventDefault();
  const name = document.getElementById('contractor-name').value.trim();
  const phone = document.getElementById('contractor-phone').value.trim();
  const eventType = document.getElementById('event-type').value;
  const eventDate = document.getElementById('event-date').value;
  const city = document.getElementById('event-city').value.trim();
  const notes = document.getElementById('event-notes').value.trim();

  let msg = `⭐ *SOLICITAÇÃO DE CONTRATAÇÃO DE SHOW / ARTISTA* ⭐\n\n`;
  msg += `👤 *Contratante / Produtor:* ${name}\n`;
  msg += `📱 *Telefone/WhatsApp:* ${phone}\n`;
  msg += `🎭 *Tipo de Evento:* ${eventType}\n`;
  msg += `📅 *Data Prevista:* ${eventDate}\n`;
  msg += `📍 *Cidade / Local:* ${city}\n`;
  if (notes) msg += `📝 *Observações:* ${notes}\n\n`;
  msg += `Por favor, nos enviem a disponibilidade de agenda e proposta de cachê comercial.`;

  const producerPhone = "5521999999999"; // Demonstrativo
  const url = `https://wa.me/${producerPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
