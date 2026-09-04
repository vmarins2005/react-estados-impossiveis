import { useMachine } from '@xstate/react'
import { uploadMachine } from './uploadMachine'

export function UploadDemo() {
  const [state, send] = useMachine(uploadMachine)

  return (
    <div>
      <div className="row">
        <button
          onClick={() => send({ type: 'SELECT', fileName: `relatorio-${Date.now() % 1000}.pdf` })}
        >
          Selecionar arquivo
        </button>

        {/*
          `state.can(...)` pergunta à MÁQUINA se o evento é aceito no estado
          atual. A UI deixa de decidir quando um botão está habilitado — ela
          consulta a especificação. Sem duplicação de regra, sem divergência.
        */}
        <button onClick={() => send({ type: 'UPLOAD' })} disabled={!state.can({ type: 'UPLOAD' })}>
          Enviar
        </button>
        <button onClick={() => send({ type: 'CANCEL' })} disabled={!state.can({ type: 'CANCEL' })}>
          Cancelar
        </button>
        <button onClick={() => send({ type: 'RETRY' })} disabled={!state.can({ type: 'RETRY' })}>
          Tentar de novo
        </button>
        <button onClick={() => send({ type: 'RESET' })} disabled={!state.can({ type: 'RESET' })}>
          Limpar
        </button>
      </div>

      <p>
        {state.matches('vazio') && 'Nenhum arquivo selecionado.'}
        {state.matches('pronto') && `Pronto para enviar: ${state.context.fileName}`}
        {state.matches('enviando') && `Enviando ${state.context.fileName}...`}
        {state.matches('falhou') && (
          <span style={{ color: 'var(--bad)' }}>
            {state.context.error} — tentativa {state.context.attempts} de 3
          </span>
        )}
        {state.matches('concluido') && (
          <span style={{ color: 'var(--good)' }}>Enviado com sucesso.</span>
        )}
      </p>

      <p className="muted">
        Clique em Enviar e depois em Cancelar antes de terminar. A requisição é
        cancelada com o estado — nenhuma resposta atrasada consegue reativar a tela.
        Se ninguém cancelar, o timeout declarativo de 5s entra sozinho.
      </p>

      <code className="muted">
        estado: {JSON.stringify(state.value)} — contexto:{' '}
        {JSON.stringify({ attempts: state.context.attempts })}
      </code>
    </div>
  )
}
