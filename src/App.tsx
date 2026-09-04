import { SopaDeBooleanosRuim } from './booleanos/SopaDeBooleanos.ruim'
import { CheckoutReducerDemo } from './reducer/CheckoutReducerDemo'
import { UploadDemo } from './xstate/UploadDemo'

export function App() {
  return (
    <main>
      <h1>Máquinas de estado</h1>
      <p>
        A ideia que atravessa os três exemplos abaixo:{' '}
        <strong>tornar os estados inválidos inexprimíveis</strong>, em vez de se defender
        deles com <code>if</code>. Toda vez que o tipo permite mais do que a realidade,
        a diferença vira bug.
      </p>

      <h2>
        Nível 0 — a sopa de booleanos <span className="tag bad">anti-exemplo</span>
      </h2>
      <p>
        Cinco booleanos independentes = 32 combinações, das quais 5 são válidas. Clique
        em Pagar até dar erro: o spinner nunca some e coexiste com a mensagem de recusa.
      </p>
      <div className="panel">
        <SopaDeBooleanosRuim />
      </div>

      <h2>
        Nível 1 — useReducer <span className="tag good">resolve a maioria dos casos</span>
      </h2>
      <p>
        União discriminada + tabela de transição. Estados impossíveis deixam de compilar,
        e cada dado só existe no estado em que faz sentido. Sem biblioteca nenhuma.
      </p>
      <div className="panel">
        <CheckoutReducerDemo />
      </div>

      <h2>
        Nível 2 — XState <span className="tag">quando o fluxo é grande</span>
      </h2>
      <p>
        Efeito ligado ao estado (e cancelado com ele), timeout declarativo, guardas
        nomeadas e <code>state.can()</code> para a UI consultar a especificação em vez de
        duplicá-la.
      </p>
      <div className="panel">
        <UploadDemo />
      </div>

      <h2>Como escolher</h2>
      <table className="panel" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Situação</th>
            <th align="left">Ferramenta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2 estados, sem assíncrono</td>
            <td>
              <code>useState</code> com booleano — e está tudo bem
            </td>
          </tr>
          <tr>
            <td>3 a 5 estados mutuamente exclusivos</td>
            <td>
              <code>useReducer</code> + união discriminada
            </td>
          </tr>
          <tr>
            <td>Efeito assíncrono que precisa ser cancelado ao sair do estado</td>
            <td>XState (ou reducer + AbortController à mão)</td>
          </tr>
          <tr>
            <td>Estados aninhados, paralelos ou com timeout por estado</td>
            <td>XState</td>
          </tr>
          <tr>
            <td>O requisito precisa ser conferido com produto antes de codar</td>
            <td>XState (a máquina é desenhável e revisável)</td>
          </tr>
        </tbody>
      </table>
    </main>
  )
}
