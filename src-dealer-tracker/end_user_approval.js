const STORAGE_KEY = "dealer-growth-tracker-v1";

const state = {
  approvals: [],
  regions: [],
  controls: {
    search: "",
    segment: "ALL",
    product: "ALL"
  }
};

let editingId = null;

(async function init() {
  await hydrate();
  populateOwnerBranchOptions();
  bindEvents();
  renderAll();
})();

async function hydrate() {
  const store = window.TrackerDataStore;
  const parsed = store && typeof store.loadAll === "function"
    ? await store.loadAll()
    : readLocalDb();

  if (!parsed || typeof parsed !== "object") return;

  try {
    state.approvals = parsed.endUserApprovals || [];
    state.regions = parsed.regions || [];
  } catch (err) {
    console.error("Failed to parse storage", err);
  }
}

function populateOwnerBranchOptions() {
  const sel = q("euaOwnerBranch");
  if (!sel) return;

  const fallback = [
    "BANGALORE", "CBE 2", "CHENNAI 1", "DELHI 1", "GUJARAT", "HYDERABAD",
    "INDORE", "KOLKATA", "MUMBAI", "MUMBAI-2", "PUNE", "TEXTILE"
  ];

  const derived = state.regions.length
    ? state.regions.map(r => {
      if (typeof r === "string") return r.trim();
      return String((r && r.name) || "").trim();
    }).filter(Boolean)
    : [];

  const branches = derived.length ? derived : fallback;

  const prev = sel.value || "";
  sel.innerHTML = `<option value="">Select Owner Branch</option>` + Array.from(new Set(branches)).sort().map(name => (
    `<option value="${esc(name)}">${esc(name)}</option>`
  )).join("");

  if (Array.from(sel.options).some(o => o.value === prev)) {
    sel.value = prev;
  }
}

function persist() {
  const payload = {
    endUserApprovals: state.approvals
  };

  const store = window.TrackerDataStore;
  if (store && typeof store.mergeAndSave === "function") {
    store.mergeAndSave(payload);
    return;
  }

  const next = {
    ...readLocalDb(),
    ...payload
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readLocalDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function bindEvents() {
  q("btnEuaSave").addEventListener("click", saveEntry);
  q("btnEuaClear").addEventListener("click", clearForm);

  q("euaSearch").addEventListener("input", () => {
    state.controls.search = q("euaSearch").value.trim().toLowerCase();
    renderTable();
  });

  q("euaFilterSegment").addEventListener("change", () => {
    state.controls.segment = q("euaFilterSegment").value;
    renderTable();
  });

  q("euaFilterProduct").addEventListener("change", () => {
    state.controls.product = q("euaFilterProduct").value;
    renderTable();
  });
}

function renderAll() {
  renderFilters();
  renderTable();
}

function renderFilters() {
  const segmentSel = q("euaFilterSegment");
  const productSel = q("euaFilterProduct");
  const prevSeg = segmentSel.value || "ALL";
  const prevProd = productSel.value || "ALL";

  const segments = Array.from(new Set(state.approvals.map(r => String(r.segment || "").trim()).filter(Boolean))).sort();
  const products = Array.from(new Set(state.approvals.map(r => String(r.product || "").trim()).filter(Boolean))).sort();

  segmentSel.innerHTML = `<option value="ALL">All Segments</option>` + segments.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  productSel.innerHTML = `<option value="ALL">All Products</option>` + products.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");

  segmentSel.value = Array.from(segmentSel.options).some(o => o.value === prevSeg) ? prevSeg : "ALL";
  productSel.value = Array.from(productSel.options).some(o => o.value === prevProd) ? prevProd : "ALL";

  state.controls.segment = segmentSel.value;
  state.controls.product = productSel.value;
}

function filteredRows() {
  return state.approvals
    .filter(r => state.controls.segment === "ALL" || (r.segment || "") === state.controls.segment)
    .filter(r => state.controls.product === "ALL" || (r.product || "") === state.controls.product)
    .filter(r => {
      if (!state.controls.search) return true;
      const hay = `${r.segment || ""} ${r.name || ""} ${r.product || ""} ${r.milestone || ""} ${r.remark || ""} ${r.nextAction || ""}`.toLowerCase();
      return hay.includes(state.controls.search);
    })
    .sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")) || String(a.name || "").localeCompare(String(b.name || "")));
}

function renderTable() {
  const rows = filteredRows();
  const tbody = q("euaRows");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12" class="muted">No approval targets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${esc(r.segment)}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.product)}</td>
      <td>${esc(r.ownerBranch || "-")}</td>
      <td>${esc(r.startDate || "-")}</td>
      <td>${esc(r.endDate || "-")}</td>
      <td>${esc(r.milestone || "-")}</td>
      <td>${esc(r.remark || "-")}</td>
      <td>${esc(r.nextAction || "-")}</td>
      <td>${esc(moneyL(r.budget))}</td>
      <td>
        <button class="btn secondary" data-edit-id="${esc(r.id)}" type="button">Edit</button>
        <button class="btn ghost" data-delete-id="${esc(r.id)}" type="button">Delete</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.getAttribute("data-edit-id")));
  });

  tbody.querySelectorAll("button[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.getAttribute("data-delete-id")));
  });
}

function saveEntry() {
  const record = {
    id: editingId || crypto.randomUUID(),
    segment: q("euaSegment").value.trim(),
    name: q("euaName").value.trim(),
    product: q("euaProduct").value,
    ownerBranch: q("euaOwnerBranch").value,
    startDate: q("euaStartDate").value,
    endDate: q("euaEndDate").value,
    milestone: q("euaMilestone").value.trim(),
    remark: q("euaRemark").value.trim(),
    nextAction: q("euaNextAction").value.trim(),
    budget: num(q("euaBudget").value),
    updatedAt: new Date().toISOString()
  };

  if (!record.segment || !record.name || !record.product || !record.ownerBranch || !record.milestone) {
    setStatus("Segment, Name Authority/End User, Product, Owner Branch, and Milestone are required.", false);
    return;
  }

  state.approvals = state.approvals.filter(r => r.id !== record.id);
  state.approvals.push(record);
  persist();
  clearForm(false);
  renderAll();
  setStatus(editingId ? "Approval target updated." : "Approval target saved.", true);
  editingId = null;
}

function editEntry(id) {
  const rec = state.approvals.find(r => r.id === id);
  if (!rec) return;

  editingId = rec.id;
  q("euaSegment").value = rec.segment || "";
  if (!Array.from(q("euaSegment").options).some(o => o.value === q("euaSegment").value)) {
    q("euaSegment").value = "Other";
  }
  q("euaName").value = rec.name || "";
  q("euaProduct").value = rec.product || "Scotch Yoke";
  q("euaOwnerBranch").value = rec.ownerBranch || "";
  if (!Array.from(q("euaOwnerBranch").options).some(o => o.value === q("euaOwnerBranch").value)) {
    q("euaOwnerBranch").value = "";
  }
  q("euaStartDate").value = rec.startDate || "";
  q("euaEndDate").value = rec.endDate || "";
  q("euaMilestone").value = rec.milestone || "";
  if (!Array.from(q("euaMilestone").options).some(o => o.value === q("euaMilestone").value)) {
    q("euaMilestone").value = "Other";
  }
  q("euaRemark").value = rec.remark || "";
  q("euaNextAction").value = rec.nextAction || "";
  q("euaBudget").value = num(rec.budget);

  setStatus(`Loaded ${rec.name} for edit.`, true);
}

function deleteEntry(id) {
  const rec = state.approvals.find(r => r.id === id);
  if (!rec) return;

  state.approvals = state.approvals.filter(r => r.id !== id);
  persist();
  renderAll();
  if (editingId === id) {
    clearForm(false);
    editingId = null;
  }
  setStatus(`Deleted ${rec.name}.`, true);
}

function clearForm(showStatus = true) {
  editingId = null;
  q("euaSegment").value = "";
  q("euaName").value = "";
  q("euaProduct").value = "Scotch Yoke";
  q("euaOwnerBranch").value = "";
  q("euaStartDate").value = "";
  q("euaEndDate").value = "";
  q("euaMilestone").value = "";
  q("euaRemark").value = "";
  q("euaNextAction").value = "";
  q("euaBudget").value = "";
  if (showStatus) setStatus("Form cleared.", true);
}

function setStatus(message, ok) {
  const el = q("euaStatus");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function moneyL(v) {
  return Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function q(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
