const STORAGE_KEY = "dealer-growth-tracker-v1";
const DEFAULT_REGION_NAMES = [
  "BANGALORE",
  "CBE 2",
  "CHENNAI 1",
  "DELHI 1",
  "GUJARAT",
  "HYDERABAD",
  "INDORE",
  "KOLKATA",
  "MUMBAI",
  "MUMBAI-2",
  "PUNE",
  "TEXTILE"
];

const state = {
  regions: [],
  pa2Plans: []
};

let currentPlanId = null;
let milestoneRows = [];
let visitMonthlyRows = [];
let actionItemRows = [];

const MILESTONE_KEYS = [
  { key: "qualification", label: "Qualification" },
  { key: "onboarding", label: "Onboarding" },
  { key: "commercialClosure", label: "Commercial Closure" }
];

const PRODUCT_OPTIONS = ["Scotch Yoke", "KEVA", "Namur Cylinder", "Automation"];
const ACTION_STATUS_OPTIONS = ["Not Started", "In Progress", "At Risk", "Blocked", "Completed"];

(function init() {
  hydrate();
  ensureRegions();
  bindEvents();
  setDefaults();
  renderRegionSelector();
  loadFromQuery();
})();

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.regions = parsed.regions || [];
    state.pa2Plans = parsed.pa2Plans || [];
  } catch (err) {
    console.error("Failed to parse storage", err);
  }
}

function ensureRegions() {
  if (state.regions.length) return;
  state.regions = DEFAULT_REGION_NAMES.map(name => ({ id: crypto.randomUUID(), name }));
  persist();
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

  base.regions = state.regions;
  base.pa2Plans = state.pa2Plans;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
}

function bindEvents() {
  document.querySelectorAll("[data-pa2-tab]").forEach(btn => {
    btn.addEventListener("click", () => activatePlannerTab(btn.dataset.pa2Tab));
  });

  q("pa2Month").addEventListener("change", () => {
    q("pa2Quarter").value = quarterFromMonth(q("pa2Month").value);
  });

  q("btnPa2SavePlan").addEventListener("click", savePlan);
  q("btnPa2DeletePlan").addEventListener("click", deletePlan);
  q("btnAddVisitMonth").addEventListener("click", addVisitMonthRow);
  q("btnAddActionItem").addEventListener("click", addActionItemRow);
  q("pa2Products").addEventListener("change", () => {
    if (!actionItemRows.length) {
      actionItemRows = normalizeActionRows([], getSelectedProducts(), "");
      renderActionRows();
    }
  });
}

function activatePlannerTab(tabName) {
  document.querySelectorAll("[data-pa2-tab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.pa2Tab === tabName);
  });
  document.querySelectorAll("#pa2-tab-milestones, #pa2-tab-visit, #pa2-tab-action").forEach(panel => {
    panel.classList.toggle("active", panel.id === `pa2-tab-${tabName}`);
  });
}

function setDefaults() {
  if (!q("pa2Month").value) q("pa2Month").value = new Date().toISOString().slice(0, 7);
  q("pa2Quarter").value = quarterFromMonth(q("pa2Month").value);
}

function defaultMilestones(onboardingStatus, updatedAt) {
  const stamp = updatedAt || new Date().toISOString();
  if (onboardingStatus === "Completed") {
    return MILESTONE_KEYS.map(item => ({ key: item.key, label: item.label, completed: true, completedAt: stamp }));
  }
  if (onboardingStatus === "In Progress") {
    return [
      { key: "qualification", label: "Qualification", completed: true, completedAt: stamp },
      { key: "onboarding", label: "Onboarding", completed: false, completedAt: "" },
      { key: "commercialClosure", label: "Commercial Closure", completed: false, completedAt: "" }
    ];
  }
  return MILESTONE_KEYS.map(item => ({ key: item.key, label: item.label, completed: false, completedAt: "" }));
}

function normalizeMilestones(rows, onboardingStatus, updatedAt) {
  const fallback = defaultMilestones(onboardingStatus, updatedAt);
  if (!Array.isArray(rows) || !rows.length) return fallback;

  const rowMap = new Map(rows.map(r => [r.key, r]));
  return MILESTONE_KEYS.map(item => {
    const rec = rowMap.get(item.key);
    return {
      key: item.key,
      label: item.label,
      completed: Boolean(rec && rec.completed),
      completedAt: rec && rec.completed ? (rec.completedAt || updatedAt || "") : ""
    };
  });
}

function normalizeVisitRows(rows, monthValue) {
  if (Array.isArray(rows) && rows.length) {
    return rows.map(row => ({
      month: row.month || monthValue || "",
      plan: intNum(row.plan),
      done: intNum(row.done),
      remark: row.remark || ""
    }));
  }

  return [{ month: monthValue || "", plan: 0, done: 0, remark: "" }];
}

function normalizeActionRows(rows, productValues, actionPlan) {
  const primaryProduct = (productValues && productValues[0]) || PRODUCT_OPTIONS[0];
  if (Array.isArray(rows) && rows.length) {
    return rows.map(row => ({
      product: row.product || primaryProduct,
      status: row.status || "Not Started",
      targetDate: row.targetDate || "",
      remark: row.remark || "",
      roadblock: row.roadblock || ""
    }));
  }

  return [{
    product: primaryProduct,
    status: "In Progress",
    targetDate: "",
    remark: actionPlan || "",
    roadblock: ""
  }];
}

function getSelectedProducts() {
  const sel = q("pa2Products");
  if (!sel) return [];
  return Array.from(sel.options).filter(o => o.selected).map(o => o.value);
}

function setSelectedProducts(values) {
  const sel = q("pa2Products");
  if (!sel) return;
  const selected = new Set(Array.isArray(values) && values.length ? values : [PRODUCT_OPTIONS[0]]);
  Array.from(sel.options).forEach(o => {
    o.selected = selected.has(o.value);
  });
}

function formatTimestamp(iso) {
  if (!iso) return "Not completed";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not completed";
  return d.toLocaleString("en-IN", { hour12: true });
}

function renderMilestones() {
  const wrap = q("pa2MilestoneList");
  if (!wrap) return;

  wrap.innerHTML = milestoneRows.map((row, idx) => `
    <label style="text-transform:none; letter-spacing:0; font-weight:600;">
      <span>
        <input type="checkbox" data-milestone-idx="${idx}" ${row.completed ? "checked" : ""} />
        ${esc(row.label)}
      </span>
      <span class="muted" style="font-size:12px;">Completed At: ${esc(formatTimestamp(row.completedAt))}</span>
    </label>
  `).join("");

  wrap.querySelectorAll("input[type='checkbox'][data-milestone-idx]").forEach(input => {
    input.addEventListener("change", () => {
      const idx = intNum(input.dataset.milestoneIdx);
      const row = milestoneRows[idx];
      if (!row) return;
      row.completed = Boolean(input.checked);
      row.completedAt = row.completed ? new Date().toISOString() : "";
      deriveOnboardingSummary();
      renderMilestones();
    });
  });
}

function renderVisitRows() {
  const tbody = q("pa2VisitRows");
  if (!tbody) return;

  tbody.innerHTML = visitMonthlyRows.map((row, idx) => `
    <tr>
      <td><input type="month" data-visit-month="${idx}" value="${esc(row.month || "")}" /></td>
      <td><input type="number" min="0" step="1" data-visit-plan="${idx}" value="${esc(String(intNum(row.plan)))}" /></td>
      <td><input type="number" min="0" step="1" data-visit-done="${idx}" value="${esc(String(intNum(row.done)))}" /></td>
      <td><input type="text" data-visit-remark="${idx}" value="${esc(row.remark || "")}" placeholder="Visit notes" /></td>
      <td><button class="btn ghost" type="button" data-remove-visit="${idx}">Remove</button></td>
    </tr>
  `).join("");

  bindVisitRowEvents();
  syncVisitTotalsFromMonthlyRows();
}

function bindVisitRowEvents() {
  q("pa2VisitRows").querySelectorAll("[data-visit-month]").forEach(input => {
    input.addEventListener("change", () => {
      const idx = intNum(input.dataset.visitMonth);
      if (visitMonthlyRows[idx]) visitMonthlyRows[idx].month = input.value;
    });
  });

  q("pa2VisitRows").querySelectorAll("[data-visit-plan]").forEach(input => {
    input.addEventListener("input", () => {
      const idx = intNum(input.dataset.visitPlan);
      if (visitMonthlyRows[idx]) visitMonthlyRows[idx].plan = intNum(input.value);
      syncVisitTotalsFromMonthlyRows();
    });
  });

  q("pa2VisitRows").querySelectorAll("[data-visit-done]").forEach(input => {
    input.addEventListener("input", () => {
      const idx = intNum(input.dataset.visitDone);
      if (visitMonthlyRows[idx]) visitMonthlyRows[idx].done = intNum(input.value);
      syncVisitTotalsFromMonthlyRows();
    });
  });

  q("pa2VisitRows").querySelectorAll("[data-visit-remark]").forEach(input => {
    input.addEventListener("input", () => {
      const idx = intNum(input.dataset.visitRemark);
      if (visitMonthlyRows[idx]) visitMonthlyRows[idx].remark = input.value;
    });
  });

  q("pa2VisitRows").querySelectorAll("[data-remove-visit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = intNum(btn.dataset.removeVisit);
      visitMonthlyRows.splice(idx, 1);
      if (!visitMonthlyRows.length) visitMonthlyRows.push({ month: q("pa2Month").value || "", plan: 0, done: 0, remark: "" });
      renderVisitRows();
    });
  });
}

function addVisitMonthRow() {
  visitMonthlyRows.push({ month: q("pa2Month").value || "", plan: 0, done: 0, remark: "" });
  renderVisitRows();
}

function renderActionRows() {
  const tbody = q("pa2ActionRows");
  if (!tbody) return;

  const productOptions = PRODUCT_OPTIONS.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  const statusOptions = ACTION_STATUS_OPTIONS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");

  tbody.innerHTML = actionItemRows.map((row, idx) => `
    <tr>
      <td><select data-action-product="${idx}">${productOptions}</select></td>
      <td><select data-action-status="${idx}">${statusOptions}</select></td>
      <td><input type="date" data-action-date="${idx}" value="${esc(row.targetDate || "")}" /></td>
      <td><input type="text" data-action-remark="${idx}" value="${esc(row.remark || "")}" placeholder="Progress remark" /></td>
      <td><input type="text" data-action-roadblock="${idx}" value="${esc(row.roadblock || "")}" placeholder="Dependencies / blockers" /></td>
      <td><button class="btn ghost" type="button" data-remove-action="${idx}">Remove</button></td>
    </tr>
  `).join("");

  actionItemRows.forEach((row, idx) => {
    const pSel = tbody.querySelector(`[data-action-product='${idx}']`);
    const sSel = tbody.querySelector(`[data-action-status='${idx}']`);
    if (pSel) pSel.value = row.product || PRODUCT_OPTIONS[0];
    if (sSel) sSel.value = row.status || ACTION_STATUS_OPTIONS[0];
  });

  bindActionRowEvents();
  deriveActionPlanSummary();
}

function bindActionRowEvents() {
  q("pa2ActionRows").querySelectorAll("[data-action-product]").forEach(input => {
    input.addEventListener("change", () => {
      const idx = intNum(input.dataset.actionProduct);
      if (actionItemRows[idx]) actionItemRows[idx].product = input.value;
      deriveActionPlanSummary();
    });
  });

  q("pa2ActionRows").querySelectorAll("[data-action-status]").forEach(input => {
    input.addEventListener("change", () => {
      const idx = intNum(input.dataset.actionStatus);
      if (actionItemRows[idx]) actionItemRows[idx].status = input.value;
      deriveActionPlanSummary();
    });
  });

  q("pa2ActionRows").querySelectorAll("[data-action-date]").forEach(input => {
    input.addEventListener("change", () => {
      const idx = intNum(input.dataset.actionDate);
      if (actionItemRows[idx]) actionItemRows[idx].targetDate = input.value;
    });
  });

  q("pa2ActionRows").querySelectorAll("[data-action-remark]").forEach(input => {
    input.addEventListener("input", () => {
      const idx = intNum(input.dataset.actionRemark);
      if (actionItemRows[idx]) actionItemRows[idx].remark = input.value;
      deriveActionPlanSummary();
    });
  });

  q("pa2ActionRows").querySelectorAll("[data-action-roadblock]").forEach(input => {
    input.addEventListener("input", () => {
      const idx = intNum(input.dataset.actionRoadblock);
      if (actionItemRows[idx]) actionItemRows[idx].roadblock = input.value;
    });
  });

  q("pa2ActionRows").querySelectorAll("[data-remove-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = intNum(btn.dataset.removeAction);
      actionItemRows.splice(idx, 1);
      if (!actionItemRows.length) actionItemRows.push({ product: (getSelectedProducts()[0] || PRODUCT_OPTIONS[0]), status: "Not Started", targetDate: "", remark: "", roadblock: "" });
      renderActionRows();
    });
  });
}

function addActionItemRow() {
  actionItemRows.push({ product: (getSelectedProducts()[0] || PRODUCT_OPTIONS[0]), status: "Not Started", targetDate: "", remark: "", roadblock: "" });
  renderActionRows();
}

function syncVisitTotalsFromMonthlyRows() {
  q("pa2VisitPlan").value = String(visitMonthlyRows.reduce((acc, row) => acc + intNum(row.plan), 0));
  q("pa2VisitDone").value = String(visitMonthlyRows.reduce((acc, row) => acc + intNum(row.done), 0));
}

function deriveOnboardingSummary() {
  const completedCount = milestoneRows.filter(row => row.completed).length;
  const status = completedCount === 0 ? "Not Started" : (completedCount === milestoneRows.length ? "Completed" : "In Progress");
  q("pa2OnboardingStatus").value = status;

  const summary = milestoneRows.map(row => `${row.label}: ${row.completed ? `Done (${formatTimestamp(row.completedAt)})` : "Pending"}`).join(" | ");
  q("pa2OnboardingSteps").value = summary || "Qualification, onboarding, and commercial closure in progress.";
}

function deriveActionPlanSummary() {
  const summary = actionItemRows
    .filter(row => row.product)
    .map(row => `${row.product} [${row.status}]: ${row.remark || "No remark"}`)
    .join(" | ");
  q("pa2ActionPlanAuto").value = summary;
}

function renderRegionSelector() {
  const sel = q("pa2Region");
  const prev = sel.value;
  sel.innerHTML = "";

  state.regions.forEach(r => sel.appendChild(opt(r.id, r.name)));

  if (Array.from(sel.options).some(o => o.value === prev)) {
    sel.value = prev;
  } else if (sel.options.length) {
    sel.value = sel.options[0].value;
  }
}

function loadFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get("planId");

  if (!planId) {
    currentPlanId = null;
    q("btnPa2DeletePlan").disabled = true;
    milestoneRows = defaultMilestones("Not Started", "");
    visitMonthlyRows = normalizeVisitRows([], q("pa2Month").value);
    setSelectedProducts([PRODUCT_OPTIONS[0]]);
    actionItemRows = normalizeActionRows([], getSelectedProducts(), "");
    renderMilestones();
    renderVisitRows();
    renderActionRows();
    deriveOnboardingSummary();
    setStatus("New OEM plan mode.", true);
    return;
  }

  const plan = state.pa2Plans.find(p => p.id === planId);
  if (!plan) {
    currentPlanId = null;
    q("btnPa2DeletePlan").disabled = true;
    milestoneRows = defaultMilestones("Not Started", "");
    visitMonthlyRows = normalizeVisitRows([], q("pa2Month").value);
    setSelectedProducts([PRODUCT_OPTIONS[0]]);
    actionItemRows = normalizeActionRows([], getSelectedProducts(), "");
    renderMilestones();
    renderVisitRows();
    renderActionRows();
    deriveOnboardingSummary();
    setStatus("Plan not found. You can create a new one.", false);
    return;
  }

  currentPlanId = plan.id;
  q("btnPa2DeletePlan").disabled = false;
  fillForm(plan);
  setStatus(`Loaded ${plan.oemName} for edit.`, true);
}

function fillForm(plan) {
  q("pa2Region").value = plan.regionId || q("pa2Region").value;
  q("pa2AccountType").value = plan.accountType || "OEM";
  q("pa2OemName").value = plan.oemName || "";
  const selectedProducts = Array.isArray(plan.products) && plan.products.length ? plan.products : [plan.product || PRODUCT_OPTIONS[0]];
  setSelectedProducts(selectedProducts);
  q("pa2Month").value = plan.month || "";
  q("pa2Quarter").value = plan.quarter || quarterFromMonth(plan.month);
  q("pa2AnnualForecast").value = num(plan.annualForecastCr);
  q("pa2AnnualActual").value = num(plan.annualActualCr);
  q("pa2FocusStatus").value = plan.focusStatus || "";
  q("pa2NextSteps").value = plan.nextSteps || "";
  q("pa2Segments").value = plan.segments || "";
  q("pa2Strategy").value = plan.strategy || "";
  q("pa2Initiative").value = plan.initiative || "";
  q("pa2VisitPlan").value = intNum(plan.visitPlan);
  q("pa2VisitDone").value = intNum(plan.visitDone);
  q("pa2OnboardingStatus").value = plan.onboardingStatus || "Not Started";
  q("pa2OnboardingSteps").value = plan.onboardingSteps || "";
  q("pa2OnboardingRemark").value = plan.onboardingRemark || "";
  q("pa2ActionPlanAuto").value = plan.actionPlanAuto || "";
  q("pa2ActionPlan").value = plan.actionPlan || "";
  q("pa2Owner").value = plan.owner || "";

  milestoneRows = normalizeMilestones(plan.onboardingMilestones, plan.onboardingStatus, plan.updatedAt);
  visitMonthlyRows = normalizeVisitRows(plan.visitMonthly, plan.month);
  actionItemRows = normalizeActionRows(plan.actionItems, selectedProducts, plan.actionPlanAuto || plan.actionPlan);

  renderMilestones();
  renderVisitRows();
  renderActionRows();
  deriveOnboardingSummary();
}

function savePlan() {
  syncVisitTotalsFromMonthlyRows();
  deriveOnboardingSummary();
  deriveActionPlanSummary();
  const selectedProducts = getSelectedProducts();

  const plan = {
    id: currentPlanId || crypto.randomUUID(),
    regionId: q("pa2Region").value,
    accountType: q("pa2AccountType").value,
    oemName: q("pa2OemName").value.trim(),
    products: selectedProducts,
    product: selectedProducts[0] || PRODUCT_OPTIONS[0],
    month: q("pa2Month").value,
    quarter: q("pa2Quarter").value,
    annualForecastCr: num(q("pa2AnnualForecast").value),
    annualActualCr: num(q("pa2AnnualActual").value),
    focusStatus: q("pa2FocusStatus").value.trim(),
    nextSteps: q("pa2NextSteps").value.trim(),
    segments: q("pa2Segments").value.trim(),
    strategy: q("pa2Strategy").value.trim(),
    initiative: q("pa2Initiative").value.trim(),
    visitPlan: intNum(q("pa2VisitPlan").value),
    visitDone: intNum(q("pa2VisitDone").value),
    onboardingStatus: q("pa2OnboardingStatus").value,
    onboardingSteps: q("pa2OnboardingSteps").value.trim(),
    onboardingRemark: q("pa2OnboardingRemark").value.trim(),
    actionPlanAuto: q("pa2ActionPlanAuto").value.trim(),
    actionPlan: q("pa2ActionPlan").value.trim(),
    onboardingMilestones: milestoneRows.map(row => ({
      key: row.key,
      label: row.label,
      completed: Boolean(row.completed),
      completedAt: row.completed ? row.completedAt : ""
    })),
    visitMonthly: visitMonthlyRows.map(row => ({
      month: row.month,
      plan: intNum(row.plan),
      done: intNum(row.done),
      remark: row.remark || ""
    })),
    actionItems: actionItemRows.map(row => ({
      product: row.product,
      status: row.status,
      targetDate: row.targetDate,
      remark: row.remark || "",
      roadblock: row.roadblock || ""
    })),
    owner: q("pa2Owner").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!plan.regionId) {
    setStatus("Select region/branch first.", false);
    return;
  }
  if (!plan.oemName) {
    setStatus("Enter Key Account / OEM Name.", false);
    return;
  }
  if (!plan.month) {
    setStatus("Select month.", false);
    return;
  }
  if (!plan.products.length) {
    setStatus("Select at least one product.", false);
    return;
  }

  state.pa2Plans = state.pa2Plans.filter(p => p.id !== plan.id);
  state.pa2Plans.push(plan);

  currentPlanId = plan.id;
  persist();
  setStatus("OEM plan saved successfully.", true);
  q("btnPa2DeletePlan").disabled = false;
}

function deletePlan() {
  if (!currentPlanId) {
    setStatus("No existing plan selected to remove.", false);
    return;
  }

  const existing = state.pa2Plans.find(p => p.id === currentPlanId);
  state.pa2Plans = state.pa2Plans.filter(p => p.id !== currentPlanId);
  persist();

  setStatus(existing ? `Removed plan for ${existing.oemName}.` : "Plan removed.", true);
  window.location.href = "pa2_oem.html";
}

function setStatus(message, ok) {
  const el = q("pa2Status");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function quarterFromMonth(monthValue) {
  if (!monthValue || monthValue.length < 7) return "-";
  const m = Number(monthValue.slice(5, 7));
  if (m >= 4 && m <= 6) return "Q1";
  if (m >= 7 && m <= 9) return "Q2";
  if (m >= 10 && m <= 12) return "Q3";
  return "Q4";
}

function q(id) {
  return document.getElementById(id);
}

function opt(value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  return o;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intNum(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
