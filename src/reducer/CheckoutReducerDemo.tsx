import { useReducer } from 'react'
import { canRetry, checkoutReducer, INITIAL_CHECKOUT } from './checkoutReducer'

async function charge(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  if (Math.random() > 0.5) throw new Error('Saldo insuficiente')
  return `tx_${Date.now().toString(36)}`
}

export function CheckoutReducerDemo() {
  const [state, dispatch] = useReducer(checkoutReducer, INITIAL_CHECKOUT)

  async function run() {
    try {
      dispatch({ type: 'APPROVED', transactionId: await charge() })
    } catch (error) {
      dispatch({ type: 'DECLINED', reason: error instanceof Error ? error.message : 'Erro' })
    }
  }

  function submit() {
    dispatch({ type: 'SUBMIT' })
    void run()
  }

  return (
    <div>
      {/*
        A renderização vira um `switch` exaustivo, e essa é a maior vitória
        prática: adicionar um estado novo QUEBRA A COMPILAÇÃO aqui até que ele
        seja tratado. Compare com a cascata de `&&` da versão com booleanos, que
        aceita o estado novo em silêncio e simplesmente não renderiza nada.
      */}
      {state.status === 'idle' && (
        <div>
          <p>Pronto para pagar.</p>
          <button onClick={submit}>Pagar</button>
        </div>
      )}

      {state.status === 'processing' && (
        <p>Processando... (tentativa {state.attempt})</p>
      )}

      {state.status === 'approved' && (
        <div>
          <p style={{ color: 'var(--good)' }}>
            {/* `transactionId` só existe neste estado — e o compilador sabe. */}
            Aprovado! Transação {state.transactionId}
          </p>
          <button onClick={() => dispatch({ type: 'RESET' })}>Nova compra</button>
        </div>
      )}

      {state.status === 'declined' && (
        <div>
          <p style={{ color: 'var(--bad)' }}>
            Recusado: {state.reason} (tentativa {state.attempt} de 3)
          </p>
          <div className="row">
            <button
              onClick={() => {
                dispatch({ type: 'RETRY' })
                void run()
              }}
              disabled={!canRetry(state)}
            >
              Tentar de novo
            </button>
            <button onClick={() => dispatch({ type: 'RESET' })}>Cancelar</button>
          </div>
        </div>
      )}

      <p className="muted">
        Clique em Pagar várias vezes seguidas, rápido. Nada acontece de errado: o
        segundo SUBMIT chega no estado <code>processing</code>, que não tem transição
        para ele. Sem <code>disabled</code>, sem <code>debounce</code>, sem flag.
      </p>
      <code className="muted">estado: {JSON.stringify(state)}</code>
    </div>
  )
}
