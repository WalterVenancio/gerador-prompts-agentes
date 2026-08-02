(function () {
  const input = (id, label, placeholder = '') => ({ id, label, type: 'input', placeholder });
  const text = (id, label, placeholder = '') => ({ id, label, type: 'textarea', placeholder });
  const select = (id, label, options = ['Não sei informar', 'Não', 'Sim']) => ({ id, label, type: 'select', options });

  window.PromptQuestions = {
    types: [
      ['visual', 'Ajuste visual', 'Layout, responsividade ou aparência'],
      ['bug', 'Correção de erro', 'Comportamento incorreto ou falha'],
      ['feature', 'Nova funcionalidade', 'Novo recurso em projeto existente'],
      ['integration', 'Integração', 'Conexão com sistema ou API'],
      ['database', 'Banco de dados', 'Estruturas, dados ou migrações'],
      ['new-system', 'Projeto do zero', 'Criação de um novo sistema'],
      ['deploy', 'Publicação', 'Hospedagem ou configuração'],
      ['security', 'Autenticação', 'Login, segurança ou permissões'],
      ['review', 'Revisão geral', 'Qualidade, organização ou desempenho'],
      ['other', 'Outro', 'Solicitação não classificada']
    ].map(([id, title, description]) => ({ id, title, description })),

    conditional: {
      visual: {
        primary: [input('element','Qual elemento precisa ser ajustado?','Ex.: barra de ações da reunião'),select('mobile','Deve funcionar em celular?'),input('reference','Existe imagem de referência?','Ex.: anexo ou caminho do arquivo')],
        more: [select('keepVisualPattern','Manter o padrão visual atual?'),select('singleScreen','A alteração fica somente nesta tela?'),input('affectedScreens','Outras telas podem ser afetadas?')]
      },
      bug: {
        primary: [input('whenHappens','Quando o erro acontece?','Ex.: ao salvar um registro'),input('errorMessage','Qual mensagem aparece?','Ex.: informe o texto, sem dados sensíveis'),text('reproductionSteps','Quais passos reproduzem o erro?','Ex.: abrir cadastro, editar e salvar')],
        more: [select('frequency','Com que frequência ocorre?',['Não sei informar','Sempre','Às vezes','Uma vez']),input('evidence','Onde estão as evidências?','Ex.: caminho de imagens ou logs'),input('attemptedFixes','O que já foi tentado?')]
      },
      feature: {
        primary: [input('allowedUsers','Quem utilizará?','Ex.: administradores'),text('userActions','Quais ações estarão disponíveis?','Ex.: criar, editar e exportar'),text('inputData','Quais dados serão informados?','Ex.: nome, data e responsável'),text('outputData','Quais dados serão exibidos?','Ex.: status e histórico')],
        more: [text('validations','Quais validações são necessárias?'),select('differentPermissions','Haverá permissões diferentes?'),select('mobile','Deve funcionar em celular?'),input('impact','Quais impactos são esperados?')]
      },
      integration: {
        primary: [input('service','Qual sistema será integrado?','Ex.: Google Sheets'),text('sentData','Quais dados serão enviados?'),text('receivedData','Quais dados serão recebidos?'),select('authentication','A integração exige autenticação?')],
        more: [input('frequency','Qual será a frequência?'),text('failureHandling','Como tratar falhas?'),select('logs','Registrar logs?'),input('apiDocs','Onde está a documentação?')]
      },
      database: {
        primary: [text('storedInfo','Qual informação será armazenada?'),select('dataMigration','Será necessária migração?'),text('existingData','Como os dados existentes devem ser tratados?')],
        more: [select('historyNeeded','Precisa manter histórico?'),select('rollbackNeeded','Precisa de rollback?'),input('fields','Quais campos são esperados?'),input('affectedQueries','Quais consultas ou relatórios podem ser afetados?')]
      },
      'new-system': {
        primary: [input('projectName','Nome do projeto','Ex.: Agenda de visitas'),text('systemGoal','Objetivo principal','Ex.: organizar visitas da equipe'),select('appType','Tipo de aplicação',['Não sei informar','Aplicação web','Aplicativo móvel','Site','Sistema interno','Outro']),input('systemUsers','Quem utilizará?','Ex.: equipe comercial'),select('devices','Dispositivos de acesso',['Computador e celular','Computador','Celular','Tablet','Não sei informar']),text('mainFeatures','Funcionalidades essenciais','Ex.: cadastro, agenda e relatório')],
        more: [select('loginNeeded','Precisa de login?'),text('storedData','Quais dados serão armazenados?'),text('integrations','Quais integrações serão necessárias?'),input('hosting','Onde pretende publicar?'),input('technologyPreference','Preferência tecnológica (opcional)','Deixe em branco para receber uma recomendação')]
      },
      deploy: {
        primary: [input('publishTarget','Onde deverá ser publicado?','Ex.: GitHub Pages ou Hostinger'),input('domain','Domínio ou subdomínio','Ex.: app.exemplo.com.br'),text('deployErrors','Existem erros atuais de publicação?')],
        more: [select('https','Precisa de HTTPS?'),select('envVars','Usa variáveis de ambiente?'),select('backupNeeded','Precisa de backup?'),select('rollbackNeeded','Precisa de rollback?')]
      },
      security: {
        primary: [input('roles','Quais perfis de acesso existirão?','Ex.: administrador e usuário'),text('roleView','O que cada perfil poderá visualizar?'),text('roleEdit','O que cada perfil poderá alterar?'),select('socialAuth','Usará login Google ou Microsoft?')],
        more: [select('passwordRecovery','Precisa recuperar senha?'),select('logs','Precisa de logs?'),input('sessionTime','Tempo de sessão esperado'),select('lgpd','Precisa atender à LGPD?')]
      },
      review: {
        primary: [input('reviewArea','Qual parte deve ser revisada?','Ex.: fluxo de cadastro'),select('reviewPriority','Principal foco',['Usabilidade','Desempenho','Organização','Segurança','Manutenção']),text('improvementValidation','Como a melhoria será validada?')],
        more: [select('changeArchitecture','Pode modificar a arquitetura?'),select('refactorFiles','Pode refatorar arquivos?'),select('deleteUnused','Pode remover código sem uso?')]
      },
      other: {
        primary: [text('otherDetails','Há algum detalhe específico que ajude a compreender a solicitação?')],
        more: []
      }
    },

    sharedMore: [
      input('involvedArea','Tela, módulo ou funcionalidade','Ex.: reunião semanal'),
      select('priority','Prioridade',['Não informada','Baixa','Média','Alta','Urgente']),
      input('deadline','Prazo desejado','Ex.: até o fim do mês'),
      text('additionalNotes','Observações adicionais','Inclua somente informações relevantes.')
    ]
  };
}());
