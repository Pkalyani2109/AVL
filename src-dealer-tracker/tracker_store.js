(function initTrackerDataStore() {
  const STORAGE_KEY = "dealer-growth-tracker-v1";
  const DEFAULT_TABLE = "tracker_store";
  const DEFAULT_ROW_ID = "main";

  const config = window.TRACKER_SUPABASE_CONFIG || {};
  const cloudEnabled = Boolean(config.url && config.anonKey && window.supabase && typeof window.supabase.createClient === "function");
  const table = String(config.table || DEFAULT_TABLE);
  const rowId = String(config.rowId || DEFAULT_ROW_ID);

  let client = null;
  if (cloudEnabled) {
    client = window.supabase.createClient(config.url, config.anonKey);
  }

  let pendingPayload = null;
  let syncRunning = false;
  let lastStatus = cloudEnabled ? "Cloud sync configured" : "Local mode (Supabase not configured)";

  function safeParse(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function readLocal() {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  }

  function writeLocal(payload) {
    const safePayload = payload && typeof payload === "object" ? payload : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safePayload));
    return safePayload;
  }

  async function loadAll() {
    const local = readLocal();
    if (!client) return local;

    try {
      const result = await client
        .from(table)
        .select("payload")
        .eq("id", rowId)
        .maybeSingle();

      if (result.error) {
        console.warn("Tracker cloud read failed:", result.error.message || result.error);
        lastStatus = "Cloud read failed, using local";
        return local;
      }

      const cloudPayload = result.data && result.data.payload && typeof result.data.payload === "object"
        ? result.data.payload
        : null;

      if (cloudPayload) {
        writeLocal(cloudPayload);
        lastStatus = "Loaded from cloud";
        return cloudPayload;
      }

      if (Object.keys(local).length) {
        enqueueSync(local);
      }
      lastStatus = "Cloud empty, using local";
      return local;
    } catch (err) {
      console.warn("Tracker cloud read exception:", err);
      lastStatus = "Cloud unavailable, using local";
      return local;
    }
  }

  function mergeAndSave(partial) {
    const base = readLocal();
    const next = {
      ...base,
      ...(partial && typeof partial === "object" ? partial : {})
    };

    writeLocal(next);
    if (client) enqueueSync(next);
    return next;
  }

  function enqueueSync(payload) {
    pendingPayload = payload;
    if (syncRunning) return;

    syncRunning = true;
    void flushSyncQueue();
  }

  async function flushSyncQueue() {
    while (pendingPayload) {
      const payload = pendingPayload;
      pendingPayload = null;

      try {
        const result = await client
          .from(table)
          .upsert({ id: rowId, payload }, { onConflict: "id" });

        if (result.error) {
          console.warn("Tracker cloud write failed:", result.error.message || result.error);
          lastStatus = "Cloud write failed";
        } else {
          lastStatus = "Synced to cloud";
        }
      } catch (err) {
        console.warn("Tracker cloud write exception:", err);
        lastStatus = "Cloud write exception";
      }
    }

    syncRunning = false;
  }

  window.TrackerDataStore = {
    isCloudEnabled: function isCloudEnabled() {
      return Boolean(client);
    },
    getStatus: function getStatus() {
      return lastStatus;
    },
    loadAll,
    readLocal,
    writeLocal,
    mergeAndSave
  };
})();
