/**
 * NÍVEL 1 — máquina de estados com `useReducer`, sem biblioteca.
 *
 * É a resposta certa para a maioria dos casos, e é o que você deve alcançar
 * **antes** de considerar XState. Resolve o problema central da sopa de
 * booleanos: os estados passam a ser mutuamente exclusivos por construção.
 *
 * Duas propriedades que a união discriminada dá de graça:
 *
 *   1. **Estados impossíveis deixam de ser representáveis.** Não existe
 *      `{ status: 'loading', error: '...' }`, porque `loading` não tem campo
 *      `error`. O compilador recusa.
 *
 *   2. **Dado só existe onde faz sentido.** `transactionId` só está disponível
 *      em `approved`. Tentar lê-lo em `idle` não compila — em vez de devolver
 *      `undefined` e quebrar três telas adiante.
 *
 * Compare com a alternativa comum de `status: 'idle' | 'loading' | ...` mais
 * campos opcionais soltos (`error?: string; data?: T`). Aquilo é melhor que
 * booleanos, mas ainda permite `{status: 'idle', error: 'x'}`. A união
 * discriminada com campos POR VARIANTE é o que fecha o buraco.
 */

export type CheckoutState =
  | { status: 'idle' }
  | { status: 'processing'; attempt: number }
  | { status: 'approved'; transactionId: string }
  | { status: 'declined'; reason: string; attempt: number }

export type CheckoutEvent =
  | { type: 'SUBMIT' }
  | { type: 'RETRY' }
  | { type: 'APPROVED'; transactionId: string }
  | { type: 'DECLINED'; reason: string }
  | { type: 'RESET' }

const MAX_ATTEMPTS = 3

/**
 * A TABELA DE TRANSIÇÃO.
 *
 * Repare que o `switch` externo é por ESTADO, e o interno por EVENTO. Não é
 * estilo: é o que torna a máquina legível como especificação. Dá para ler este
 * arquivo com uma pessoa de produto e conferir a regra junto, linha a linha.
 *
 * O `default: return state` no fim de cada estado codifica a regra mais
 * importante e a mais esquecida: **evento inválido para o estado atual é
 * IGNORADO, não é erro.** Clicar duas vezes em "Pagar" não dispara dois
 * pagamentos — o segundo SUBMIT chega em `processing` e não tem transição.
 *
 * Essa única linha elimina a classe inteira de bug do "duplo clique", que na
 * versão com booleanos exige um `disabled` correto em todo botão, em toda tela.
 */
export function checkoutReducer(state: CheckoutState, event: CheckoutEvent): CheckoutState {
  switch (state.status) {
    case 'idle':
      switch (event.type) {
        case 'SUBMIT':
          return { status: 'processing', attempt: 1 }
        default:
          return state
      }

    case 'processing':
      switch (event.type) {
        case 'APPROVED':
          return { status: 'approved', transactionId: event.transactionId }
        case 'DECLINED':
          return { status: 'declined', reason: event.reason, attempt: state.attempt }
        default:
          // SUBMIT aqui é ignorado. É isto que impede o pagamento duplicado.
          return state
      }

    case 'declined':
      switch (event.type) {
        case 'RETRY':
          // Guarda: a regra de "no máximo 3 tentativas" mora na transição,
          // não espalhada em `if` na UI.
          return state.attempt >= MAX_ATTEMPTS
            ? state
            : { status: 'processing', attempt: state.attempt + 1 }
        case 'RESET':
          return { status: 'idle' }
        default:
          return state
      }

    case 'approved':
      switch (event.type) {
        case 'RESET':
          return { status: 'idle' }
        default:
          // Nenhum evento tira daqui além de RESET. Um pagamento aprovado não
          // pode ser "recusado" por uma resposta atrasada que chegou depois.
          return state
      }
  }
}

export const INITIAL_CHECKOUT: CheckoutState = { status: 'idle' }

export function canRetry(state: CheckoutState): boolean {
  return state.status === 'declined' && state.attempt < MAX_ATTEMPTS
}
