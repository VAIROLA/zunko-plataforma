// Script do Portfólio de Ator de TV, Teatro & Cinema

// Lightbox de Fotos
function openLightbox(icon, title, category, desc) {
  const modal = document.getElementById('lightbox-modal');
  const imgBox = document.getElementById('lightbox-img-box');
  const titleEl = document.getElementById('lightbox-title');
  const catEl = document.getElementById('lightbox-cat');
  const descEl = document.getElementById('lightbox-desc');

  if (imgBox) imgBox.innerText = icon;
  if (titleEl) titleEl.innerText = title;
  if (catEl) catEl.innerText = category;
  if (descEl) descEl.innerText = desc || 'Fotografia profissional de ensaio fotográfico para material de elenco.';

  if (modal) modal.classList.add('open');
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.remove('open');
}

// Player de Vídeo / Showreel Modal
function playVideoDemo(title, type) {
  const modal = document.getElementById('video-modal');
  const titleEl = document.getElementById('video-modal-title');
  const typeEl = document.getElementById('video-modal-type');

  if (titleEl) titleEl.innerText = title;
  if (typeEl) typeEl.innerText = type;

  if (modal) modal.classList.add('open');
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  if (modal) modal.classList.remove('open');
}

// Enviar Contato de Casting via WhatsApp
function sendCastingWhatsApp(event) {
  event.preventDefault();
  const name = document.getElementById('producer-name').value.trim();
  const company = document.getElementById('producer-company').value.trim();
  const projectType = document.getElementById('project-type').value;
  const projectDate = document.getElementById('project-date').value;
  const notes = document.getElementById('casting-notes').value.trim();

  let msg = `🎬 *CONTATO DE CASTING & PRODUÇÃO DE ELENCO* 🎬\n\n`;
  msg += `👤 *Produtor / Diretor:* ${name}\n`;
  msg += `🏢 *Produtora / Emissora:* ${company}\n`;
  msg += `📽️ *Tipo de Produção:* ${projectType}\n`;
  msg += `📅 *Período / Data de Gravação:* ${projectDate}\n`;
  if (notes) msg += `📝 *Perfil do Personagem / Detalhes:* ${notes}\n\n`;
  msg += `Gostaríamos de solicitar a disponibilidade de agenda do ator e agendar teste/reunião.`;

  const agentPhone = "5521999999999"; // Demonstrativo
  const url = `https://wa.me/${agentPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
