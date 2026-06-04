export type Script = {
  id: string;
  phase: string;
  title: string;
  tag: string;
  body: string;
};

export const SCRIPTS: Script[] = [
  {
    id: "s1",
    phase: "Mês 1",
    title: "Abordagem Direta",
    tag: "Primeiro contato",
    body: "Olá! Aqui é o [Nome] da fábrica J2A Bonés. Vi que chegou pelo nosso anúncio. Para eu te direcionar melhor: busca bonés para a sua própria marca ou fardamento de equipe?",
  },
  {
    id: "s2",
    phase: "Mês 2",
    title: "Ancoragem de Preço",
    tag: "Qualificação BANT",
    body: "Para 100 peças nesse modelo, o mercado investe entre R$ X e R$ Y, dependendo do acabamento. Isso está dentro do que você projetou para o seu negócio?",
  },
  {
    id: "s3",
    phase: "Mês 3",
    title: "Follow-up de Perda · 48h",
    tag: "Gatilho da perda",
    body: "[Nome], tudo bem? Como não tive retorno, imagino que o projeto dos bonés não seja prioridade agora. Vou encerrar seu atendimento no sistema para não lotar seu WhatsApp. A porta está aberta caso queira retomar no futuro!",
  },
  {
    id: "s4",
    phase: "Mês 4",
    title: "Fechamento por Ligação",
    tag: "Recuperação",
    body: "Fala [Nome]! Te liguei porque seu projeto está travado na mesa de aprovação. O problema foi o modelo do tecido ou a condição de pagamento? Consigo negociar direto com a diretoria para rodarmos isso hoje.",
  },
];
