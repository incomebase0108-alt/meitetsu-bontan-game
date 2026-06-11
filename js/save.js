// localStorage によるセーブ/ロード
window.Save = (function() {
  const KEY = 'meitetsu-bontan-save-v1';

  function save(player, currentStationIndex) {
    try {
      const data = { player, currentStationIndex, savedAt: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function hasSave() {
    return load() !== null;
  }

  return { save, load, clear, hasSave };
})();
