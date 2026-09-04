import { useState } from 'react'

/**
 * ANTI-EXEMPLO — a "sopa de booleanos".
 *
 * Cinco booleanos independentes descrevem 2⁵ = **32 combinações**. Destas, 5 são
 * válidas. As outras 27 são estados impossíveis que o TypeScript permite, o
 * componente aceita e a tela renderiza de forma imprevisível.
 *
 * Você já viu todas elas em produção:
 *
 *     isLoading && isError          -> spinner e mensagem de erro juntos
 *     isSuccess && isError          -> "pedido aprovado" com aviso de falha
 *     !isLoading && !isSuccess && !isError && submitted  -> tela em branco
 *
 * E o bug clássico, que sempre aparece no `finally` esquecido:
 * `isLoading` fica `true` para sempre porque um caminho de erro não o desligou.
 *
 * A raiz do problema é que estes booleanos NÃO são independentes — eles são
 * mutuamente exclusivos — mas o tipo diz que são independentes. Toda vez que o
 * tipo permite mais do que a realidade, a diferença vira bug.
 *
 * O sinal de diagnóstico em code review: **três ou mais booleanos que nunca são
 * verdadeiros ao mesmo tempo.** Aí não são booleanos, é um estado só, com nomes.
 */
export function SopaDeBooleanosRuim() {
  const [isIdle, setIsIdle] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  async function submit() {
    setIsIdle(false)
    setIsLoading(true)
    setIsError(false)
    try {
      await new Promise((resolve, reject) =>
        setTimeout(() => (Math.random() > 0.5 ? resolve(null) : reject(new Error())), 800),
      )
      setIsSuccess(true)
    } catch {
      setIsError(true)
      // BUG PROPOSITAL: `isLoading` nunca volta a false neste caminho.
      // É exatamente assim que ele acontece em produção — um `finally` que
      // alguém esqueceu de escrever, num caminho que ninguém testou.
      return
    }
    setIsLoading(false)
  }

  function retry() {
    setIsRetrying(true)
    void submit()
    // E aqui `isRetrying` nunca volta a false. Segundo estado órfão.
  }

  return (
    <div>
      <div className="row">
        <button onClick={() => void submit()}>Pagar</button>
        <button onClick={retry}>Tentar de novo</button>
      </div>

      {/* A renderização vira uma cascata de condições que ninguém consegue
          verificar de cabeça. Adicionar um estado novo exige revisar TODAS. */}
      {isIdle && <p>Pronto para pagar.</p>}
      {isLoading && <p>Processando...</p>}
      {isRetrying && <p>Tentando novamente...</p>}
      {isSuccess && <p style={{ color: 'var(--good)' }}>Aprovado!</p>}
      {isError && <p style={{ color: 'var(--bad)' }}>Recusado.</p>}

      <p className="muted">
        Clique em Pagar até dar erro. O spinner nunca some, e ele coexiste com a
        mensagem de recusa — dois estados que deveriam ser mutuamente exclusivos.
      </p>
      <code className="muted">
        idle:{String(isIdle)} loading:{String(isLoading)} success:{String(isSuccess)} error:
        {String(isError)} retry:{String(isRetrying)}
      </code>
    </div>
  )
}
