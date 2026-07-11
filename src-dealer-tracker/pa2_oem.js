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

const SEED_SEGMENTS = "Power | Steel | Paper | Cement | Oil & Gas | Pharma | Food & Beverage";
const SEED_STRATEGY = "Spec Development | Value Engineering | Market Expansion | Dealer Network | Pricing";
const SEEDED_PA2_PLANS = [
  {
    accountType: "OEM",
    oemName: "JC Valves",
    product: "Scotch Yoke",
    annualForecastCr: 0.5,
    focusStatus: "Working on Specs of Compact Scotch Yoke",
    nextSteps: "Key client for compact Scotch Yoke; target pipeline around 5 Cr.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "Galaxy",
    product: "KEVA",
    annualForecastCr: 1.5,
    focusStatus: "M+L reduction",
    nextSteps: "24 Lakhs PO received in May; reduced M+L design target by end of month.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "RK Engineering",
    product: "Namur Cylinder",
    annualForecastCr: 1.0,
    focusStatus: "End-user focus: Adani Power, Paper Industry, Steel",
    nextSteps: "300 nos cylinder PO for 350x725 in pipeline for Adani Power (~1.32 Cr).",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "Jash",
    product: "Automation",
    annualForecastCr: 0.5,
    focusStatus: "L&T visit completed",
    nextSteps: "Alternative package discussion active; with optimum product, business can be gained.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "Mechwell",
    product: "Scotch Yoke",
    annualForecastCr: 1.0,
    focusStatus: "MOU completed",
    nextSteps: "Standardization in progress; requested standard bore/stroke and rate contract for faster quotation.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "Flowlink Voith",
    product: "Automation",
    annualForecastCr: 0.7,
    focusStatus: "Aggressive pricing",
    nextSteps: "Package-level pricing worked; design simplification initiated with engineering team.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "Rungata Sons",
    product: "Namur Cylinder",
    annualForecastCr: 0.45,
    focusStatus: "New plant commissioning",
    nextSteps: "Recent PO plus additional cylinder demand expected for MOR/SMO and valve automation.",
    owner: "Branch Team"
  },
  {
    accountType: "OEM",
    oemName: "FLS Smith",
    product: "KEVA",
    annualForecastCr: 1.1,
    focusStatus: "Global supply: Hydraulic and Pneumatic KGV",
    nextSteps: "Global specs shared, sample sizes and technical drawing submitted; commercial proposal pending.",
    owner: "Branch Team"
  },
  {
    accountType: "Direct",
    oemName: "End Users: HUL, CCL, Indus Coffee, Century Ply, Chemfab Alkali, BHEL, BSL URM, NTPC, Vedanta",
    product: "Automation",
    annualForecastCr: 1.0,
    focusStatus: "Janatics Brand VAS across DM plant, coffee, slurry, ash and coal",
    nextSteps: "Field performance expected this month; segment-specific strategy and stocking plan with dealers.",
    owner: "Branch Team"
  }
];

const state = {
  regions: [],
  pa2Plans: []
};

let selectedPlanId = null;

(function init() {
  hydrate();
  ensureRegions();
  const seeded = seedPa2PlansFromReview();
  const migrated = migratePa2Plans();
  bindEvents();
  setDefaults();
  renderAll();
  if (seeded) {
    setStatus("Preloaded PA2 OEM review data from June 2026 snapshot.", true);
  } else if (migrated) {
    setStatus("Updated PA2 plans with initiative and onboarding tracking fields.", true);
  }
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

function seedPa2PlansFromReview() {
  if (state.pa2Plans.length) return false;
  if (!state.regions.length) return false;

  const primaryRegionId = state.regions[0].id;
  const month = "2026-06";
  const quarter = quarterFromMonth(month);

  state.pa2Plans = SEEDED_PA2_PLANS.map(item => ({
    id: crypto.randomUUID(),
    regionId: primaryRegionId,
    accountType: item.accountType,
    oemName: item.oemName,
    product: item.product,
    month,
    quarter,
    annualForecastCr: num(item.annualForecastCr),
    annualActualCr: 0,
    focusStatus: item.focusStatus,
    nextSteps: item.nextSteps,
    initiative: item.initiative || item.focusStatus,
    visitPlan: intNum(item.visitPlan),
    visitDone: intNum(item.visitDone),
    onboardingStatus: item.onboardingStatus || "In Progress",
    onboardingSteps: item.onboardingSteps || "Qualification and commercial onboarding in progress.",
    actionPlan: item.actionPlan || `Drive ${item.product} conversion through account-specific trials and monthly reviews.`,
    segments: SEED_SEGMENTS,
    strategy: SEED_STRATEGY,
    owner: item.owner,
    updatedAt: new Date().toISOString()
  }));

  persist();
  return true;
}

function migratePa2Plans() {
  if (!state.pa2Plans.length) return false;
  let changed = false;

  state.pa2Plans = state.pa2Plans.map(plan => {
    const next = { ...plan };

    if (next.annualActualCr == null) {
      next.annualActualCr = 0;
      changed = true;
    }
    if (!next.initiative) {
      next.initiative = next.focusStatus || "Account growth initiative";
      changed = true;
    }
    if (next.visitPlan == null) {
      next.visitPlan = 3;
      changed = true;
    }
    if (next.visitDone == null) {
      next.visitDone = 1;
      changed = true;
    }
    if (!next.onboardingStatus) {
      next.onboardingStatus = "In Progress";
      changed = true;
    }
    if (!next.onboardingSteps) {
      next.onboardingSteps = "Qualification, onboarding, and commercial closure in progress.";
      changed = true;
    }
    if (!next.actionPlan) {
      next.actionPlan = `Drive ${next.product || "product"} conversion with account-wise monthly milestones.`;
      changed = true;
    }

    return next;
  });

  if (changed) persist();
  return changed;
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
  q("btnPa2NewPlan").addEventListener("click", startNewPlan);
  q("pa2Region").addEventListener("change", () => {
    selectedPlanId = null;
    renderAll();
  });
  q("pa2Month").addEventListener("change", () => {
    q("pa2Quarter").value = quarterFromMonth(q("pa2Month").value);
  });
  q("btnPa2SavePlan").addEventListener("click", savePlan);
  q("btnPa2CancelEdit").addEventListener("click", cancelEntry);
  q("btnPa2ClearForm").addEventListener("click", clearForm);
  q("btnPa2RemovePlan").addEventListener("click", removeSelectedPlan);
}

function setDefaults() {
  if (!q("pa2Month").value) q("pa2Month").value = new Date().toISOString().slice(0, 7);
  q("pa2Quarter").value = quarterFromMonth(q("pa2Month").value);
  setFormVisible(false);
}

function setFormVisible(visible) {
  const wrap = q("pa2EntryFormWrap");
  if (!wrap) return;
  wrap.style.display = visible ? "block" : "none";
}

function startNewPlan() {
  selectedPlanId = null;
  clearForm(false);
  if (q("pa2Month") && !q("pa2Month").value) {
    q("pa2Month").value = new Date().toISOString().slice(0, 7);
  }
  q("pa2Quarter").value = quarterFromMonth(q("pa2Month").value);
  setFormVisible(true);
  setStatus("New OEM plan entry mode.", true);
}

function cancelEntry() {
  selectedPlanId = null;
  clearForm(false);
  setFormVisible(false);
  setStatus("Entry cancelled.", true);
}

function renderAll() {
  renderRegionSelector();
  renderRegionTabs();
  renderKpis();
  renderPlanTable();
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

function renderRegionTabs() {
  const wrap = q("pa2RegionTabs");
  if (!wrap) return;
  const active = q("pa2Region").value;

  wrap.innerHTML = state.regions.map(r => (
    `<button class="region-tab ${r.id === active ? "active" : ""}" data-region-id="${esc(r.id)}">${esc(r.name)}</button>`
  )).join("");

  wrap.querySelectorAll(".region-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      q("pa2Region").value = btn.dataset.regionId;
      selectedPlanId = null;
      renderAll();
    });
  });
}

function savePlan() {
  const plan = {
    id: selectedPlanId || crypto.randomUUID(),
    regionId: q("pa2Region").value,
    accountType: q("pa2AccountType").value,
    oemName: q("pa2OemName").value.trim(),
    product: q("pa2Product").value,
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
    actionPlan: q("pa2ActionPlan").value.trim(),
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

  state.pa2Plans = state.pa2Plans.filter(p => p.id !== plan.id);
  state.pa2Plans.push(plan);

  persist();
  setStatus(selectedPlanId ? "OEM plan updated." : "OEM plan saved.", true);
  selectedPlanId = null;
  clearForm(false);
  setFormVisible(false);
  renderAll();
}

function clearForm(showStatus = true) {
  selectedPlanId = null;
  q("pa2AccountType").value = "OEM";
  q("pa2OemName").value = "";
  q("pa2Product").value = "Scotch Yoke";
  q("pa2AnnualForecast").value = "";
  q("pa2AnnualActual").value = "";
  q("pa2FocusStatus").value = "";
  q("pa2NextSteps").value = "";
  q("pa2Segments").value = "";
  q("pa2Strategy").value = "";
  q("pa2Initiative").value = "";
  q("pa2VisitPlan").value = "";
  q("pa2VisitDone").value = "";
  q("pa2OnboardingStatus").value = "Not Started";
  q("pa2OnboardingSteps").value = "";
  q("pa2ActionPlan").value = "";
  q("pa2Owner").value = "";
  if (showStatus) setStatus("Form cleared.", true);
}

function removeSelectedPlan() {
  if (!selectedPlanId) {
    setStatus("Select a row from OEM Growth Plan Review to remove.", false);
    return;
  }

  const existing = state.pa2Plans.find(p => p.id === selectedPlanId);
  state.pa2Plans = state.pa2Plans.filter(p => p.id !== selectedPlanId);
  persist();
  setStatus(existing ? `Removed plan for ${existing.oemName}.` : "Plan removed.", true);
  selectedPlanId = null;
  clearForm(false);
  setFormVisible(false);
  renderAll();
}

function renderKpis() {
  const plans = filteredPlans();
  const totalForecast = sum(plans.map(p => num(p.annualForecastCr)));
  const totalActual = sum(plans.map(p => num(p.annualActualCr)));
  const accountCount = plans.length;
  const uniqueProducts = new Set(plans.map(p => p.product)).size;
  const uniqueAccounts = new Set(plans.map(p => p.oemName.toUpperCase())).size;
  const totalVisitPlan = sum(plans.map(p => intNum(p.visitPlan)));
  const totalVisitDone = sum(plans.map(p => intNum(p.visitDone)));

  const cards = [
    ["Annual Forecast Pipeline", `${moneyCr(totalForecast)} Cr`],
    ["Annual Actual", `${moneyCr(totalActual)} Cr`],
    ["Forecast-Actual Gap", `${moneyCr(totalForecast - totalActual)} Cr`],
    ["Total Plans", String(accountCount)],
    ["Unique OEM/Direct Accounts", String(uniqueAccounts)],
    ["Active Product Groups", String(uniqueProducts)],
    ["Visit Plan", String(totalVisitPlan)],
    ["Visit Done", String(totalVisitDone)]
  ];

  q("pa2KpiGrid").innerHTML = cards.map(([label, value]) => (
    `<div class="kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`
  )).join("");
}

function renderPlanTable() {
  const rows = filteredPlans();
  const tbody = q("pa2PlanRows");

  tbody.innerHTML = rows.map((p, idx) => {
    const selectedClass = p.id === selectedPlanId ? " style=\"background:#eef6ff;\"" : "";
    return `
      <tr data-id="${esc(p.id)}"${selectedClass}>
        <td>${idx + 1}</td>
        <td>${esc(regionName(p.regionId))}</td>
        <td>${esc(p.accountType || "-")}</td>
        <td>${esc(p.oemName || "-")}</td>
        <td>${esc(p.product || "-")}</td>
        <td>${esc(p.month || "-")}</td>
        <td>${esc(p.quarter || quarterFromMonth(p.month))}</td>
        <td>${esc(moneyCr(p.annualForecastCr))}</td>
        <td>${esc(moneyCr(p.annualActualCr))}</td>
        <td>${esc(moneyCr(num(p.annualForecastCr) - num(p.annualActualCr)))}</td>
        <td>${esc(p.focusStatus || "-")}</td>
        <td>${esc(p.nextSteps || "-")}</td>
        <td>${esc(p.initiative || "-")}</td>
        <td>${esc(String(intNum(p.visitPlan)))}</td>
        <td>${esc(String(intNum(p.visitDone)))}</td>
        <td>${esc(p.onboardingStatus || "Not Started")}</td>
        <td>${esc(p.onboardingSteps || "-")}</td>
        <td>${esc(p.actionPlan || "-")}</td>
        <td>${esc(p.segments || "-")}</td>
        <td>${esc(p.strategy || "-")}</td>
        <td>${esc(p.owner || "-")}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("tr[data-id]").forEach(tr => {
    tr.addEventListener("click", () => loadPlanForEdit(tr.dataset.id));
  });
}

function loadPlanForEdit(id) {
  const plan = state.pa2Plans.find(p => p.id === id);
  if (!plan) return;

  selectedPlanId = plan.id;
  q("pa2Region").value = plan.regionId;
  q("pa2AccountType").value = plan.accountType || "OEM";
  q("pa2OemName").value = plan.oemName || "";
  q("pa2Product").value = plan.product || "Scotch Yoke";
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
  q("pa2ActionPlan").value = plan.actionPlan || "";
  q("pa2Owner").value = plan.owner || "";

  setFormVisible(true);
  setStatus(`Loaded ${plan.oemName} for edit.`, true);
  renderAll();
}

function filteredPlans() {
  const regionId = q("pa2Region").value;
  return state.pa2Plans
    .filter(p => p.regionId === regionId)
    .sort((a, b) => {
      const monthCmp = String(a.month || "").localeCompare(String(b.month || ""));
      if (monthCmp !== 0) return monthCmp;
      return String(a.oemName || "").localeCompare(String(b.oemName || ""));
    });
}

function setStatus(message, ok) {
  const el = q("pa2Status");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function regionName(regionId) {
  const rec = state.regions.find(r => r.id === regionId);
  return rec ? rec.name : "-";
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

function sum(values) {
  return values.reduce((acc, value) => acc + num(value), 0);
}

function intNum(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function moneyCr(v) {
  return Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
