export type ScriptCategory =
  | "abordagem"
  | "qualificacao"
  | "followup"
  | "ligacao"
  | "fechamento"
  | "upsell"
  | "recuperacao";

export type Channel = "whatsapp" | "ligacao";

export type Script = {
  id: string;
  category: ScriptCategory;
  channel: Channel;
  title: string;
  tag: string;
  body: string;
};

export const CATEGORY_LABEL: Record<ScriptCategory, string> = {
  abordagem: "Abordagem",
  qualificacao: "Qualificação",
  followup: "Follow-up",
  ligacao: "Ligação",
  fechamento: "Fechamento",
  upsell: "Upsell / Pós-venda",
  recuperacao: "Recuperação",
};

/**
 * Campos preenchidos uma vez pelo vendedor; os scripts saem prontos.
 * Tokens nos textos: {vendedor} {cliente} {marca} {qtd} {cor}
 */
export const SCRIPT_FIELDS: { token: string; label: string; placeholder: string }[] = [
  { token: "vendedor", label: "Seu nome", placeholder: "ex.: João" },
  { token: "cliente", label: "Cliente", placeholder: "ex.: Marina" },
  { token: "marca", label: "Marca / loja", placeholder: "ex.: RD Caps" },
  { token: "qtd", label: "Qtde", placeholder: "100" },
  { token: "cor", label: "Cor", placeholder: "preto" },
];

export const SCRIPTS: Script[] = [
  // ───────────── ABORDAGEM ─────────────
  {
    id: "ab-1",
    category: "abordagem",
    channel: "whatsapp",
    title: "Abertura (Revenda ou Marca própria)",
    tag: "Primeiro contato",
    body: "Olá! Aqui é o {vendedor} da fábrica J2A Bonés 👋 Vi que você chegou pelo nosso anúncio. Pra eu já te mostrar o certo: você quer bonés pra revender na sua loja ou pra criar a sua própria marca?",
  },
  {
    id: "ab-2",
    category: "abordagem",
    channel: "whatsapp",
    title: "Escolheu REVENDA → próximo passo",
    tag: "Caminho revenda",
    body: "Show! Pra revenda a gente é fábrica direta, sem atravessador — você pega no preço de fábrica e revende com margem cheia. Pra te montar o ideal: pensa em começar com 50, 100 ou 200 peças? Te mostro os modelos que mais saem em loja.",
  },
  {
    id: "ab-3",
    category: "abordagem",
    channel: "whatsapp",
    title: "Escolheu MARCA PRÓPRIA → próximo passo",
    tag: "Caminho marca própria",
    body: "Massa, tirar a sua marca do papel é com a gente! 🔥 Produzimos do zero com a sua logo, bordado que não solta nem desbota. Você já tem a arte (logo) em arquivo ou prefere que a gente vetorize aqui sem custo?",
  },
  {
    id: "ab-4",
    category: "abordagem",
    channel: "whatsapp",
    title: "Reabordagem no mesmo dia",
    tag: "Não respondeu",
    body: "{cliente}, te chamei mais cedo sobre os bonés 👀 Pra não te tomar tempo, me responde só com 1 ou 2 — (1) Revender na minha loja · (2) Criar minha marca. Daí já te mando os modelos certos.",
  },
  {
    id: "ab-5",
    category: "abordagem",
    channel: "whatsapp",
    title: "Veio pelo Instagram / direct",
    tag: "Entrada orgânica",
    body: "Oi! Que bom que curtiu nosso trabalho 🙌 Aqui é fábrica própria, dá pra fazer com a sua logo. É pra revenda ou marca própria? Já te mando uns modelos pra você ver o acabamento de perto.",
  },

  // ───────────── QUALIFICAÇÃO ─────────────
  {
    id: "ql-1",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Ancoragem de preço",
    tag: "Antes do orçamento",
    body: "Pra {qtd} peças nesse modelo, o investimento costuma ficar entre R$ X e R$ Y, dependendo do acabamento. Isso bate com o que você projetou pro seu negócio?",
  },
  {
    id: "ql-2",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Quem decide",
    tag: "Decisão",
    body: "Só pra eu agilizar daqui: você fecha direto ou tem mais alguém que decide junto? Assim já deixo a proposta no formato certo pra aprovar de primeira.",
  },
  {
    id: "ql-3",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Urgência / prazo",
    tag: "Tempo",
    body: "Essa demanda é pra usar ainda neste mês ou pode entrar pra rodar em 30 dias? Pergunto porque tenho condição melhor pra quem fecha a produção agora.",
  },
  {
    id: "ql-4",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Volume inicial",
    tag: "Quantidade",
    body: "Pra te montar certinho: começa com 50, 100 ou 200 peças? Em lote maior eu melhoro bastante o valor por unidade.",
  },

  // ───────────── FOLLOW-UP ─────────────
  {
    id: "fu-1",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 2h (sem resposta)",
    tag: "Mesmo dia",
    body: "{cliente}, só confirmando que minha mensagem chegou 👀 Tô com a esteira cheia essa semana, mas separo um horário pra fechar o seu modelo. Seguimos hoje ou prefere amanhã?",
  },
  {
    id: "fu-2",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 24h (mockup enviado)",
    tag: "Pós-mockup",
    body: "Te mandei o mockup da {marca} ontem 🎨 Curtiu como ficou? Se quiser eu ajusto a cor ou a posição da logo em minutos — só me falar o que mudaria.",
  },
  {
    id: "fu-3",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 48h (gatilho da perda)",
    tag: "Encerrar com porta aberta",
    body: "{cliente}, como não tive retorno, imagino que os bonés não sejam prioridade agora. Vou encerrar seu atendimento pra não lotar seu WhatsApp. A porta fica aberta — é só me chamar quando quiser retomar!",
  },
  {
    id: "fu-4",
    category: "followup",
    channel: "whatsapp",
    title: "Orçamento parado (3 dias)",
    tag: "Destravar proposta",
    body: "Oi {cliente}! Seu orçamento ainda tá de pé. Antes de eu liberar a próxima leva de produção, quis te dar prioridade: o que travou foi o valor, o prazo ou o modelo? Resolvo rapidinho com você.",
  },

  // ───────────── LIGAÇÃO ─────────────
  {
    id: "lg-1",
    category: "ligacao",
    channel: "ligacao",
    title: "Abertura de ligação (1ª ligação)",
    tag: "Quebra-gelo",
    body: "Fala {cliente}, tudo certo? É o {vendedor} da J2A Bonés — você chegou pelo nosso anúncio. Te liguei porque por áudio resolve mais rápido que digitando, beleza? Me conta: é pra revenda ou marca própria?",
  },
  {
    id: "lg-2",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação · orçamento parado",
    tag: "Recuperar proposta",
    body: "Oi {cliente}, é o {vendedor} da J2A. Te liguei porque seu projeto está parado na mesa. O que pegou foi o modelo ou a condição de pagamento? Consigo negociar direto com a diretoria pra rodar isso hoje.",
  },
  {
    id: "lg-3",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação · objeção 'tá caro'",
    tag: "Defender o valor",
    body: "Entendo, {cliente}. Só pra te situar: nosso boné não desbota nem desfia depois de lavar, é fábrica própria, sem atravessador. Se o que pesou foi o caixa agora, eu divido o pagamento. Topa fechar nessa condição?",
  },
  {
    id: "lg-4",
    category: "ligacao",
    channel: "ligacao",
    title: "Não atendeu → recado no WhatsApp",
    tag: "Pós-ligação",
    body: "{cliente}, tentei te ligar agora 📞 Era rapidinho sobre o seu pedido de bonés — tenho uma condição que vale a pena. Me diz um horário que te ligo de volta, ou resolvemos por aqui mesmo.",
  },
  {
    id: "lg-5",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação de fechamento",
    tag: "Empurrão final",
    body: "{cliente}, te liguei pra fechar! Tá tudo pronto: arte aprovada, modelo definido. Se confirmar agora, sua produção entra no lote desta semana e sai antes. Posso gerar o pedido?",
  },

  // ───────────── FECHAMENTO ─────────────
  {
    id: "fc-1",
    category: "fechamento",
    channel: "whatsapp",
    title: "Fechamento com escassez",
    tag: "Lote limitado",
    body: "{cliente}, minha esteira fecha a produção da quinzena na sexta. Se confirmar até lá, garanto seu lote sem fila. Fechamos os {qtd} na cor {cor}?",
  },
  {
    id: "fc-2",
    category: "fechamento",
    channel: "whatsapp",
    title: "Fechamento com a promo do mês",
    tag: "Oferta do mês",
    body: "Fechando essa semana você ainda pega a promoção do mês. Não vou conseguir segurar isso pro mês que vem. Bora aproveitar e travar agora?",
  },
  {
    id: "fc-3",
    category: "fechamento",
    channel: "whatsapp",
    title: "Objeção 'vou pensar'",
    tag: "Quebra de objeção",
    body: "Tranquilo pensar, {cliente} 👍 Só me ajuda: o que ficou na dúvida foi o valor, o prazo ou se o acabamento vai te atender? Assim eu resolvo o ponto certo em vez de te deixar pensando no escuro.",
  },
  {
    id: "fc-4",
    category: "fechamento",
    channel: "whatsapp",
    title: "Objeção 'achei mais barato'",
    tag: "Quebra de objeção",
    body: "Faz sentido comparar! Só cuidado com tela fina e bordado que solta no primeiro uso — refazemos muito pedido de quem veio dessas. Te mando um vídeo do nosso acabamento. Se o barato te custar refazer, sai mais caro, concorda?",
  },

  // ───────────── UPSELL / PÓS-VENDA ─────────────
  {
    id: "up-1",
    category: "upsell",
    channel: "whatsapp",
    title: "Upsell Bucket Hat no fechamento",
    tag: "Aumentar ticket",
    body: "Fechado o boné! 🎉 Antes de mandar pra produção: bucket hat (chapéu) tá vendendo muito junto, na mesma marca. Adiciono um lote pequeno pra você testar a saída? Sai com a mesma arte, sem custo de matriz.",
  },
  {
    id: "up-2",
    category: "upsell",
    channel: "whatsapp",
    title: "Pós-entrega (foto + depoimento)",
    tag: "Prova social",
    body: "Oi {cliente}! Chegou tudo certinho? Se curtiu, me manda uma foto da galera usando — posto aqui (com seu crédito) e isso ainda gera procura pra {marca}. E me diz: o que faltou pra ser nota 10?",
  },
  {
    id: "up-3",
    category: "upsell",
    channel: "whatsapp",
    title: "Indicação premiada",
    tag: "Gerar indicação",
    body: "{cliente}, curtiu o resultado? Se indicar outra marca que feche com a gente, você ganha desconto no seu próximo lote. Conhece alguém precisando de boné com qualidade?",
  },

  // ───────────── RECUPERAÇÃO ─────────────
  {
    id: "rc-1",
    category: "recuperacao",
    channel: "whatsapp",
    title: "Reativar lead de 30 dias",
    tag: "Lead frio",
    body: "Oi {cliente}! Faz um tempo que falamos sobre os bonés da {marca}. Esse mês entrou modelo novo e uma condição boa — quer que eu te mande pra ver se faz sentido agora?",
  },
  {
    id: "rc-2",
    category: "recuperacao",
    channel: "whatsapp",
    title: "Última chamada antes de arquivar",
    tag: "Reativação final",
    body: "{cliente}, vou arquivar seu cadastro pra liberar espaço na lista. Se ainda quiser tirar a marca do papel, responde com um 👍 que eu reabro com prioridade. Senão, fico à disposição!",
  },
];

// Trocar perguntas abertas (que travam) por opções direcionadas (que avançam).
export type QuestionSwap = { open: string; directed: string };

export const QUESTION_SWAPS: QuestionSwap[] = [
  {
    open: "Como posso te ajudar?",
    directed: "Você quer bonés pra revender na sua loja ou pra criar a sua própria marca?",
  },
  {
    open: "Qual seu orçamento?",
    directed: "Pra eu já te mandar o ideal: pensa em começar com 50, 100 ou 200 peças?",
  },
  {
    open: "Que modelo você quer?",
    directed: "Prefere o trucker (tela atrás) ou o aba curva fechadinho?",
  },
  {
    open: "Quando você vai precisar?",
    directed: "Essa demanda é pra esse mês ou pode entrar pra rodar em 30 dias?",
  },
  {
    open: "Qual cor você quer?",
    directed: "Vai de cor única ou prefere 2 cores no mesmo lote?",
  },
  {
    open: "Você tem a arte da logo?",
    directed: "Você já tem a logo em arquivo (PNG/PDF) ou quer que a gente vetorize?",
  },
  {
    open: "Qual acabamento prefere?",
    directed: "Bordado 3D (com relevo, premium) ou bordado plano?",
  },
  {
    open: "Como você prefere pagar?",
    directed: "Fica melhor 50% agora e 50% na entrega, ou à vista com desconto?",
  },
];
