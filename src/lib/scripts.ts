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

export const SCRIPTS: Script[] = [
  // ───────────── ABORDAGEM ─────────────
  {
    id: "ab-1",
    category: "abordagem",
    channel: "whatsapp",
    title: "Abertura direta (Revenda ou Fardamento)",
    tag: "Primeiro contato",
    body: "Olá! Aqui é o [Nome] da fábrica J2A Bonés. Vi que você chegou pelo nosso anúncio. Pra eu te direcionar certinho: você busca bonés pra revender na sua marca ou pra fardar a sua equipe?",
  },
  {
    id: "ab-2",
    category: "abordagem",
    channel: "whatsapp",
    title: "Escolheu REVENDA → próximo passo",
    tag: "Caminho revenda",
    body: "Show, então é pra sua marca! 🔥 A gente fabrica do zero com a sua logo. Pra já te passar o ideal: pensa em começar com 50, 100 ou 200 peças? E você já tem a arte da marca ou quer que a gente vetorize aqui?",
  },
  {
    id: "ab-3",
    category: "abordagem",
    channel: "whatsapp",
    title: "Escolheu FARDAMENTO → próximo passo",
    tag: "Caminho fardamento",
    body: "Perfeito, fardamento de equipe a gente faz muito! Pra te montar a melhor proposta: quantas pessoas vão usar? E é pra um time/empresa só ou tem mais de um setor com cores diferentes?",
  },
  {
    id: "ab-4",
    category: "abordagem",
    channel: "whatsapp",
    title: "Reabordagem no mesmo dia (não respondeu)",
    tag: "Reaquecer rápido",
    body: "[Nome], te chamei mais cedo sobre os bonés. Pra não te tomar tempo: me responde só com 1 ou 2 — (1) Revenda na minha marca · (2) Fardamento de equipe. Daí eu já te mando os modelos certos.",
  },
  {
    id: "ab-5",
    category: "abordagem",
    channel: "whatsapp",
    title: "Veio pelo Instagram / direct",
    tag: "Entrada orgânica",
    body: "Oi! Que bom que curtiu nosso trabalho 🙌 Aqui é fábrica própria, dá pra fazer com a sua logo. É pra revenda ou pra uniformizar uma equipe? Já te mando uns modelos pra você ver o acabamento de perto.",
  },

  // ───────────── QUALIFICAÇÃO (BANT) ─────────────
  {
    id: "ql-1",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Ancoragem de preço",
    tag: "Antes do orçamento",
    body: "Pra 100 peças nesse modelo, o mercado costuma investir entre R$ X e R$ Y, dependendo do acabamento. Isso está dentro do que você projetou pro seu negócio?",
  },
  {
    id: "ql-2",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Quem decide (Authority)",
    tag: "BANT · decisão",
    body: "Só pra eu agilizar do meu lado: você fecha direto ou tem mais alguém que decide junto com você? Assim já deixo a proposta no formato que vocês precisam aprovar.",
  },
  {
    id: "ql-3",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Urgência / prazo (Time)",
    tag: "BANT · tempo",
    body: "Essa demanda é pra usar ainda neste mês ou pode entrar pra rodar em 30 dias? Pergunto porque tenho condição melhor pra quem fecha a produção agora.",
  },
  {
    id: "ql-4",
    category: "qualificacao",
    channel: "whatsapp",
    title: "Volume inicial (Budget/Need)",
    tag: "BANT · volume",
    body: "Pra te montar certinho: você pensa em começar com 50, 100 ou 200 peças? Em lote maior eu consigo melhorar bastante o valor por unidade.",
  },

  // ───────────── FOLLOW-UP ─────────────
  {
    id: "fu-1",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 2h (sem resposta)",
    tag: "Mesmo dia",
    body: "[Nome], só confirmando que minha mensagem chegou 👀 Tô com a esteira cheia essa semana, mas separo um horário pra fechar o seu modelo. Me diz: seguimos hoje ou prefere amanhã?",
  },
  {
    id: "fu-2",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 24h (mockup enviado)",
    tag: "Pós-mockup",
    body: "Te mandei o mockup da [Marca] ontem 🎨 Curtiu como ficou? Se quiser eu ajusto a cor ou a posição da logo em minutos — é só me falar o que mudaria.",
  },
  {
    id: "fu-3",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up 48h (gatilho da perda)",
    tag: "Encerrar com porta aberta",
    body: "[Nome], como não tive retorno, imagino que o projeto dos bonés não seja prioridade agora. Vou encerrar seu atendimento no sistema pra não lotar seu WhatsApp. A porta fica aberta — é só me chamar quando quiser retomar!",
  },
  {
    id: "fu-4",
    category: "followup",
    channel: "whatsapp",
    title: "Follow-up de orçamento parado (3 dias)",
    tag: "Destravar proposta",
    body: "Oi [Nome]! Seu orçamento ainda tá de pé. Antes de eu liberar a próxima leva de produção, quis te dar prioridade: o que travou foi o valor, o prazo ou o modelo? Resolvo rapidinho com você.",
  },
  {
    id: "fu-5",
    category: "followup",
    channel: "whatsapp",
    title: "Sumiu depois do mockup",
    tag: "Última checagem leve",
    body: "[Nome], fiquei com a sua arte aqui salva 😅 Me dá um sinal: ainda faz sentido pra esse mês ou deixo guardado pra quando você quiser puxar?",
  },

  // ───────────── LIGAÇÃO ─────────────
  {
    id: "lg-1",
    category: "ligacao",
    channel: "ligacao",
    title: "Abertura de ligação (1ª ligação)",
    tag: "Quebra-gelo",
    body: "Fala [Nome], tudo certo? É o [Nome] da J2A Bonés — você chegou pelo nosso anúncio. Te liguei rapidinho porque por áudio resolve mais rápido que digitando, beleza? Me conta: é pra revenda ou fardamento?",
  },
  {
    id: "lg-2",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação · orçamento parado",
    tag: "Recuperar proposta",
    body: "Oi [Nome], é o [Nome] da J2A. Te liguei porque seu projeto está parado na mesa de aprovação. O que pegou foi o modelo do tecido ou a condição de pagamento? Consigo negociar direto com a diretoria pra rodar isso hoje.",
  },
  {
    id: "lg-3",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação · objeção 'tá caro'",
    tag: "Defender o valor",
    body: "Entendo, [Nome]. Só pra te situar: nosso boné não desbota nem desfia depois de lavar, é fábrica própria, sem atravessador. Se o que pesou foi o caixa agora, eu divido o pagamento pra você. Topa fechar nessa condição?",
  },
  {
    id: "lg-4",
    category: "ligacao",
    channel: "ligacao",
    title: "Não atendeu → recado no WhatsApp",
    tag: "Pós-ligação",
    body: "[Nome], tentei te ligar agora 📞 Era rapidinho sobre o seu pedido de bonés — tenho uma condição que vale a pena. Me fala um horário que eu te ligo de volta, ou se preferir já resolvemos por aqui mesmo.",
  },
  {
    id: "lg-5",
    category: "ligacao",
    channel: "ligacao",
    title: "Ligação de fechamento",
    tag: "Empurrão final",
    body: "[Nome], te liguei pra fechar! Tá tudo pronto: arte aprovada, modelo definido. Se você me confirmar agora, sua produção entra no lote desta semana e sai antes. Posso gerar o pedido?",
  },

  // ───────────── FECHAMENTO ─────────────
  {
    id: "fc-1",
    category: "fechamento",
    channel: "whatsapp",
    title: "Fechamento com escassez",
    tag: "Lote limitado",
    body: "[Nome], minha esteira fecha a produção da quinzena na sexta. Se confirmar até lá, garanto seu lote sem fila. Fechamos os [qtd] na [cor]?",
  },
  {
    id: "fc-2",
    category: "fechamento",
    channel: "whatsapp",
    title: "Fechamento com a promo do mês",
    tag: "Oferta do mês",
    body: "Fechando essa semana você ainda pega a promoção do mês: [promoção]. Não vou conseguir segurar isso pro mês que vem. Bora aproveitar e travar agora?",
  },
  {
    id: "fc-3",
    category: "fechamento",
    channel: "whatsapp",
    title: "Objeção 'vou pensar'",
    tag: "Quebra de objeção",
    body: "Tranquilo pensar, [Nome] 👍 Só me ajuda a entender o que ficou na dúvida: é o valor, o prazo ou se o acabamento vai te atender? Assim eu já resolvo o ponto certo em vez de te deixar pensando no escuro.",
  },
  {
    id: "fc-4",
    category: "fechamento",
    channel: "whatsapp",
    title: "Objeção 'achei mais barato'",
    tag: "Quebra de objeção",
    body: "Faz sentido comparar! Só cuidado com tela fina e bordado que solta no primeiro uso — a gente já refez muito pedido de cliente que veio dessas. Te mando um vídeo do nosso acabamento de perto. Se o barato te custar refazer, sai mais caro, concorda?",
  },

  // ───────────── UPSELL / PÓS-VENDA ─────────────
  {
    id: "up-1",
    category: "upsell",
    channel: "whatsapp",
    title: "Upsell Bucket Hat no fechamento",
    tag: "Aumentar ticket",
    body: "Fechado o boné! 🎉 Antes de mandar pra produção: bucket hat (chapéu) tá bombando junto com boné na mesma marca. Adiciono um lote pequeno pra você testar a saída? Sai com a mesma arte, sem custo de matriz.",
  },
  {
    id: "up-2",
    category: "upsell",
    channel: "whatsapp",
    title: "Pós-entrega (foto + depoimento)",
    tag: "Prova social",
    body: "Oi [Nome]! Chegou tudo certinho? Se curtiu, me manda uma foto da galera usando — uso aqui (com seu crédito) e isso ainda gera procura pra sua marca. E já deixo: o que faltou pra ser nota 10?",
  },
  {
    id: "up-3",
    category: "upsell",
    channel: "whatsapp",
    title: "Indicação premiada",
    tag: "Gerar indicação",
    body: "[Nome], gostou do resultado? Se indicar outra marca que feche com a gente, você ganha desconto no seu próximo lote. Conhece alguém que tá precisando de boné com qualidade?",
  },

  // ───────────── RECUPERAÇÃO ─────────────
  {
    id: "rc-1",
    category: "recuperacao",
    channel: "whatsapp",
    title: "Reativar lead de 30 dias",
    tag: "Lead frio",
    body: "Oi [Nome]! Faz um tempo que conversamos sobre os bonés da [Marca]. Esse mês entrou um modelo novo e uma condição boa — quer que eu te mande pra ver se faz sentido agora?",
  },
  {
    id: "rc-2",
    category: "recuperacao",
    channel: "whatsapp",
    title: "Última chamada antes de arquivar",
    tag: "Reativação final",
    body: "[Nome], vou arquivar seu cadastro pra liberar espaço na minha lista. Se ainda tiver vontade de tirar a marca do papel, me responde com um 👍 que eu reabro com prioridade. Senão, sem problema — fico à disposição!",
  },
];

// Trocar perguntas abertas (que travam) por opções direcionadas (que avançam).
export type QuestionSwap = {
  open: string;
  directed: string;
};

export const QUESTION_SWAPS: QuestionSwap[] = [
  {
    open: "Como posso te ajudar?",
    directed: "Você quer bonés pra revender na sua marca ou pra fardar a sua equipe?",
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
    directed: "Você já tem a logo em arquivo (PNG ou PDF) ou quer que a gente vetorize?",
  },
  {
    open: "Qual acabamento prefere?",
    directed: "Bordado 3D (com relevo, mais premium) ou bordado plano?",
  },
  {
    open: "Como você prefere pagar?",
    directed: "Fica melhor 50% agora e 50% na entrega, ou à vista com desconto?",
  },
  {
    open: "Quer fechar?",
    directed: "Fechamos os [qtd] na [cor] pra já entrar no lote desta semana?",
  },
];
