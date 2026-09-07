# ADR-001 — Modelar todo estado assíncrono como união discriminada

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

O padrão dominante para operações assíncronas na base era um conjunto de flags:

```ts
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

Três variáveis independentes = 8 combinações; 3 são válidas. As inválidas
aparecem em produção com regularidade:

- `loading: true, error: 'x'` — spinner e erro simultâneos
- `loading: true` permanente porque um caminho de erro não desligou a flag
- `data: null, loading: false, error: null` — tela em branco sem explicação

Uma auditoria informal de incidentes mostrou que a maioria dos bugs de "tela
travada carregando" tinha essa forma. E o pior: **o TypeScript não ajuda em
nenhum deles**, porque o tipo declara como independentes três coisas que são
mutuamente exclusivas.

## Decisão

Todo estado assíncrono é uma **união discriminada com campos por variante**:

```ts
type Async<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }
```

Regras:
- o dado vive **dentro** da variante que o produz, nunca solto ao lado
- a renderização usa `switch` exaustivo, não cascata de `&&`
- transições de estado ficam num reducer, não espalhadas em handlers

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Flags booleanas | Familiar; escrita rápida | 2ⁿ combinações; nenhum apoio do compilador; flag órfã é o bug mais comum | É o problema |
| `status` + campos opcionais soltos (`error?`, `data?`) | Melhor que booleanos; um estado só | Ainda permite `{status:'idle', error:'x'}`; obriga `data!` ou checagem redundante em todo uso | Fecha metade do buraco |
| Classe com métodos (`isLoading()`) | Encapsula | Não estreita tipo; `data` continua opcional | Ergonomia pior sem ganho |
| União discriminada com campos por variante | Estados inválidos deixam de compilar; dado só existe onde faz sentido; exaustividade verificada | Mais verboso ao construir; exige `switch` para ler | **Escolhida** |

## Consequências

**Positivas**
- Estados inválidos deixam de ser representáveis — a classe de bug desaparece,
  em vez de ser tratada caso a caso.
- Acesso a `data` fora de `success` **não compila**. Fim do `data!` e do
  `data?.items ?? []` defensivo espalhado.
- Adicionar uma variante (`refunded`, `cancelled`) quebra a compilação em todo
  `switch` que não a trata. O compilador vira revisor de completude.
- A renderização passa a ser legível de cima a baixo: um bloco por estado.

**Negativas**
- Construir o objeto é mais verboso: `setState({ status: 'success', data })` em
  vez de dois setters.
- Ler exige estreitar o tipo antes; não dá para acessar `state.data` direto.
- Transição parcial fica desconfortável de propósito ("mostrar dado antigo
  enquanto revalida" não cabe em `Async<T>` puro). Nesses casos, ou a variante
  ganha um campo (`{ status: 'refreshing'; data: T }`), ou o caso é de cache e
  pertence ao TanStack Query — ver o projeto [react-state-management](https://github.com/vmarins2005/react-state-management).

**Nota de integração**
- TanStack Query já expõe seu estado nesse formato (`isPending`/`isError`/
  `isSuccess` com narrowing correto em `data`). Onde ele é usado, esta decisão
  já está aplicada — não recrie a união por fora.

**Monitorar**
- Ocorrências de `useState(false)` chamado `loading` ou `isLoading` fora de
  componentes triviais. Cada uma é uma candidata a esta refatoração.

## Nota transferível

O princípio, que vale muito além de React:

> **Make illegal states unrepresentable.**

Se você está escrevendo um `if` para se defender de uma combinação que não
deveria existir, o tipo está errado. Corrija o tipo, e o `if` some junto com o
bug.
