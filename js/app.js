(function () {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const Q = window.PromptQuestions;
  const S = window.PromptStorage;
  const state = { step:1, selectedType:'', generated:null };
  const stepNames = ['Tipo de solicitação','Identificação do projeto','Descrição da necessidade','Perguntas específicas','Revisão','Resultado'];
  const baseLabels = {projectName:'Nome do projeto',projectPurpose:'Finalidade',technology:'Tecnologia',projectLocation:'Local do projeto',tool:'Ferramenta',projectState:'Estado do projeto',desiredChange:'O que deseja fazer',currentProblem:'Problema atual',currentBehavior:'Funcionamento atual',expectedResult:'Resultado esperado',targetUsers:'Usuários',successOutcome:'Indicador de sucesso',preserve:'Funcionalidades a preservar'};
  let toastTimer;

  function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
  function showToast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
  function typeInfo(id=state.selectedType) { return Q.types.find(type=>type.id===id); }
  function allQuestionDefs(typeId=state.selectedType) { return [...(Q.conditional[typeId]||[]), ...Q.general]; }

  function renderTypes() {
    $('#typeGrid').innerHTML=Q.types.map((type,index)=>`<label class="type-card"><input type="radio" name="requestType" value="${type.id}"><span class="type-icon">${index+1}</span><span><strong>${type.title}</strong><small>${type.description}</small></span></label>`).join('');
    $$('#typeGrid input').forEach(input=>input.addEventListener('change',()=>selectType(input.value)));
  }
  function renderTemplates() {
    $('#templateGrid').innerHTML=window.PromptTemplates.map((item,index)=>`<button type="button" class="template-chip" data-template="${index}">${escapeHtml(item.name)}</button>`).join('');
    $$('#templateGrid button').forEach(button=>button.addEventListener('click',()=>applyTemplate(window.PromptTemplates[Number(button.dataset.template)])));
  }
  function selectType(id) {
    state.selectedType=id;
    $$('.type-card').forEach(card=>card.classList.toggle('selected',$('input',card).value===id));
    const input=$(`input[name="requestType"][value="${id}"]`); if(input) input.checked=true;
    renderDynamicFields(); autoSave();
  }
  function applyTemplate(template) {
    selectType(template.type);
    ['desiredChange','expectedResult'].forEach(key=>{ if(template[key]) $(`[name="${key}"]`).value=template[key]; });
    showToast(`Modelo “${template.name}” aplicado. Você pode editar tudo.`);
    goToStep(2);
  }
  function fieldMarkup(def) {
    const safeId=escapeHtml(def.id), safeLabel=escapeHtml(def.label);
    if(def.type==='select') return `<div class="field"><label for="${safeId}">${safeLabel}</label><select id="${safeId}" name="${safeId}">${def.options.map(option=>`<option>${escapeHtml(option)}</option>`).join('')}</select></div>`;
    return `<div class="field"><label for="${safeId}">${safeLabel} <span class="optional">Opcional</span></label><textarea id="${safeId}" name="${safeId}" rows="3" placeholder="${escapeHtml(def.placeholder||'Descreva com suas palavras. Se não souber, deixe em branco.')} "></textarea></div>`;
  }
  function renderDynamicFields(values={}) {
    $('#conditionalFields').innerHTML=(Q.conditional[state.selectedType]||[]).map(fieldMarkup).join('') || '<div class="empty-state">Selecione um tipo de solicitação na primeira etapa.</div>';
    $('#generalFields').innerHTML=Q.general.map(fieldMarkup).join('');
    Object.entries(values).forEach(([key,value])=>{ const field=$(`[name="${CSS.escape(key)}"]`); if(field) field.value=value; });
  }
  function collectData() {
    const data={}; new FormData($('#promptForm')).forEach((value,key)=>data[key]=String(value).trim());
    data.requestType=state.selectedType; return data;
  }
  function restoreData(data) {
    if(!data) return; selectType(data.requestType||''); renderDynamicFields(data);
    Object.entries(data).forEach(([key,value])=>{ const fields=$$(`[name="${CSS.escape(key)}"]`); fields.forEach(field=>{ if(field.type==='radio') field.checked=field.value===value; else field.value=value; }); });
  }
  function autoSave() { if(state.selectedType || $('#projectName').value) S.saveDraft(collectData()); }

  function validateStep(step, announce=true) {
    $$('.error-message').forEach(el=>el.remove()); $$('[aria-invalid=true]').forEach(el=>el.removeAttribute('aria-invalid'));
    const fields=step===1 ? [] : $$(`.step-panel[data-step="${step}"] [required]`);
    const errors=[];
    if(step===1 && !state.selectedType) errors.push({el:$('#typeGrid'),message:'Escolha um tipo de solicitação para continuar.'});
    fields.forEach(field=>{ if(!field.value.trim()) errors.push({el:field,message:'Preencha este campo obrigatório.'}); });
    errors.forEach(error=>{ error.el.setAttribute('aria-invalid','true'); const msg=document.createElement('small'); msg.className='error-message'; msg.textContent=error.message; error.el.closest('.field')?.appendChild(msg); });
    if(errors.length && announce){ showToast(errors[0].message); errors[0].el.focus?.(); }
    return !errors.length;
  }
  function validateAll() { return [1,2,3].every(step=>validateStep(step,false)); }

  function goToStep(next) {
    state.step=Math.max(1,Math.min(6,next));
    $$('.step-panel').forEach(panel=>{ const active=Number(panel.dataset.step)===state.step; panel.hidden=!active; panel.classList.toggle('active',active); });
    $('#stepLabel').textContent=`Etapa ${state.step} de 6`; $('#stepName').textContent=stepNames[state.step-1];
    $('#progressBar').style.width=`${state.step/6*100}%`; $('.progress-track').setAttribute('aria-valuenow',state.step);
    $$('.step-dots li').forEach((li,index)=>li.classList.toggle('active',index<state.step));
    $('#prevButton').disabled=state.step===1||state.step===6; $('#nextButton').hidden=state.step>=5; $('#generateButton').hidden=state.step!==5; $('#formActions').hidden=state.step===6;
    if(state.step===5) renderReview();
    $('.workspace').scrollIntoView({behavior:'smooth',block:'start'});
    $(`.step-panel[data-step="${state.step}"] h2`)?.focus?.();
  }

  function renderReview() {
    const data=collectData(), type=typeInfo();
    const blocks=[
      ['Solicitação',{Tipo:type?.title,'Projeto':data.projectName,'Ferramenta':data.tool,'Estado':data.projectState}],
      ['Necessidade',{'O que deseja':data.desiredChange,'Situação atual':data.currentBehavior,'Resultado esperado':data.expectedResult,'Preservar':data.preserve}],
      ['Detalhes',Object.fromEntries(allQuestionDefs().filter(q=>data[q.id] && data[q.id]!=='Não sei informar').map(q=>[q.label,data[q.id]]))]
    ];
    $('#reviewContent').innerHTML=blocks.map(([title,items])=>`<section class="review-block"><h3>${title}</h3><dl>${Object.entries(items).filter(([,v])=>v).map(([k,v])=>`<div class="review-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')||'<p>Nenhuma informação adicional.</p>'}</dl></section>`).join('');
    const valid=validateAll(); $('#reviewWarnings').innerHTML=valid?'':'<div class="warning">Há campos obrigatórios incompletos. Volte às etapas anteriores para preenchê-los.</div>';
  }

  function analyzeComplexity(data) {
    let score=0; const reasons=[]; const yes=id=>data[id]==='Sim';
    if(['integration','database','security','new-system'].includes(data.requestType)){score+=3;reasons.push('o tipo escolhido normalmente envolve planejamento técnico');}
    if(data.requestType==='visual'||data.requestType==='bug') score-=1;
    if(yes('changesDatabase')||data.requestType==='database'||yes('dataMigration')){score+=3;reasons.push('há impacto ou migração de dados');}
    if(yes('hasIntegration')||data.requestType==='integration'||data.integrations){score+=3;reasons.push('há integração com outro sistema');}
    if(data.requestType==='security'||yes('authentication')||yes('loginNeeded')||yes('differentPermissions')){score+=3;reasons.push('existem requisitos de autenticação ou permissão');}
    if(yes('activeUsers')){score+=2;reasons.push('o projeto possui usuários ativos');}
    if(yes('affectsScreens')){score+=2;reasons.push('outras telas podem ser afetadas');}
    if(data.priority==='Urgente'){score+=1;reasons.push('a prioridade foi marcada como urgente');}
    const sensitive=[data.sensitiveInfo,data.sensitiveData].join(' ').trim(); if(sensitive){score+=3;reasons.push('foram mencionados dados sensíveis');}
    let level=score<=1?'Simples':score<=5?'Média':score<=9?'Complexa':'Crítica';
    if(!reasons.length) reasons.push('o impacto informado é localizado e não inclui banco de dados, integração ou segurança');
    const planning=level!=='Simples'||['feature','integration','database','review','new-system','deploy','security'].includes(data.requestType);
    return {level,reasons:[...new Set(reasons)],planning,score};
  }
  const value=(data,id)=>data[id]||'Não informado pelo usuário.';
  const applicable=(data,ids)=>ids.some(id=>data[id] && data[id]!=='Não sei informar' && data[id]!=='Não') ? ids.map(id=>{ const q=allQuestionDefs(data.requestType).find(x=>x.id===id); return q&&data[id]?`- ${q.label}: ${data[id]}`:''; }).filter(Boolean).join('\n') : 'Não aplicável para esta solicitação.';
  function buildResult(data) {
    const type=typeInfo(data.requestType), analysis=analyzeComplexity(data);
    const execution=analysis.planning?'Recomendação: utilizar o modo planejamento antes da implementação.':'Recomendação: a solicitação pode ser executada diretamente.';
    const acceptance=[data.expectedResult,data.successOutcome,data.validations].filter(Boolean).map(v=>`- ${v}`).join('\n')||'Não informado pelo usuário.';
    const sections=[
      ['1. OBJETIVO',value(data,'desiredChange')],
      ['2. CONTEXTO DO PROJETO',`Projeto: ${value(data,'projectName')}\nFinalidade: ${value(data,'projectPurpose')}\nTecnologia: ${value(data,'technology')}\nLocal: ${value(data,'projectLocation')}\nEstado: ${value(data,'projectState')}\nFerramenta: ${value(data,'tool')}`],
      ['3. PROBLEMA ATUAL',`${value(data,'currentProblem')}\n\nFuncionamento atual: ${value(data,'currentBehavior')}`],
      ['4. RESULTADO ESPERADO',`${value(data,'expectedResult')}\n\nIndicador de sucesso: ${value(data,'successOutcome')}`],
      ['5. ESCOPO DA ALTERAÇÃO',`Tipo: ${type?.title||'Não informado'}\n${applicable(data,(Q.conditional[data.requestType]||[]).map(q=>q.id))}`],
      ['6. FORA DO ESCOPO',`Preservar: ${value(data,'preserve')}\n${data.specificPreserve?`Também preservar: ${data.specificPreserve}`:''}`],
      ['7. FLUXO ESPERADO',value(data,'expectedResult')],
      ['8. REGRAS DE NEGÓCIO',applicable(data,['validations','allowedUsers','differentPermissions','roles','roleView','roleEdit'])],
      ['9. REQUISITOS FUNCIONAIS',applicable(data,['featureName','userActions','inputData','outputData','mainFeatures','reports'])],
      ['10. REQUISITOS NÃO FUNCIONAIS',applicable(data,['mobile','devices','offline','sync','userVolume','runTests','documentChanges'])],
      ['11. ALTERAÇÕES DE INTERFACE',applicable(data,['screen','element','visualCurrent','visualExpected','reference','keepVisualPattern'])],
      ['12. ALTERAÇÕES DE FRONTEND',applicable(data,['featureLocation','mobile','allowWebChanges','singleScreen'])],
      ['13. ALTERAÇÕES DE BACKEND',applicable(data,['hasIntegration','authentication','logs','automaticSync'])],
      ['14. ALTERAÇÕES DE BANCO DE DADOS',applicable(data,['changesDatabase','storedInfo','tableChange','fields','requiredFields','relationships','existingData','dataMigration','reversible','historyNeeded','softDelete','affectedQueries'])],
      ['15. INTEGRAÇÕES',applicable(data,['service','integrationGoal','sentData','receivedData','frequency','apiDocs','integrations'])],
      ['16. PERMISSÕES E SEGURANÇA',applicable(data,['allowedUsers','differentPermissions','authentication','sensitiveInfo','securityUsers','roles','roleView','roleEdit','loginNeeded','passwordRecovery','socialAuth','sensitiveData','sessionTime','attemptLock','lgpd'])],
      ['17. TRATAMENTO DE ERROS',applicable(data,['errorCases','errorDescription','errorMessage','failureHandling','deployErrors'])],
      ['18. IMPACTOS EM FUNCIONALIDADES EXISTENTES',`Funcionalidades a preservar: ${value(data,'preserve')}\nPode afetar outras telas: ${value(data,'affectsScreens')}\nUsuários ativos: ${value(data,'activeUsers')}`],
      ['19. CRITÉRIOS DE ACEITAÇÃO',acceptance],
      ['20. PLANO DE TESTES',`${data.runTests==='Não'?'O usuário indicou que não deseja testes.':'Executar testes existentes e validar o fluxo principal, casos de erro, responsividade e regressões.'}\nPreferência informada: ${value(data,'runTests')}`],
      ['21. RISCOS',`Complexidade: ${analysis.level}.\nMotivos: ${analysis.reasons.join('; ')}.\nImpacto esperado: ${value(data,'impact')}`],
      ['22. PREMISSAS ADOTADAS','Não inventar requisitos ausentes. Pontos marcados como “não informado” devem ser confirmados durante a análise do projeto antes de mudanças irreversíveis.'],
      ['23. RECOMENDAÇÃO DE EXECUÇÃO',`${execution}\nPrioridade: ${value(data,'priority')}\nPrazo desejado: ${value(data,'deadline')}\nBranch Git: ${value(data,'createBranch')}\nBackup: ${value(data,'createBackup')}\nCommit: ${value(data,'createCommit')}\nDocumentação: ${value(data,'documentChanges')}`]
    ];
    const summary=sections.map(([title,body])=>`${title}\n\n${body}`).join('\n\n');
    const general=`Analise todo o projeto antes de modificar qualquer arquivo.\n\nNão implemente imediatamente sem compreender a arquitetura, os padrões existentes e as funcionalidades relacionadas.\n\nIdentifique os arquivos, componentes, rotas, serviços, tabelas e dependências impactadas.\n\nAntes de alterar:\n- verifique o estado atual do projeto;\n- identifique riscos de regressão;\n- confirme se já existe funcionalidade semelhante;\n- preserve o padrão visual e arquitetural existente;\n- não remova funcionalidades sem justificativa;\n- não exponha credenciais ou dados sensíveis;\n- não altere arquivos não relacionados sem necessidade.\n\nImplemente em etapas pequenas e controladas.\n\nQuando aplicável:\n- crie uma branch específica;\n- faça backup ou registre o estado anterior;\n- utilize migrações de banco de dados;\n- preserve compatibilidade com dados existentes;\n- execute validações;\n- trate erros;\n- crie logs úteis;\n- mantenha responsividade;\n- verifique acessibilidade;\n- valide permissões;\n- atualize documentação.\n\nApós implementar:\n- execute o projeto;\n- compile quando aplicável;\n- execute testes existentes;\n- crie novos testes quando necessário;\n- valide o fluxo principal;\n- valide situações de erro;\n- corrija erros encontrados;\n- verifique regressões.\n\nAo final, apresente:\n- resumo das alterações;\n- arquivos modificados;\n- arquivos criados;\n- banco de dados alterado;\n- testes executados;\n- resultado dos testes;\n- limitações;\n- riscos remanescentes;\n- instruções para publicação;\n- instruções para rollback.`;
    const prompt=`PROMPT PARA ${String(data.tool||'AGENTE').toUpperCase()}\n\n${general}\n\nESPECIFICAÇÃO DA SOLICITAÇÃO\n\n${summary}`;
    const specification=`${summary}\n\n24. PROMPT FINAL PARA O AGENTE\n\n${prompt}`;
    return {specification,prompt,analysis,execution};
  }

  function generate() {
    if(!validateAll()){ showToast('Preencha os campos obrigatórios antes de gerar.'); const first=[1,2,3].find(step=>!validateStep(step,false)); goToStep(first||1); return; }
    const data=collectData(), result=buildResult(data); state.generated={...result,data};
    $('#specOutput').textContent=result.specification; $('#promptOutput').textContent=result.prompt;
    $('#complexityBadge').textContent=`Complexidade ${result.analysis.level}`; $('#executionBadge').textContent=result.analysis.planning?'Modo planejamento':'Execução direta';
    $('#complexityReason').innerHTML=`<strong>Por que essa classificação?</strong> ${escapeHtml(result.analysis.reasons.join('; '))}.<br><strong>${escapeHtml(result.execution)}</strong>`;
    S.addHistory({id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,title:(data.desiredChange||'Solicitação').slice(0,80),project:data.projectName,type:typeInfo()?.title,tool:data.tool,date:new Date().toISOString(),complexity:result.analysis.level,specification:result.specification,prompt:result.prompt,data});
    S.clearDraft(); renderHistory(); goToStep(6);
  }
  async function copyText(text,message) { try { await navigator.clipboard.writeText(text); showToast(message); } catch { const area=document.createElement('textarea'); area.value=text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); showToast(message); } }
  function download() { if(!state.generated)return; const blob=new Blob([state.generated.specification],{type:'text/plain;charset=utf-8'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`especificacao-${(state.generated.data.projectName||'projeto').toLowerCase().replace(/[^a-z0-9]+/gi,'-')}.txt`; link.click(); URL.revokeObjectURL(link.href); }
  function resetForm(confirmFirst=true) { if(confirmFirst&&!confirm('Limpar todas as respostas deste formulário?'))return; $('#promptForm').reset(); state.selectedType='';state.generated=null; $$('.type-card').forEach(c=>c.classList.remove('selected')); renderDynamicFields(); S.clearDraft(); goToStep(1); }
  function renderHistory() {
    const items=S.getHistory(), list=$('#historyList');
    if(!items.length){list.innerHTML='<div class="empty-state"><strong>Nenhum prompt gerado ainda.</strong><br>Os resultados aparecerão aqui e ficarão somente neste navegador.</div>';return;}
    list.innerHTML=items.map(item=>`<article class="history-card"><div><h3>${escapeHtml(item.title)}</h3><p class="history-meta">${escapeHtml(item.project)} · ${escapeHtml(item.type)} · ${escapeHtml(item.tool)} · ${new Date(item.date).toLocaleString('pt-BR')} · ${escapeHtml(item.complexity)}</p></div><div class="history-actions"><button class="mini-button" data-action="open" data-id="${item.id}">Abrir</button><button class="mini-button" data-action="duplicate" data-id="${item.id}">Duplicar</button><button class="mini-button" data-action="delete" data-id="${item.id}">Excluir</button></div></article>`).join('');
  }
  function historyAction(event) {
    const button=event.target.closest('[data-action]'); if(!button)return; const item=S.getHistory().find(i=>i.id===button.dataset.id); if(!item)return;
    if(button.dataset.action==='delete'){if(confirm('Excluir este item do histórico?')){S.deleteHistory(item.id);renderHistory();showToast('Item excluído.');}return;}
    restoreData(item.data); state.generated={specification:item.specification,prompt:item.prompt,analysis:analyzeComplexity(item.data),execution:''};
    if(button.dataset.action==='duplicate'){goToStep(2);S.saveDraft(item.data);showToast('Prompt duplicado para edição.');return;}
    const analysis=analyzeComplexity(item.data); $('#specOutput').textContent=item.specification;$('#promptOutput').textContent=item.prompt;$('#complexityBadge').textContent=`Complexidade ${item.complexity}`;$('#executionBadge').textContent=analysis.planning?'Modo planejamento':'Execução direta';$('#complexityReason').innerHTML=`<strong>Registro recuperado do histórico.</strong> Você pode copiar o conteúdo ou duplicá-lo para editar.`;goToStep(6);
  }
  function bindEvents() {
    $('#nextButton').addEventListener('click',()=>{if(validateStep(state.step)){autoSave();goToStep(state.step+1);}}); $('#prevButton').addEventListener('click',()=>goToStep(state.step-1)); $('#generateButton').addEventListener('click',generate);
    $('#saveDraft').addEventListener('click',()=>{S.saveDraft(collectData());showToast('Rascunho salvo neste navegador.');}); $('#clearForm').addEventListener('click',()=>resetForm(true)); $('#newPrompt').addEventListener('click',()=>resetForm(false));
    $('#copyPrompt').addEventListener('click',()=>copyText(state.generated?.prompt||'','Prompt copiado.')); $('#copySpec').addEventListener('click',()=>copyText(state.generated?.specification||'','Especificação copiada.')); $('#downloadTxt').addEventListener('click',download);
    $('#clearHistory').addEventListener('click',()=>{if(confirm('Excluir todo o histórico deste navegador?')){S.clearHistory();renderHistory();showToast('Histórico limpo.');}}); $('#historyList').addEventListener('click',historyAction);
    $$('.result-tabs .tab').forEach(tab=>tab.addEventListener('click',()=>{$$('.result-tabs .tab').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',active);}); $$('.output').forEach(o=>{const active=o.id.startsWith(tab.dataset.resultTab);o.hidden=!active;o.classList.toggle('active',active);});}));
    $('#promptForm').addEventListener('input',()=>{clearTimeout(window.__draftTimer);window.__draftTimer=setTimeout(autoSave,500);});
  }
  function init() { renderTypes();renderTemplates();renderDynamicFields();bindEvents();renderHistory();const draft=S.getDraft();if(draft){restoreData(draft);showToast('Seu rascunho anterior foi recuperado.');}goToStep(1); }
  window.PromptAppCore = { analyzeComplexity, buildResult };
  document.addEventListener('DOMContentLoaded',init);
}());
