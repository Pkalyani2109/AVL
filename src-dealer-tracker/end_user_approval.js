const STORAGE_KEY = "dealer-growth-tracker-v1";

const state = {
  approvals: [],
  controls: {
    search: "",
    segment: "ALL",
    product: "ALL"
  }
};

let editingId = null;

(function init() {
  hydrate();
  bindEvents();
  renderAll();
})();

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.approvals = parsed.endUserApprovals || [];
  } catch (err) {
    console.error("Failed to parse storage", err);
  }
}

function persist() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let base = {};

  if (raw) {
    try {
      base = JSON.parse(raw);
    } catch (_err) {
      base = {};
    }
  }

  base.endUserApprovals = state.approvals;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
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
    tbody.innerHTML = `<tr><td colspan="11" class="muted">No approval targets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${esc(r.segment)}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.product)}</td>
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
    startDate: q("euaStartDate").value,
    endDate: q("euaEndDate").value,
    milestone: q("euaMilestone").value.trim(),
    remark: q("euaRemark").value.trim(),
    nextAction: q("euaNextAction").value.trim(),
    budget: num(q("euaBudget").value),
    updatedAt: new Date().toISOString()
  };

  if (!record.segment || !record.name || !record.product || !record.milestone) {
    setStatus("Segment, Name Authority/End User, Product, and Milestone are required.", false);
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
  q("euaStartDate").value = rec.startDate || "";
  q("euaEndDate").value = rec.endDate || "";
  q("euaMilestone").value = rec.milestone || "";
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
