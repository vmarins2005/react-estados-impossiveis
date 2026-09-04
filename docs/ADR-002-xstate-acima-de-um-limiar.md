# ADR-002 — Adotar XState apenas acima de um limiar explícito de complexidade

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

Depois de padronizar união discriminada + `useReducer` (ADR-001), surgiu a
pergunta natural: adotar XState como padrão para todo fluxo?

O risco de responder "sim" é conhecido e caro: XState num formulário de dois
campos é cerimônia pura — mais código, mais conceito, mais barreira de entrada,
sem nenhum problema resolvido. O time passa a escrever máquinas por convenção, e
o custo aparece no onboarding e na velocidade de entrega.

O risco de responder "não" também é real. Existem fluxos onde o reducer não
modela bem e o resultado é código correto de ler e difícil de manter:

- efeito assíncrono que precisa ser cancelado ao sair do estado
- timeout por estado (`setTimeout` disparado por fora, com obrigação de limpar em
  **todos** os caminhos de saída — e o esquecimento de um deles é o vazamento
  clássico)
- estados aninhados ou paralelos
- requisitos que precisam ser conferidos com produto antes de virar código

Sem um limiar escrito, a decisão vira preferência de quem está escrevendo, e a
base fica com os dois padrões sem critério.

## Decisão

`useReducer` é o padrão. XState entra quando o fluxo tiver **pelo menos dois**
dos gatilhos abaixo:

1. mais de 5 estados
2. efeito assíncrono que deve ser cancelado ao trocar de estado
3. timeout ou atividade com duração vinculada a um estado
4. estados aninhados ou paralelos
5. o fluxo precisa ser revisado com produto/design antes da implementação
6. mais de 3 guardas condicionais nas transições

Um gatilho só não justifica. Fluxos que hoje são reducer e cruzam o limiar são
migrados quando forem tocados, não em mutirão.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| XState em tudo | Consistência total; ferramental (visualizador, testes gerados) | Cerimônia em fluxo trivial; barreira de entrada; bundle | Custo desproporcional na maioria dos casos |
| Nunca XState | Zero dependência; um padrão só | Cancelamento e timeout viram código manual repetido e propenso a vazamento | Já produziu bug de `setTimeout` órfão |
| Reducer + biblioteca de efeito (`useEffectReducer`) | Meio-termo | Menos maduro; comunidade pequena; documentação escassa | Risco de manutenção |
| Limiar explícito de 2 gatilhos | Critério objetivo; encerra a discussão em PR | Casos de fronteira ainda exigem julgamento | **Escolhida** |

## Consequências

**Positivas**
- A discussão em PR fica factual: "quantos gatilhos este fluxo tem?".
- Fluxos simples permanecem simples e legíveis por qualquer pessoa do time.
- Onde XState é usado, ele resolve problema real — o que ajuda quem está
  aprendendo a entender *por que* ele existe.
- Máquinas complexas ganham revisão com produto antes do código, o que muda a
  qualidade do requisito.

**Negativas**
- Convivem dois padrões na base. Precisa estar documentado (este ADR) e dito em
  onboarding, ou parece inconsistência.
- Migrar de reducer para XState no meio de uma feature dá trabalho; a tentação é
  esticar o reducer além do ponto razoável. Revisão de PR deve olhar isso.
- XState tem curva própria: atores, `setup`, tipagem de eventos.

**Monitorar**
- Reducers passando de ~120 linhas ou com `setTimeout`/`AbortController`
  manuais: candidatos claros à migração.
- Máquinas XState com 3 estados e nenhum `invoke`: sinal de que o limiar não
  foi respeitado na direção oposta.

## Nota transferível

O valor deste ADR não está na escolha entre as duas ferramentas — está em ter um
**limiar escrito**. Toda decisão do tipo "quando usar X?" que fica só na cabeça
do tech lead vira inconsistência assim que o time cresce ou essa pessoa sai.
