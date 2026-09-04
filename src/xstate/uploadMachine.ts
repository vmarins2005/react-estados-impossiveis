import { assign, fromPromise, setup } from 'xstate'

/**
 * NÍVEL 2 — XState. **Quando ele se paga, e quando não.**
 *
 * `useReducer` já resolve estados mutuamente exclusivos. XState entra quando o
 * fluxo tem características que um reducer não modela bem:
 *
 *   - **efeitos assíncronos ligados ao estado** (`invoke`): a requisição
 *     pertence ao estado, e é cancelada automaticamente ao sair dele. Num
 *     reducer você dispara o efeito por fora e precisa cancelar à mão.
 *   - **estados aninhados e paralelos**: "editando" contendo "salvando",
 *     "validando" e "com erro de rede" simultaneamente.
 *   - **atividades com duração** (`after`): timeout declarativo por estado.
 *   - **guardas nomeadas**: a condição vira parte da especificação legível.
 *   - **visualização**: a máquina pode ser desenhada e conferida com produto —
 *     o que muda a natureza da conversa sobre requisito.
 *
 * O custo, que é real: uma dependência, um modelo mental novo, e uma barreira
 * para quem entra no time. Não use por elegância. Use quando o fluxo tiver
 * ramificações o bastante para você já ter errado uma delas.
 *
 * Regra prática: **até 4 estados e um efeito, `useReducer`. Além disso,
 * considere XState.**
 */

type UploadContext = {
  progress: number
  fileName: string | null
  error: string | null
  attempts: number
}

const MAX_ATTEMPTS = 3

export const uploadMachine = setup({
  types: {
    context: {} as UploadContext,
    events: {} as
      | { type: 'SELECT'; fileName: string }
      | { type: 'UPLOAD' }
      | { type: 'CANCEL' }
      | { type: 'RETRY' }
      | { type: 'RESET' },
  },

  actors: {
    /**
     * O efeito assíncrono é declarado como ATOR da máquina, não disparado por
     * fora. A consequência prática: ao sair do estado `uploading` (por CANCEL
     * ou por timeout), o XState cancela este ator automaticamente. Não existe
     * "resposta que chega depois do cancelamento e reativa a tela".
     */
    uploadFile: fromPromise<{ url: string }, { fileName: string }>(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1800))
      if (Math.random() > 0.55) throw new Error('Conexão interrompida')
      return { url: `https://cdn.exemplo.com/${input.fileName}` }
    }),
  },

  guards: {
    // Guarda nomeada: a regra fica legível na definição da máquina, em vez de
    // escondida num `if` dentro de um handler.
    podeTentarDeNovo: ({ context }) => context.attempts < MAX_ATTEMPTS,
  },
}).createMachine({
  id: 'upload',
  initial: 'vazio',
  context: { progress: 0, fileName: null, error: null, attempts: 0 },

  states: {
    vazio: {
      on: {
        SELECT: {
          target: 'pronto',
          actions: assign({ fileName: ({ event }) => event.fileName, error: null, attempts: 0 }),
        },
      },
    },

    pronto: {
      on: {
        UPLOAD: 'enviando',
        SELECT: { actions: assign({ fileName: ({ event }) => event.fileName }) },
      },
    },

    enviando: {
      entry: assign({ attempts: ({ context }) => context.attempts + 1, error: null }),

      invoke: {
        src: 'uploadFile',
        input: ({ context }) => ({ fileName: context.fileName ?? '' }),
        onDone: 'concluido',
        onError: {
          target: 'falhou',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'Falha no envio',
          }),
        },
      },

      /**
       * Timeout DECLARATIVO. Num reducer isto seria um `setTimeout` disparado
       * por fora, com a obrigação de limpá-lo em todos os caminhos de saída —
       * e o esquecimento de um deles é o vazamento clássico.
       */
      after: {
        5000: {
          target: 'falhou',
          actions: assign({ error: 'Tempo esgotado' }),
        },
      },

      on: { CANCEL: 'pronto' },
    },

    falhou: {
      on: {
        RETRY: { target: 'enviando', guard: 'podeTentarDeNovo' },
        RESET: { target: 'vazio', actions: assign({ fileName: null, error: null, attempts: 0 }) },
      },
    },

    concluido: {
      on: {
        RESET: {
          target: 'vazio',
          actions: assign({ fileName: null, error: null, attempts: 0, progress: 0 }),
        },
      },
    },
  },
})
