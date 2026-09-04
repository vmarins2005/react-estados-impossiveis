# Máquinas de estado

> **Stack:** React 19 + Vite + XState 5
> **Conceito:** tornar estados inválidos **inexprimíveis**, em vez de se defender
> deles com `if`

---

## O problema que este projeto ataca

Todo fluxo com mais de dois passos começa igual:

```tsx
const [isLoading, setIsLoading] = useState(false)
const [isError, setIsError] = useState(false)
const [isSuccess, setIsSuccess] = useState(false)
```

Cinco booleanos descrevem **32 combinações**. Cinco são válidas. As outras 27 são
estados impossíveis que o TypeScript permite, o componente aceita e a tela
renderiza de forma imprevisível:

- spinner e mensagem de erro juntos
- "pedido aprovado" com aviso de falha
- `isLoading` travado em `true` porque um caminho de erro esqueceu de desligá-lo
- duplo clique disparando dois pagamentos

A raiz é sempre a mesma: **os booleanos não são independentes, mas o tipo diz que
são.** Toda vez que o tipo permite mais do que a realidade, a diferença vira bug.

---

## Rodando

```bash
npm install
npm run dev
```

Os três painéis são interativos e cada um tem uma instrução de "faça isto para
ver quebrar" no rodapé. Faça.

---

## Os três níveis

### Nível 0 — booleanos (`booleanos/SopaDeBooleanos.ruim.tsx`)

O anti-exemplo. Tem dois bugs propositais que são exatamente os que acontecem em
produção: um `finally` esquecido e uma flag órfã.

**Sinal de diagnóstico em code review:** três ou mais booleanos que nunca são
verdadeiros ao mesmo tempo. Não são booleanos — é um estado só, com nomes.

### Nível 1 — `useReducer` (`reducer/checkoutReducer.ts`)

**É a resposta certa para a maioria dos casos**, e é o nível que você precisa
dominar antes de considerar biblioteca.

O que a união discriminada entrega:

- estados mutuamente exclusivos por construção
- dado que só existe onde faz sentido (`transactionId` só em `approved`)
- `switch` exaustivo: adicionar estado novo **quebra a compilação** até ser tratado
- evento inválido é ignorado — o que elimina a classe inteira de bug do duplo
  clique, sem `disabled`, sem `debounce`, sem flag

Note o formato do reducer: `switch` externo por **estado**, interno por
**evento**. Isso o torna legível como especificação — dá para conferir a regra
junto com produto, linha a linha.

### Nível 2 — XState (`xstate/uploadMachine.ts`)

Entra quando o reducer começa a ficar desconfortável:

| Recurso | O que resolve |
|---|---|
| `invoke` | O efeito pertence ao estado e é **cancelado ao sair dele** |
| `after` | Timeout declarativo, sem `setTimeout` órfão para limpar |
| `guard` nomeado | A condição vira parte legível da especificação |
| Estados aninhados/paralelos | "Editando" contendo "salvando" e "validando" |
| `state.can(evento)` | A UI **consulta** a máquina em vez de duplicar a regra |
| Visualização | A máquina é desenhável e revisável com produto |

---

## A regra de escolha

| Situação | Ferramenta |
|---|---|
| 2 estados, sem assíncrono | `useState` com booleano — e está tudo bem |
| 3 a 5 estados mutuamente exclusivos | `useReducer` + união discriminada |
| Efeito que precisa ser cancelado ao sair do estado | XState (ou reducer + `AbortController`) |
| Estados aninhados, paralelos, timeout por estado | XState |
| Requisito precisa ser conferido com produto antes de codar | XState |

**Até 4 estados e um efeito, `useReducer`.** Além disso, considere XState — mas
considere de verdade, pesando a barreira de entrada para quem chega no time.

---

## Decisões documentadas

- [ADR-001 — União discriminada como forma padrão de modelar estado assíncrono](./docs/ADR-001-uniao-discriminada-para-estado-assincrono.md)
- [ADR-002 — XState apenas acima de um limiar de complexidade](./docs/ADR-002-xstate-acima-de-um-limiar.md)

---

## Exercícios

1. **Veja os 27 estados impossíveis.** No painel de booleanos, clique em Pagar
   até dar erro. Observe o spinner permanente convivendo com a recusa. Agora
   conserte o bug — e note que a correção é adicionar um `finally`, ou seja, uma
   coisa que ninguém garante que existe em todo caminho novo.

2. **Prove a proteção contra duplo clique.** No painel do reducer, clique em
   Pagar cinco vezes bem rápido. Nada de errado acontece. Agora encontre no
   código por que — não há `disabled`, não há debounce.

3. **Force a exaustividade.** Adicione o estado `{ status: 'refunded'; refundId: string }`
   à `CheckoutState`. Rode `npm run typecheck` e conte quantos lugares quebram.
   Faça a mesma coisa mentalmente na versão com booleanos: nada quebraria, e é
   isso que é perigoso.

4. **Cancelamento real.** No painel do XState, clique em Enviar e depois em
   Cancelar antes de terminar. A resposta atrasada não reativa a tela. Agora
   implemente o mesmo comportamento no nível do reducer, à mão, com
   `AbortController` — e compare a quantidade de código e de caminhos a lembrar.

5. **Timeout.** Ainda no XState, clique em Enviar e não faça nada. Em 5 segundos
   o `after` leva para `falhou`. Implemente esse timeout no reducer, garantindo
   que o `setTimeout` seja limpo em **todos** os caminhos de saída. Esse
   exercício é o melhor argumento a favor do XState que existe.

6. **O exercício de tech lead.** Pegue o fluxo mais confuso do seu produto
   (checkout, onboarding, upload, wizard). Desenhe a máquina no papel: estados,
   eventos, guardas. Leve para a pessoa de produto e pergunte o que acontece nas
   transições que você **não** desenhou. Na maioria das vezes, três ou quatro
   delas nunca foram especificadas — e é exatamente ali que estão os bugs
   abertos hoje.

---

## A frase para levar

> **Não valide estados inválidos. Torne-os inexprimíveis.**

Um `if` que se defende de um estado impossível é uma admissão de que o tipo está
errado. Corrija o tipo, e o `if` desaparece junto com a classe de bug.


---

## Faz parte de uma série

16 projetos independentes, um por conceito, sobre o que separa um dev pleno de um
senior/tech lead em React e Next.js. Cada um tem README, ADRs documentando as
decisões, e exercícios.

| Projeto | Conceito |
|---|---|
| [react-solid-na-pratica](https://github.com/vmarins2005/react-solid-na-pratica) | Os 5 principios SOLID traduzidos para componentes React, com anti-exemplo e versao boa lado a lado |
| [react-quando-abstrair](https://github.com/vmarins2005/react-quando-abstrair) | A mesma feature em 3 versoes: duplicada, abstraida cedo demais, e abstraida na hora certa |
| [react-padroes-de-componentes](https://github.com/vmarins2005/react-padroes-de-componentes) | Compound, headless, slots, state reducer e estado controlavel: como absorver variacao sem explodir em props |
| [react-arquitetura-por-feature](https://github.com/vmarins2005/react-arquitetura-por-feature) | Organizacao por feature em Next.js, com fronteiras garantidas por ESLint em vez de disciplina |
| [react-regra-de-negocio-no-front](https://github.com/vmarins2005/react-regra-de-negocio-no-front) | Clean Architecture no front: dominio puro, portas e adaptadores, sem uma linha de React no nucleo |
| [react-onde-mora-o-estado](https://github.com/vmarins2005/react-onde-mora-o-estado) | Os 6 tipos de estado em React e a ferramenta certa para cada um |
| `react-estados-impossiveis` **(você está aqui)** | Da sopa de booleanos ao XState: tornar estados invalidos inexprimiveis |
| [react-typescript-na-fronteira](https://github.com/vmarins2005/react-typescript-na-fronteira) | Tipo nao existe em runtime: validacao com Zod, branded types e verificacao de exaustividade |
| [react-testes-que-valem-a-pena](https://github.com/vmarins2005/react-testes-que-valem-a-pena) | Testing Trophy com Vitest, Testing Library, MSW, Playwright e axe |
| [react-performance-no-next](https://github.com/vmarins2005/react-performance-no-next) | Waterfalls de requisicao, streaming com Suspense e o que RSC realmente economiza de bundle |
| [react-entendendo-o-cache-do-next](https://github.com/vmarins2005/react-entendendo-o-cache-do-next) | As 4 camadas de cache do App Router e como diagnosticar dado velho na tela |
| [react-acessibilidade-na-pratica](https://github.com/vmarins2005/react-acessibilidade-na-pratica) | WCAG 2.2 AA em React: foco, teclado, live regions e os requisitos invisiveis em code review |
| [react-seguranca-no-next](https://github.com/vmarins2005/react-seguranca-no-next) | Server Action e endpoint publico: autorizacao, validacao, rate limit e CSP com nonce |
| [react-quando-quebra-em-producao](https://github.com/vmarins2005/react-quando-quebra-em-producao) | Taxonomia de erros, error boundaries, log estruturado e feature flags com kill switch |
| [react-design-system-em-monorepo](https://github.com/vmarins2005/react-design-system-em-monorepo) | Design system como pacote versionado: Turborepo, design tokens e changesets |
| [react-commits-que-contam-historia](https://github.com/vmarins2005/react-commits-que-contam-historia) | Commit atomico e Conventional Commits, com historico curado e um bug para achar via git bisect |

---

## Licença

[MIT](./LICENSE) — use, copie e adapte à vontade, inclusive em projeto comercial.
Se este material ajudou, uma estrela no repositório é o suficiente.
