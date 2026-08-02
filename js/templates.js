(function () {
  window.PromptTemplates = [
    { name:'Ajuste de layout', type:'visual', desiredChange:'Ajustar a organização visual e a responsividade de uma tela.', expectedResult:'A tela deve ficar organizada, legível e confortável em computador e celular.' },
    { name:'Correção de bug', type:'bug', desiredChange:'Investigar e corrigir um comportamento incorreto sem afetar outros fluxos.', expectedResult:'O fluxo deve funcionar conforme esperado e não apresentar regressões.' },
    { name:'Criação de nova tela', type:'feature', desiredChange:'Criar uma nova tela seguindo o padrão visual e arquitetural existente.', expectedResult:'A nova tela deve estar acessível pelo fluxo correto, validar dados e funcionar em celular.' },
    { name:'Criação de dashboard', type:'feature', desiredChange:'Criar um dashboard com os indicadores mais importantes para o usuário.', expectedResult:'Os dados devem ser apresentados com clareza, filtros úteis e estados de carregamento e erro.' },
    { name:'Integração com Google Sheets', type:'integration', desiredChange:'Integrar o sistema com uma planilha do Google Sheets sem expor credenciais.', expectedResult:'Os dados devem ser sincronizados com tratamento de falhas e registros úteis.' },
    { name:'Autenticação Google', type:'security', desiredChange:'Permitir login seguro usando uma conta Google.', expectedResult:'Usuários autorizados devem entrar com segurança e receber as permissões corretas.' },
    { name:'Importação de planilha', type:'feature', desiredChange:'Permitir importar dados a partir de uma planilha.', expectedResult:'O sistema deve validar o arquivo, informar erros por linha e impedir dados duplicados ou inválidos.' },
    { name:'Criação de relatório', type:'feature', desiredChange:'Criar um relatório com filtros e opção de exportação.', expectedResult:'O relatório deve apresentar dados corretos e preservar os filtros escolhidos na exportação.' },
    { name:'Alteração de banco de dados', type:'database', desiredChange:'Alterar a estrutura de dados preservando os registros existentes.', expectedResult:'A mudança deve usar migração reversível, ser testada e não causar perda de dados.' },
    { name:'Publicação no GitHub Pages', type:'deploy', desiredChange:'Publicar o projeto estático no GitHub Pages.', expectedResult:'O site deve abrir por uma URL pública com todos os arquivos e caminhos funcionando.' },
    { name:'Publicação na Hostinger', type:'deploy', desiredChange:'Publicar o projeto na hospedagem Hostinger.', expectedResult:'O sistema deve ficar acessível com HTTPS e possuir instruções de atualização e rollback.' },
    { name:'Revisão completa do projeto', type:'review', desiredChange:'Revisar o projeto em busca de problemas de usabilidade, segurança, desempenho e manutenção.', expectedResult:'Entregar melhorias priorizadas, testadas e documentadas sem alterar comportamentos esperados.' }
  ];
}());
