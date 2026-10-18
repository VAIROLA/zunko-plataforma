// ZUNKO - Gerador Interativo de Prompts com IA para Clientes
document.addEventListener('DOMContentLoaded', () => {
  const promptTypeSelect = document.getElementById('prompt-category');
  const segmentInput = document.getElementById('company-segment');
  const companyNameInput = document.getElementById('company-name');
  const targetAudienceInput = document.getElementById('target-audience');
  const outputTextarea = document.getElementById('generated-prompt');
  const copyBtn = document.getElementById('copy-prompt-btn');

  if (!promptTypeSelect || !outputTextarea) return;

  const templates = {
    briefing: (name, segment, audience) => 
`Atue como um estrategista digital sênior da ZUNKO.
Preciso estruturar o briefing completo para a criação do novo site da minha empresa:
- Nome da Empresa: ${name || '[Nome da sua Empresa]'}
- Ramo de Atuação: ${segment || '[Seu Ramo / Ex: Clínica Odontológica]'}
- Público-Alvo: ${audience || '[Seu Público / Ex: Famílias da classe média/alta]'}

Por favor, elabore:
1. Uma proposta de valor clara em 1 frase de impacto (headline).
2. Os 4 principais diferenciais competitivos que devemos destacar.
3. Sugestão da estrutura das seções da página inicial (Home).
4. Tom de voz ideal (ex: formal, acolhedor, inovador).
5. Chamadas para ação (CTAs) para o botão de WhatsApp.`,

    servicos: (name, segment, audience) => 
`Atue como redator publicitário de alto impacto (Copywriter) para sites.
Escreva a descrição comercial dos serviços para a empresa:
- Empresa: ${name || '[Nome da sua Empresa]'}
- Segmento: ${segment || '[Ex: Advocacia Trabalhista e Empresarial]'}
- Público: ${audience || '[Ex: Pequenos e médios empresários]'}

Para cada um dos 3 principais serviços, forneça:
1. Título atraente do serviço.
2. Descrição clara e persuasiva em 2 parágrafos.
3. Lista com 4 benefícios diretos que o cliente obtém.
4. Pergunta frequente rápida sobre o serviço.`,

    sobre: (name, segment, audience) => 
`Escreva um texto institucional autêntico, humano e profissional para a página 'Sobre Nós' da empresa ${name || '[Nome da Empresa]'}, que atua no segmento de ${segment || '[Segmento]'}.
- Nosso público: ${audience || '[Público-Alvo]'}.

Estruture o texto com:
1. Nossa Origem e Propósito: por que existimos e qual problema resolvemos.
2. Missão, Visão e Valores alinhados ao nosso mercado.
3. Nosso Compromisso com a excelência e atendimento ao cliente.
4. Um parágrafo de fechamento convidando o visitante a iniciar uma conversa.`,

    faq: (name, segment, audience) => 
`Crie as 6 perguntas mais frequentes (FAQ) que os clientes costumam fazer antes de contratar uma empresa de ${segment || '[Segmento]'} (${name || '[Nome da Empresa]'}).
Para cada pergunta, forneça uma resposta transparente, confiável e tranquilizadora, eliminando objeções de compra e incentivando o contato pelo WhatsApp.`
  };

  function updatePrompt() {
    const category = promptTypeSelect.value;
    const name = companyNameInput?.value.trim();
    const segment = segmentInput?.value.trim();
    const audience = targetAudienceInput?.value.trim();

    if (templates[category]) {
      outputTextarea.value = templates[category](name, segment, audience);
    }
  }

  // Event listeners
  promptTypeSelect.addEventListener('change', updatePrompt);
  segmentInput?.addEventListener('input', updatePrompt);
  companyNameInput?.addEventListener('input', updatePrompt);
  targetAudienceInput?.addEventListener('input', updatePrompt);

  // Initialize
  updatePrompt();

  // Copy to clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(outputTextarea.value);
        window.showToast?.('Prompt copiado com sucesso! Agora é só colar no seu assistente de IA favorito.', 'success');
      } catch (err) {
        outputTextarea.select();
        document.execCommand('copy');
        window.showToast?.('Prompt copiado para a área de transferência!', 'success');
      }
    });
  }
});
