(function () {
  const KEYS = { draft:'gpa_draft_v1', history:'gpa_history_v1' };
  const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  window.PromptStorage = {
    saveDraft(data) { localStorage.setItem(KEYS.draft, JSON.stringify({ ...data, savedAt:new Date().toISOString() })); },
    getDraft() { return parse(localStorage.getItem(KEYS.draft), null); },
    clearDraft() { localStorage.removeItem(KEYS.draft); },
    getHistory() { return parse(localStorage.getItem(KEYS.history), []); },
    addHistory(item) { const items=this.getHistory(); items.unshift(item); localStorage.setItem(KEYS.history, JSON.stringify(items.slice(0,50))); },
    deleteHistory(id) { localStorage.setItem(KEYS.history, JSON.stringify(this.getHistory().filter(item => item.id !== id))); },
    clearHistory() { localStorage.removeItem(KEYS.history); }
  };
}());
