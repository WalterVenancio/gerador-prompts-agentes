(function () {
  const KEYS = { draft:'gpa_draft_v1', history:'gpa_history_v1', preferences:'gpa_preferences_v1' };
  const defaults = { agent:'Codex', planningDefault:false, createBranch:true, createCommit:true, runTests:true, documentChanges:true, preserveVisual:true, allowDatabase:false, language:'Português', detailLevel:'Equilibrado' };
  const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  const migrateData = (data) => {
    if (!data || typeof data !== 'object') return data;
    return {
      ...data,
      desiredChange: data.desiredChange || data.featureName || data.systemGoal || '',
      currentBehavior: data.currentBehavior || data.actualBehavior || data.visualCurrent || '',
      expectedResult: data.expectedResult || data.bugExpected || data.visualExpected || '',
      preserve: data.preserve || data.specificPreserve || '',
      requestType: data.requestType || 'feature'
    };
  };
  window.PromptStorage = {
    migrateData,
    saveDraft(data) { localStorage.setItem(KEYS.draft, JSON.stringify({ ...data, schemaVersion:2, savedAt:new Date().toISOString() })); },
    getDraft() { return migrateData(parse(localStorage.getItem(KEYS.draft), null)); },
    clearDraft() { localStorage.removeItem(KEYS.draft); },
    getHistory() { return parse(localStorage.getItem(KEYS.history), []).map(item => ({ ...item, data:migrateData(item.data) })); },
    addHistory(item) { const items=this.getHistory(); items.unshift({ ...item, schemaVersion:2 }); localStorage.setItem(KEYS.history, JSON.stringify(items.slice(0,50))); },
    deleteHistory(id) { localStorage.setItem(KEYS.history, JSON.stringify(this.getHistory().filter(item => item.id !== id))); },
    clearHistory() { localStorage.removeItem(KEYS.history); },
    getPreferences() { return { ...defaults, ...parse(localStorage.getItem(KEYS.preferences), {}) }; },
    savePreferences(preferences) { localStorage.setItem(KEYS.preferences, JSON.stringify({ ...defaults, ...preferences })); },
    getDefaults() { return { ...defaults }; }
  };
}());
