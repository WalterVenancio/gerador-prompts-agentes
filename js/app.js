(function () {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const Q = window.PromptQuestions;
  const S = window.PromptStorage;
  const state = { step:1, selectedType:'feature', typeManuallySelected:false, generated:null, preferences:S.getPreferences() };
  const stepNames = ['Solicitação principal','Detalhes específicos','Revisão e prompt'];
  let toastTimer;

  const escapeHtml = (value='') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const typeInfo = (id=state.selectedType) => Q.types.find(type => type.id === id) || Q.types[2];
  const allDefs = (typeId=state.selectedType) => [...(Q.conditional[typeId]?.primary || []), ...(Q.conditional[typeId]?.more || []), ...Q.sharedMore];
  const meaningful = value => value && !['Não sei informar','Não informada'].includes(value);
  const answer = (data,id,fallback='Não informado pelo usuário.') => meaningful(data[id]) ? data[id] : fallback;

  function showToast(message) {
    const toast=$('#toast'); toast.textContent=message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2400);
  }

  function classifyRequest(data) {
    const content=`${data.desiredChange||''} ${data.currentBehavior||''} ${data.expectedResult||''}`.toLowerCase();
    const rules=[
      ['new-system',/(novo sistema|criar (um )?(sistema|aplicativo|app)|projeto do zero|do zero)/],
      ['integration',/(integr(a|ar|ação)|\bapi\b|webhook|google sheets|sincroniz)/],
      ['database',/(banco de dados|tabela|migra(ção|r)|sql|campo no banco|armazenar dados)/],
      ['security',/(login|autentica|permiss|seguran|senha|perfil de acesso|lgpd)/],
      ['deploy',/(publica(ção|r)|hospeda|github pages|hostinger|domínio|deploy|colocar no ar)/],
      ['bug',/(erro|bug|falha|não funciona|quebra|corrigir|incorreto)/],
      ['feature',/(adicionar|criar|nova funcionalidade|novo recurso|relatório|dashboard|importar)/],
      ['visual',/(layout|visual|bot(ão|ões)|alinha|espaçamento|\bcores?\b|css|responsiv|tela|posição)/],
      ['review',/(revis(ar|ão)|refator|desempenho|performance|melhoria geral|organiza(ção|r))/]
    ];
    return rules.find(([,pattern])=>pattern.test(content))?.[0] || 'feature';
  }

  function renderTypeSegments() {
    $('#typeSegments').innerHTML=Q.types.map(type=>`<label class="segment ${type.id===state.selectedType?'selected':''}"><input type="radio" name="requestTypeChoice" value="${type.id}" ${type.id===state.selectedType?'checked':''}><span>${escapeHtml(type.title)}</span></label>`).join('');
    $$('#typeSegments input').forEach(input=>input.addEventListener('change',()=>selectType(input.value)));
  }

  function fieldMarkup(def) {
    const id=escapeHtml(def.id), label=escapeHtml(def.label), placeholder=escapeHtml(def.placeholder||'Se souber, informe aqui.');
    if(def.type==='select') return `<div class="field"><label for="${id}">${label} <span class="optional">Opcional</span></label><select id="${id}" name="${id}">${def.options.map(option=>`<option>${escapeHtml(option)}</option>`).join('')}</select></div>`;
    if(def.type==='input') return `<div class="field"><label for="${id}">${label} <span class="optional">Opcional</span></label><input id="${id}" name="${id}" placeholder="${placeholder}"></div>`;
    return `<div class="field"><label for="${id}">${label} <span class="optional">Opcional</span></label><textarea class="auto-grow" id="${id}" name="${id}" rows="2" placeholder="${placeholder}"></textarea></div>`;
  }

  function renderDynamicFields(values={}) {
    const existing=collectDynamicValues();
    const config=Q.conditional[state.selectedType] || Q.conditional.other;
    $('#conditionalFields').innerHTML=config.primary.map(fieldMarkup).join('');
    $('#moreFields').innerHTML=[...config.more,...Q.sharedMore].map(fieldMarkup).join('');
    $('#detectedTypeLabel').textContent=typeInfo().title;
    renderTypeSegments();
    Object.entries({...existing,...values}).forEach(([key,value])=>{ const field=$(`[name="${CSS.escape(key)}"]`); if(field && value!=null) field.value=value; });
    bindAutoGrow();
  }

  function collectDynamicValues() {
    const values={}; $$('#conditionalFields [name],#moreFields [name]').forEach(field=>values[field.name]=field.value); return values;
  }

  function selectType(id) {
    state.selectedType=id; state.typeManuallySelected=true; renderDynamicFields(); autoSave();
  }

  function renderTemplates() {
    $('#templateGrid').innerHTML=window.PromptTemplates.map((template,index)=>`<button type="button" class="template-card" data-template="${index}"><strong>${escapeHtml(template.name)}</strong><span>${escapeHtml(typeInfo(template.type).description)}</span></button>`).join('');
    $$('#templateGrid [data-template]').forEach(button=>button.addEventListener('click',()=>applyTemplate(window.PromptTemplates[Number(button.dataset.template)])));
  }

  function applyTemplate(template) {
    state.selectedType=template.type; state.typeManuallySelected=true;
    ['desiredChange','currentBehavior','expectedResult','preserve'].forEach(key=>{ $(`[name="${key}"]`).value=template[key]||''; });
    bindAutoGrow(); $('#templatesDialog').close(); S.saveDraft(collectData()); showToast(`Modelo “${template.name}” aplicado.`); goToStep(1);
  }

  function collectData() {
    const data={}; new FormData($('#promptForm')).forEach((value,key)=>data[key]=String(value).trim());
    data.requestType=state.selectedType; return data;
  }

  function restoreData(rawData) {
    const data=S.migrateData(rawData); if(!data)return;
    state.selectedType=data.requestType||classifyRequest(data); state.typeManuallySelected=Boolean(data.requestType); renderDynamicFields(data);
    Object.entries(data).forEach(([key,value])=>{ const field=$(`[name="${CSS.escape(key)}"]`); if(field && value!=null) field.value=value; });
    if(data.tool && ['Codex','Google Antigravity','Claude Code','Genérico'].includes(data.tool)) state.preferences.agent=data.tool;
    bindAutoGrow();
  }

  function bindAutoGrow() {
    $$('.auto-grow').forEach(field=>{ const resize=()=>{field.style.height='auto';field.style.height=`${Math.max(field.classList.contains('compact-textarea')?80:68,field.scrollHeight)}px`;}; field.removeEventListener('input',field.__resize); field.__resize=resize; field.addEventListener('input',resize); resize(); });
  }

  function validateCore(announce=true) {
    $$('.error-message').forEach(el=>el.remove()); $$('[aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));
    const missing=$$('.step-panel[data-step="1"] [required]').filter(field=>!field.value.trim());
    missing.forEach(field=>{ field.setAttribute('aria-invalid','true'); const error=document.createElement('small'); error.className='error-message';error.textContent='Preencha este campo obrigatório.';field.closest('.field').appendChild(error); });
    if(missing.length&&announce){showToast('Preencha os quatro campos principais.');missing[0].focus();}
    return missing.length===0;
  }

  function goToStep(step) {
    state.step=Math.max(1,Math.min(3,step));
    $$('.step-panel').forEach(panel=>{const active=Number(panel.dataset.step)===state.step;panel.hidden=!active;panel.classList.toggle('active',active);});
    $('#stepLabel').textContent=`Etapa ${state.step} de 3`;$('#stepName').textContent=stepNames[state.step-1];$('#progressBar').style.width=`${state.step/3*100}%`;$('.progress-track').setAttribute('aria-valuenow',state.step);
    $$('.step-dots li').forEach((li,index)=>li.classList.toggle('active',index<state.step));
    $('#prevButton').disabled=state.step===1;$('#nextButton').hidden=state.step!==1;$('#generateButton').hidden=state.step!==2;$('#saveDraft').hidden=state.step===3;$('#clearForm').hidden=state.step===3;
    if(state.step===2){state.selectedType=state.selectedType||classifyRequest(collectData());renderDynamicFields(collectData());}
    $('.workspace').scrollIntoView({behavior:'smooth',block:'start'});$(`.step-panel[data-step="${state.step}"] h2`)?.focus();
  }

  function analyzeComplexity(data,preferences=state.preferences) {
    let score=0; const reasons=[];
    if(['integration','database','security','new-system'].includes(data.requestType)){score+=3;reasons.push('o tipo envolve decisões técnicas relevantes');}
    if(data.requestType==='visual'||data.requestType==='bug')score-=1;
    if(data.requestType==='database'||data.dataMigration==='Sim'){score+=3;reasons.push('há possível impacto em dados');}
    if(data.requestType==='integration'){score+=3;reasons.push('há comunicação com outro sistema');}
    if(data.requestType==='security'){score+=3;reasons.push('autenticação ou permissões exigem cuidado adicional');}
    if(data.activeUsers==='Sim'){score+=2;reasons.push('o projeto possui usuários ativos');}
    if(data.priority==='Urgente'){score+=1;reasons.push('a prioridade é urgente');}
    if(data.rollbackNeeded==='Sim'){score+=1;reasons.push('foi indicada necessidade de rollback');}
    const level=score<=1?'Simples':score<=5?'Média':score<=9?'Complexa':'Crítica';
    if(!reasons.length)reasons.push('a alteração parece localizada e de baixo risco');
    const planning=preferences.planningDefault||level!=='Simples'||['feature','integration','database','review','new-system','deploy','security'].includes(data.requestType);
    return {level,reasons:[...new Set(reasons)],planning};
  }

  function listAnswers(data,ids) {
    const items=ids.map(id=>{const def=allDefs(data.requestType).find(item=>item.id===id);return def&&meaningful(data[id])?`- ${def.label}: ${data[id]}`:'';}).filter(Boolean);
    return items.length?items.join('\n'):'Não aplicável para esta solicitação.';
  }

  function buildInsights(data,analysis) {
    const config=Q.conditional[data.requestType]||Q.conditional.other;
    const missing=config.primary.filter(def=>!meaningful(data[def.id])).map(def=>def.label);
    const assumptions=data.requestType==='new-system'
      ? ['A solução será criada do zero.','Se não houver preferência tecnológica, o agente recomendará uma opção e justificará a escolha.']
      : ['O agente analisará o repositório atual para identificar tecnologias, arquitetura e padrões.','Informações não fornecidas serão confirmadas no código antes da implementação.'];
    const risks=analysis.reasons.map(reason=>reason.charAt(0).toUpperCase()+reason.slice(1));
    if(state.preferences.allowDatabase===false&&['database','new-system'].includes(data.requestType))risks.push('Alterações de banco de dados não estão autorizadas nas preferências.');
    return {missing,assumptions,risks};
  }

  function buildResult(data,preferences=state.preferences) {
    const type=typeInfo(data.requestType), analysis=analyzeComplexity(data,preferences), insights=buildInsights(data,analysis);
    const execution=analysis.planning?'Recomendação: utilizar o modo planejamento antes da implementação.':'Recomendação: a solicitação pode ser executada diretamente.';
    const existingInstruction='Analise o repositório atual antes de modificar qualquer arquivo. Identifique automaticamente tecnologias, arquitetura, dependências, padrões existentes e componentes impactados. Não solicite ao usuário informações que possam ser obtidas diretamente no projeto.';
    const detailedExisting='Identifique automaticamente o nome, finalidade, tecnologias, arquitetura, dependências, padrões visuais, estrutura de dados e funcionalidades relacionadas.';
    const projectContext=data.requestType==='new-system'
      ? `Projeto criado do zero.\nNome: ${answer(data,'projectName')}\nObjetivo: ${answer(data,'systemGoal')}\nTipo: ${answer(data,'appType')}\nPreferência tecnológica: ${answer(data,'technologyPreference','Nenhuma. Recomende uma solução adequada e justifique a escolha.')}`
      : `${existingInstruction}\n${detailedExisting}`;
    const specificIds=allDefs(data.requestType).map(def=>def.id);
    const preferenceText=`Agente: ${preferences.agent}\nPlanejamento padrão: ${preferences.planningDefault?'Sim':'Não'}\nCriar branch: ${preferences.createBranch?'Sim':'Não'}\nGerar commit: ${preferences.createCommit?'Sim':'Não'}\nExecutar testes: ${preferences.runTests?'Sim':'Não'}\nDocumentar: ${preferences.documentChanges?'Sim':'Não'}\nPreservar padrão visual: ${preferences.preserveVisual?'Sim':'Não'}\nAlteração de banco autorizada: ${preferences.allowDatabase?'Sim':'Não'}\nDetalhamento: ${preferences.detailLevel}`;
    const sections=[
      ['1. SOLICITAÇÃO',data.desiredChange],['2. SITUAÇÃO ATUAL',data.currentBehavior],['3. RESULTADO ESPERADO',data.expectedResult],['4. FUNCIONALIDADES E CONDIÇÕES A PRESERVAR',data.preserve],
      ['5. CONTEXTO DO PROJETO',projectContext],['6. TIPO DE SOLICITAÇÃO',type.title],['7. DETALHES FORNECIDOS',listAnswers(data,specificIds)],['8. ESCOPO',data.desiredChange],['9. FORA DO ESCOPO',`Não alterar ou prejudicar: ${data.preserve}`],
      ['10. FLUXO ESPERADO',data.expectedResult],['11. REGRAS E VALIDAÇÕES',listAnswers(data,['validations','differentPermissions','roleView','roleEdit'])],['12. INTERFACE E RESPONSIVIDADE',listAnswers(data,['element','mobile','reference','keepVisualPattern','devices'])],
      ['13. DADOS E BANCO DE DADOS',listAnswers(data,['storedInfo','dataMigration','existingData','historyNeeded','rollbackNeeded','fields'])],['14. INTEGRAÇÕES',listAnswers(data,['service','sentData','receivedData','authentication','frequency','failureHandling','logs'])],
      ['15. SEGURANÇA E PERMISSÕES',listAnswers(data,['roles','roleView','roleEdit','socialAuth','passwordRecovery','sessionTime','lgpd'])],['16. TRATAMENTO DE ERROS',listAnswers(data,['whenHappens','errorMessage','reproductionSteps','frequency','evidence'])],
      ['17. CRITÉRIOS DE ACEITAÇÃO',`- A solicitação descrita deve estar implementada.\n- O resultado deve corresponder a: ${data.expectedResult}\n- Deve ser preservado: ${data.preserve}`],['18. PLANO DE TESTES',preferences.runTests?'Executar testes existentes, validar o fluxo principal, casos de erro e regressões. Criar testes quando necessário.':'Testes não foram selecionados nas preferências; informe os riscos de não executá-los.'],
      ['19. PREMISSAS',insights.assumptions.map(item=>`- ${item}`).join('\n')],['20. PONTOS A CONFIRMAR',insights.missing.length?insights.missing.map(item=>`- ${item}`).join('\n'):'Nenhum ponto complementar essencial pendente.'],['21. RISCOS',insights.risks.map(item=>`- ${item}`).join('\n')],
      ['22. COMPLEXIDADE ESTIMADA',`${analysis.level}. Motivos: ${analysis.reasons.join('; ')}.`],['23. RECOMENDAÇÃO DE EXECUÇÃO',`${execution}\n\nPreferências:\n${preferenceText}`]
    ];
    const specification=sections.map(([title,body])=>`${title}\n\n${body}`).join('\n\n');
    const ptInstructions=`${existingInstruction}\n\nAntes de implementar, compreenda a arquitetura, localize funcionalidades semelhantes e identifique arquivos, componentes, rotas, serviços, tabelas e dependências impactadas. Preserve padrões existentes e não altere arquivos sem relação com a solicitação. Não exponha credenciais ou dados sensíveis.\n\nImplemente em etapas pequenas. ${preferences.createBranch?'Crie uma branch específica.':''} ${preferences.createCommit?'Ao final, gere um commit claro.':''} ${preferences.runTests?'Execute testes existentes e crie testes quando necessário.':''} ${preferences.documentChanges?'Atualize a documentação relevante.':''}\n\nAo final, apresente resumo, arquivos alterados, testes executados, limitações, riscos remanescentes e instruções de rollback.`;
    const enInstructions=`Analyze the current repository before modifying any file. Automatically identify technologies, architecture, dependencies, existing patterns, and impacted components. Do not ask the user for information that can be obtained directly from the project.\n\nBefore implementing, understand the architecture, locate similar functionality, and identify impacted files, components, routes, services, tables, and dependencies. Preserve existing patterns, avoid unrelated changes, and never expose credentials or sensitive data.\n\nImplement in small steps. ${preferences.createBranch?'Create a dedicated branch.':''} ${preferences.createCommit?'Create a clear commit when finished.':''} ${preferences.runTests?'Run existing tests and add tests when needed.':''} ${preferences.documentChanges?'Update relevant documentation.':''}\n\nAt the end, report the summary, changed files, tests, limitations, remaining risks, and rollback instructions.`;
    const languageInstruction=preferences.language==='Inglês'?'Answer and write all implementation notes in English.':'Responda e escreva todos os registros de implementação em português.';
    const detailInstruction=preferences.detailLevel==='Conciso'?'Seja objetivo e evite explicações desnecessárias.':preferences.detailLevel==='Detalhado'?'Apresente decisões, etapas, validações e riscos com detalhes.':'Use nível de detalhe equilibrado, com decisões e resultados claros.';
    const prompt=`PROMPT PARA ${String(preferences.agent).toUpperCase()}\n\n${preferences.language==='Inglês'?enInstructions:ptInstructions}\n\n${languageInstruction}\n${detailInstruction}\n\nESPECIFICAÇÃO DA SOLICITAÇÃO\n\n${specification}`;
    return {specification:`${specification}\n\n24. PROMPT FINAL PARA O AGENTE\n\n${prompt}`,prompt,analysis,execution,insights};
  }

  function renderList(selector,items,emptyText) { $(selector).innerHTML=(items.length?items:[emptyText]).map(item=>`<li>${escapeHtml(item)}</li>`).join(''); }

  function generate() {
    if(!validateCore()){goToStep(1);return;}
    const data=collectData(), result=buildResult(data,state.preferences);state.generated={...result,data};
    $('#reviewSummary').textContent=data.desiredChange;renderList('#assumptionsList',result.insights.assumptions,'Nenhuma premissa adicional.');renderList('#missingList',result.insights.missing,'Nenhum ponto essencial pendente.');renderList('#risksList',result.insights.risks,'Nenhum risco relevante identificado.');
    $('#specOutput').textContent=result.specification;$('#promptOutput').textContent=result.prompt;$('#complexityBadge').textContent=`Complexidade ${result.analysis.level}`;$('#executionBadge').textContent=result.analysis.planning?'Modo planejamento':'Execução direta';
    $('#complexityReason').innerHTML=`<strong>Classificação:</strong> ${escapeHtml(result.analysis.reasons.join('; '))}. <strong>${escapeHtml(result.execution)}</strong>`;
    S.addHistory({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,title:data.desiredChange.slice(0,80),project:data.projectName||'Projeto atual',type:typeInfo(data.requestType).title,tool:state.preferences.agent,date:new Date().toISOString(),complexity:result.analysis.level,specification:result.specification,prompt:result.prompt,data});
    S.clearDraft();renderHistory();goToStep(3);
  }

  function renderPreferences() {
    const form=$('#preferencesForm');Object.entries(state.preferences).forEach(([key,value])=>{const field=form.elements[key];if(!field)return;if(field.type==='checkbox')field.checked=Boolean(value);else field.value=value;});
  }
  function savePreferences() {
    const form=$('#preferencesForm'), prefs={};
    ['agent','language','detailLevel'].forEach(key=>prefs[key]=form.elements[key].value);
    ['planningDefault','createBranch','createCommit','runTests','documentChanges','preserveVisual','allowDatabase'].forEach(key=>prefs[key]=form.elements[key].checked);
    state.preferences=prefs;S.savePreferences(prefs);$('#preferencesDialog').close();showToast('Preferências salvas neste navegador.');
  }

  function autoSave(){if($('#desiredChange').value.trim())S.saveDraft(collectData());}
  async function copyText(text,message){try{await navigator.clipboard.writeText(text);showToast(message);}catch{const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();showToast(message);}}
  function download(){if(!state.generated)return;const blob=new Blob([state.generated.specification],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`especificacao-${(state.generated.data.projectName||state.generated.data.involvedArea||'solicitacao').toLowerCase().replace(/[^a-z0-9]+/gi,'-')}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),0);}
  function resetForm(confirmFirst=true){if(confirmFirst&&!confirm('Limpar todas as respostas deste formulário?'))return;$('#promptForm').reset();state.selectedType='feature';state.typeManuallySelected=false;state.generated=null;renderDynamicFields();S.clearDraft();bindAutoGrow();goToStep(1);}

  function renderHistory(){const items=S.getHistory(),list=$('#historyList');if(!items.length){list.innerHTML='<div class="empty-state"><strong>Nenhum prompt gerado ainda.</strong><span>Seus resultados aparecerão aqui.</span></div>';return;}list.innerHTML=items.map(item=>`<article class="history-card"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.project||'Projeto atual')} · ${escapeHtml(item.type||'Solicitação')} · ${new Date(item.date).toLocaleString('pt-BR')} · ${escapeHtml(item.complexity||'')}</p></div><div class="history-actions"><button class="mini-button" data-action="open" data-id="${item.id}">Abrir</button><button class="mini-button" data-action="duplicate" data-id="${item.id}">Duplicar</button><button class="mini-button danger" data-action="delete" data-id="${item.id}">Excluir</button></div></article>`).join('');}

  function historyAction(event){const button=event.target.closest('[data-action]');if(!button)return;const item=S.getHistory().find(entry=>entry.id===button.dataset.id);if(!item)return;if(button.dataset.action==='delete'){if(confirm('Excluir este prompt do histórico?')){S.deleteHistory(item.id);renderHistory();showToast('Prompt excluído.');}return;}if(button.dataset.action==='duplicate'){restoreData(item.data);S.saveDraft(item.data);goToStep(1);showToast('Prompt duplicado para edição.');return;}const data=S.migrateData(item.data)||{},analysis=analyzeComplexity(data);state.generated={data,specification:item.specification,prompt:item.prompt,analysis};$('#reviewSummary').textContent=data.desiredChange||item.title;renderList('#assumptionsList',[], 'Registro recuperado do histórico.');renderList('#missingList',[],'Duplique o prompt para editar as respostas.');renderList('#risksList',[], 'Consulte a análise armazenada na especificação.');$('#specOutput').textContent=item.specification;$('#promptOutput').textContent=item.prompt;$('#complexityBadge').textContent=`Complexidade ${item.complexity||analysis.level}`;$('#executionBadge').textContent=analysis.planning?'Modo planejamento':'Execução direta';$('#complexityReason').innerHTML='<strong>Registro anterior:</strong> conteúdo recuperado sem alterar o formato original.';goToStep(3);}

  function bindEvents(){
    $('#nextButton').addEventListener('click',()=>{if(validateCore()){if(!state.typeManuallySelected)state.selectedType=classifyRequest(collectData());renderDynamicFields(collectData());autoSave();goToStep(2);}});$('#prevButton').addEventListener('click',()=>goToStep(state.step-1));$('#generateButton').addEventListener('click',generate);
    $('#saveDraft').addEventListener('click',()=>{S.saveDraft(collectData());showToast('Rascunho salvo neste navegador.');});$('#clearForm').addEventListener('click',()=>resetForm(true));$('#newPrompt').addEventListener('click',()=>resetForm(false));
    $('#copyPrompt').addEventListener('click',()=>copyText(state.generated?.prompt||'','Prompt copiado.'));$('#copySpec').addEventListener('click',()=>copyText(state.generated?.specification||'','Especificação copiada.'));$('#downloadTxt').addEventListener('click',download);
    $('#openPreferences').addEventListener('click',()=>{renderPreferences();$('#preferencesDialog').showModal();});$('#savePreferences').addEventListener('click',savePreferences);$('#openTemplates').addEventListener('click',()=>$('#templatesDialog').showModal());$('#closeTemplates').addEventListener('click',()=>$('#templatesDialog').close());
    $('#clearHistory').addEventListener('click',()=>{if(confirm('Excluir todo o histórico deste navegador?')){S.clearHistory();renderHistory();showToast('Histórico limpo.');}});$('#historyList').addEventListener('click',historyAction);
    $$('.result-tabs .tab').forEach(tab=>tab.addEventListener('click',()=>{$$('.result-tabs .tab').forEach(item=>{const active=item===tab;item.classList.toggle('active',active);item.setAttribute('aria-selected',active);});$$('.output').forEach(output=>{const active=output.id.startsWith(tab.dataset.resultTab);output.hidden=!active;output.classList.toggle('active',active);});}));
    $('#promptForm').addEventListener('input',()=>{clearTimeout(window.__draftTimer);window.__draftTimer=setTimeout(autoSave,500);});
  }

  function init(){renderTemplates();renderDynamicFields();bindEvents();renderHistory();const draft=S.getDraft();if(draft){restoreData(draft);showToast('Seu rascunho anterior foi recuperado.');}bindAutoGrow();goToStep(1);}
  window.PromptAppCore={classifyRequest,analyzeComplexity,buildResult};
  document.addEventListener('DOMContentLoaded',init);
}());
