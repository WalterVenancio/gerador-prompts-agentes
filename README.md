# Gerador de Prompts para Codex e Antigravity

Aplicação web estática que transforma uma ideia descrita em linguagem simples em uma especificação técnica organizada e um prompt pronto para Codex, Google Antigravity, Claude Code ou outro agente de programação.

## Objetivo

Guiar pessoas com pouco conhecimento técnico por perguntas objetivas, sem exigir que saibam arquitetura, banco de dados ou programação. Todo o processamento acontece localmente no navegador.

## Funcionalidades

- fluxo compacto em três etapas com barra de progresso;
- quatro perguntas essenciais como núcleo de qualquer solicitação;
- classificação automática entre dez tipos, com ajuste manual;
- perguntas complementares condicionais e opcionais;
- preferências persistentes para agente, planejamento, Git, testes, documentação, idioma e detalhamento;
- doze modelos rápidos editáveis;
- revisão, premissas, pontos pendentes e riscos antes do resultado;
- validação dos campos mínimos;
- especificação técnica com 24 seções;
- prompt final adaptado ao agente e idioma escolhidos;
- classificação automática em simples, média, complexa ou crítica;
- recomendação de execução direta ou modo planejamento;
- salvamento automático e manual de rascunho no `localStorage`;
- histórico com abertura, duplicação e exclusão;
- cópia do prompt e da especificação;
- download em TXT;
- interface responsiva e acessível por teclado.

## Estrutura de arquivos

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── questions.js
│   ├── templates.js
│   └── storage.js
├── assets/
│   └── icons/
├── README.md
├── LICENSE
└── .gitignore
```

## Como executar localmente

Não há instalação ou compilação. Abra `index.html` diretamente no navegador. Alguns navegadores restringem a área de transferência em arquivos locais; nesse caso, sirva a pasta com qualquer servidor HTTP local, por exemplo:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicação no GitHub Pages

1. Envie estes arquivos para a branch principal de um repositório GitHub.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Selecione a branch `main`, a pasta `/ (root)` e salve.
5. Aguarde o endereço informado pelo GitHub ficar disponível.

Como todos os caminhos são relativos e o projeto não possui build, ele funciona em um subdiretório do GitHub Pages.

### Domínio personalizado

Antes de configurar `prompts.venancio.eng.br`, confirme o endereço Pages publicado. No provedor DNS, crie um registro `CNAME` para o host `prompts` apontando para `<usuario>.github.io`. Em seguida, informe `prompts.venancio.eng.br` em **Settings → Pages → Custom domain**, aguarde a validação DNS e habilite **Enforce HTTPS**. Não adicione um arquivo `CNAME` antes de confirmar o usuário/organização e a URL final.

## Como alterar perguntas

Edite `js/questions.js`:

- `types` contém as categorias usadas na classificação;
- `conditional` contém os campos principais e o bloco “Mais detalhes” de cada categoria;
- `sharedMore` contém perguntas opcionais compartilhadas.

Cada pergunta usa um identificador único, rótulo, tipo e, quando aplicável, opções. Se uma nova resposta também precisar aparecer em uma seção técnica específica, inclua seu identificador no mapeamento da função `buildResult` em `js/app.js`.

## Como criar novos templates

Adicione um objeto ao array em `js/templates.js` com:

```js
{
  name: 'Nome visível',
  type: 'feature',
  desiredChange: 'Texto inicial editável',
  currentBehavior: 'Situação atual editável',
  expectedResult: 'Resultado inicial editável',
  preserve: 'Condições que devem ser preservadas'
}
```

O valor de `type` deve corresponder a um identificador existente em `questions.js`.

## Histórico e armazenamento local

O botão **Limpar histórico** remove os prompts já gerados. **Limpar formulário** também remove o rascunho atual. Preferências, rascunho e histórico usam chaves separadas no `localStorage`. Registros do formato anterior são convertidos ao serem abertos, sem apagar o conteúdo original. Os dados podem desaparecer ao limpar dados do site, usar modo privado, trocar de navegador ou dispositivo. O histórico é limitado aos 50 itens mais recentes.

## Segurança

- não usa backend, analytics, cookies de rastreamento ou APIs externas;
- não envia respostas pela internet;
- não armazena credenciais deliberadamente;
- não insira senhas, tokens, chaves de API ou dados pessoais/confidenciais nos campos;
- revise o prompt antes de compartilhá-lo com qualquer ferramenta.

## Limitações

- os dados não sincronizam entre dispositivos;
- não há recuperação após a limpeza do armazenamento do navegador;
- a complexidade é uma estimativa baseada nas respostas, não uma análise do código real;
- o TXT é o único formato de exportação nativo.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
