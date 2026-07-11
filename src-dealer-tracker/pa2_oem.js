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

const ALL_REGION_VALUE = "__ALL__";

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
  pa2Plans: [],
  review: {
    search: "",
    type: "ALL",
    product: "ALL",
    onboarding: "ALL",
    sortBy: "month",
    sortOrder: "desc"
  }
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
  const importBtn = q("btnPa2ImportKeva");
  const importInput = q("pa2ImportKevaFile");
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", importKevaTargetsByAddress);
  }
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

  bindReviewControl("pa2ReviewSearch", "input", value => {
    state.review.search = String(value || "").trim();
    renderPlanTable();
  });
  bindReviewControl("pa2ReviewTypeFilter", "change", value => {
    state.review.type = value || "ALL";
    renderPlanTable();
  });
  bindReviewControl("pa2ReviewProductFilter", "change", value => {
    state.review.product = value || "ALL";
    renderPlanTable();
  });
  bindReviewControl("pa2ReviewOnboardFilter", "change", value => {
    state.review.onboarding = value || "ALL";
    renderPlanTable();
  });
  bindReviewControl("pa2ReviewSortBy", "change", value => {
    state.review.sortBy = value || "month";
    renderPlanTable();
  });
  bindReviewControl("pa2ReviewSortOrder", "change", value => {
    state.review.sortOrder = value || "desc";
    renderPlanTable();
  });

  const clearBtn = q("btnPa2ReviewClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.review = {
        search: "",
        type: "ALL",
        product: "ALL",
        onboarding: "ALL",
        sortBy: "month",
        sortOrder: "desc"
      };
      syncReviewControlValues();
      renderPlanTable();
    });
  }
}

function bindReviewControl(id, evt, handler) {
  const el = q(id);
  if (!el) return;
  el.addEventListener(evt, () => handler(el.value));
}

function syncReviewControlValues() {
  if (q("pa2ReviewSearch")) q("pa2ReviewSearch").value = state.review.search;
  if (q("pa2ReviewTypeFilter")) q("pa2ReviewTypeFilter").value = state.review.type;
  if (q("pa2ReviewProductFilter")) q("pa2ReviewProductFilter").value = state.review.product;
  if (q("pa2ReviewOnboardFilter")) q("pa2ReviewOnboardFilter").value = state.review.onboarding;
  if (q("pa2ReviewSortBy")) q("pa2ReviewSortBy").value = state.review.sortBy;
  if (q("pa2ReviewSortOrder")) q("pa2ReviewSortOrder").value = state.review.sortOrder;
}

function setImportStatus(message, ok) {
  const el = q("pa2ImportStatus");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function importKevaTargetsByAddress(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === "undefined") {
    setStatus("Excel parser not loaded. Refresh and try again.", false);
    setImportStatus("Excel parser not loaded. Refresh and try again.", false);
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = reader.result;
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const rows = parseKevaWorkbookRows(matrix);
      if (!rows.length) {
        setStatus("No rows found in uploaded file.", false);
        setImportStatus("No rows found in uploaded file.", false);
        return;
      }

      const month = q("pa2Month") && q("pa2Month").value ? q("pa2Month").value : new Date().toISOString().slice(0, 7);
      const quarter = quarterFromMonth(month);
      let imported = 0;
      let skipped = 0;

      rows.forEach(row => {
        const oemName = String(row.manufacturerName || "").trim();
        if (!oemName) {
          skipped += 1;
          return;
        }

        const address = `${row.address || ""} ${row.state || ""} ${row.sectionState || ""}`.trim();
        const regionId = mapAddressToRegionId(address);
        if (!regionId) {
          skipped += 1;
          return;
        }

        const target = num(row.target || 0);

        const duplicate = state.pa2Plans.some(plan =>
          plan.regionId === regionId &&
          String(plan.oemName || "").trim().toUpperCase() === oemName.toUpperCase() &&
          String(plan.product || "").toUpperCase() === "KEVA" &&
          String(plan.month || "") === month
        );

        if (duplicate) {
          skipped += 1;
          return;
        }

        state.pa2Plans.push({
          id: crypto.randomUUID(),
          regionId,
          accountType: "OEM",
          oemName,
          product: "KEVA",
          month,
          quarter,
          annualForecastCr: num(target),
          annualActualCr: 0,
          focusStatus: "Imported from address-based KEVA target list",
          nextSteps: "Validate address mapping and target with region owner.",
          segments: "",
          strategy: "",
          initiative: "KEVA regional target onboarding",
          visitPlan: 0,
          visitDone: 0,
          onboardingStatus: "Not Started",
          onboardingSteps: "Qualification and onboarding pending.",
          actionPlan: "Initiate KEVA opportunity conversion for mapped region accounts.",
          owner: "Branch Team",
          updatedAt: new Date().toISOString()
        });
        imported += 1;
      });

      persist();
      renderAll();
      setStatus(`Imported ${imported} KEVA targets by address mapping. Skipped ${skipped} rows.`, imported > 0);
      setImportStatus(`Imported ${imported} KEVA targets by address mapping. Skipped ${skipped} rows.`, imported > 0);
    } catch (err) {
      console.error(err);
      setStatus("Failed to import KEVA targets. Please upload a valid Excel file.", false);
      setImportStatus("Failed to import KEVA targets. Please upload a valid Excel file.", false);
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsArrayBuffer(file);
}

function parseKevaWorkbookRows(matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return [];

  const rows = [];
  let headerIndex = -1;
  let currentSectionState = "";

  for (let i = 0; i < matrix.length; i += 1) {
    const row = Array.isArray(matrix[i]) ? matrix[i] : [];
    const a = String(row[0] || "").trim();
    const c = String(row[2] || "").trim();
    const d = String(row[3] || "").trim();
    const e = String(row[4] || "").trim();

    const isHeader = a.toLowerCase() === "s. no." && c.toLowerCase().includes("manufacturer") && d.toLowerCase() === "state";
    if (isHeader) {
      headerIndex = i;
      continue;
    }

    if (headerIndex >= 0) {
      const rowHasOnlyA = a && !String(row[1] || "").trim() && !c && !d && !e;
      if (rowHasOnlyA && !/^\d+$/g.test(a)) {
        currentSectionState = a;
        continue;
      }

      if (!/^\d+$/g.test(a)) continue;

      const manufacturerName = c;
      if (!manufacturerName) continue;

      const stateText = d;
      const addressText = e;
      const target = estimateKevaTargetFromRow(row);

      rows.push({
        serialNo: a,
        manufacturerName,
        state: stateText,
        address: addressText,
        sectionState: currentSectionState,
        operationType: String(row[5] || "").trim(),
        establishedYear: String(row[6] || "").trim(),
        webAddress: String(row[7] || "").trim(),
        target
      });
    }
  }

  return rows;
}

function estimateKevaTargetFromRow(row) {
  const rawTarget = row[8] || row[9] || row[10] || "";
  const parsed = Number(String(rawTarget).replace(/,/g, ""));
  if (Number.isFinite(parsed)) return parsed;
  return 0;
}

function normalizeRowKeys(row) {
  const out = {};
  Object.keys(row || {}).forEach(key => {
    const norm = String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    out[norm] = row[key];
  });
  return out;
}

function firstText(row, keys) {
  for (const key of keys) {
    const v = row[key];
    if (v == null) continue;
    const text = String(v).trim();
    if (text) return text;
  }
  return "";
}

function firstNum(row, keys) {
  for (const key of keys) {
    const raw = row[key];
    if (raw == null || raw === "") continue;
    const n = Number(String(raw).replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function mapAddressToRegionId(addressText) {
  const text = String(addressText || "").toLowerCase();
  const map = [
    { region: "BANGALORE", keys: ["karnataka", "bengaluru", "bangalore", "mysuru", "belgaum", "hubli", "mangalore"] },
    { region: "CBE 2", keys: ["coimbatore", "erode", "salem", "karur", "trichy", "tiruchirappalli", "madurai"] },
    { region: "TEXTILE", keys: ["tiruppur", "tirupur", "textile", "ichalkaranji"] },
    { region: "CHENNAI 1", keys: ["chennai", "tamil nadu", "pondicherry", "puducherry"] },
    { region: "DELHI 1", keys: ["delhi", "gurgaon", "gurugram", "noida", "ghaziabad", "faridabad", "haryana", "punjab", "rajasthan", "uttar pradesh", "uttarakhand", "himachal"] },
    { region: "GUJARAT", keys: ["gujarat", "ahmedabad", "vadodara", "surat", "rajkot", "gandhinagar", "jamnagar"] },
    { region: "HYDERABAD", keys: ["hyderabad", "telangana", "andhra", "vizag", "vishakhapatnam", "vijayawada"] },
    { region: "INDORE", keys: ["indore", "madhya pradesh", "bhopal", "ujjain", "gwalior"] },
    { region: "KOLKATA", keys: ["kolkata", "west bengal", "howrah", "durgapur", "jharkhand", "bihar", "odisha", "assam", "guwahati", "chhattisgarh"] },
    { region: "MUMBAI-2", keys: ["navi mumbai", "thane", "palghar"] },
    { region: "PUNE", keys: ["pune", "nashik", "aurangabad", "kolhapur", "satara"] },
    { region: "MUMBAI", keys: ["mumbai", "maharashtra"] }
  ];

  for (const rec of map) {
    if (rec.keys.some(k => text.includes(k))) {
      const region = state.regions.find(r => String(r.name || "").toUpperCase() === rec.region);
      if (region) return region.id;
    }
  }

  const selected = q("pa2Region") ? q("pa2Region").value : "";
  if (selected && selected !== ALL_REGION_VALUE) return selected;
  return state.regions[0] ? state.regions[0].id : "";
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
  window.location.href = "pa2_oem_manage.html";
}

function cancelEntry() {
  selectedPlanId = null;
  clearForm(false);
  setFormVisible(false);
  setStatus("Entry cancelled.", true);
}

function renderAll() {
  syncReviewControlValues();
  renderRegionSelector();
  renderRegionTabs();
  renderKpis();
  renderAccountTypeSnapshot();
  renderManagementView();
  renderPlanTable();
}

function renderRegionSelector() {
  const sel = q("pa2Region");
  const prev = sel.value;
  sel.innerHTML = "";

  sel.appendChild(opt(ALL_REGION_VALUE, "All Regions"));
  state.regions.forEach(r => sel.appendChild(opt(r.id, r.name)));

  if (Array.from(sel.options).some(o => o.value === prev)) {
    sel.value = prev;
  } else if (sel.options.length) {
    sel.value = ALL_REGION_VALUE;
  }
}

function renderRegionTabs() {
  const wrap = q("pa2RegionTabs");
  if (!wrap) return;
  const active = q("pa2Region").value;

  const allTab = `<button class="region-tab ${ALL_REGION_VALUE === active ? "active" : ""}" data-region-id="${ALL_REGION_VALUE}">All</button>`;
  const regionTabs = state.regions.map(r => (
    `<button class="region-tab ${r.id === active ? "active" : ""}" data-region-id="${esc(r.id)}">${esc(r.name)}</button>`
  )).join("");

  wrap.innerHTML = allTab + regionTabs;

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
  if (plan.regionId === ALL_REGION_VALUE) {
    setStatus("Select a specific region to save a plan.", false);
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
  const uniqueProducts = new Set(plans.flatMap(p => planProducts(p))).size;
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

function renderAccountTypeSnapshot() {
  const tbody = q("pa2AccountTypeRows");
  const totalRow = q("pa2AccountTypeTotal");
  if (!tbody || !totalRow) return;

  const plans = filteredPlans();
  const grouped = new Map();

  plans.forEach(plan => {
    const accountType = (plan.accountType || "OEM").toUpperCase().includes("DIRECT") ? "Direct Account" : "OEM";
    if (!grouped.has(accountType)) {
      grouped.set(accountType, {
        accounts: new Set(),
        forecast: 0,
        actual: 0
      });
    }

    const rec = grouped.get(accountType);
    rec.accounts.add((plan.oemName || "-").trim().toUpperCase());
    rec.forecast += num(plan.annualForecastCr);
    rec.actual += num(plan.annualActualCr);
  });

  const rows = Array.from(grouped.entries())
    .map(([type, rec]) => ({
      type,
      accounts: rec.accounts.size,
      forecast: rec.forecast,
      actual: rec.actual
    }))
    .sort((a, b) => b.accounts - a.accounts || a.type.localeCompare(b.type));

  const totalAccounts = rows.reduce((acc, r) => acc + r.accounts, 0);
  const totalForecast = rows.reduce((acc, r) => acc + r.forecast, 0);
  const totalActual = rows.reduce((acc, r) => acc + r.actual, 0);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No plans available for current region filter.</td></tr>`;
    totalRow.innerHTML = `<th>-</th><th>Total</th><th>0</th><th>0.0%</th><th>0.00</th><th>0.00</th>`;
    return;
  }

  tbody.innerHTML = rows.map((r, idx) => {
    const share = totalAccounts ? ((r.accounts / totalAccounts) * 100).toFixed(1) : "0.0";
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${esc(r.type)}</td>
        <td>${esc(String(r.accounts))}</td>
        <td>${esc(share)}%</td>
        <td>${esc(moneyCr(r.forecast))}</td>
        <td>${esc(moneyCr(r.actual))}</td>
      </tr>
    `;
  }).join("");

  totalRow.innerHTML = `
    <th>-</th>
    <th>Total</th>
    <th>${esc(String(totalAccounts))}</th>
    <th>100.0%</th>
    <th>${esc(moneyCr(totalForecast))}</th>
    <th>${esc(moneyCr(totalActual))}</th>
  `;
}

function renderPlanTable() {
  const rows = filteredAndSortedReviewPlans(filteredPlans());
  const tbody = q("pa2PlanRows");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="21" class="muted">No OEM plans match current review filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((p, idx) => {
    const selectedClass = p.id === selectedPlanId ? " style=\"background:#eef6ff;\"" : "";
    return `
      <tr data-id="${esc(p.id)}"${selectedClass}>
        <td>${idx + 1}</td>
        <td>${esc(regionName(p.regionId))}</td>
        <td>${esc(p.accountType || "-")}</td>
        <td>${esc(p.oemName || "-")}</td>
        <td>${esc(planProducts(p).join(", ") || "-")}</td>
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
    tr.addEventListener("click", () => openPlanManager(tr.dataset.id));
  });
}

function filteredAndSortedReviewPlans(baseRows) {
  const search = state.review.search.toLowerCase();

  const filtered = baseRows.filter(plan => {
    if (state.review.type !== "ALL") {
      const type = (plan.accountType || "").toUpperCase();
      if (state.review.type === "OEM" && !type.includes("OEM")) return false;
      if (state.review.type === "Direct" && !type.includes("DIRECT")) return false;
    }

    if (state.review.product !== "ALL") {
      if (!planProducts(plan).includes(state.review.product)) return false;
    }

    if (state.review.onboarding !== "ALL") {
      if ((plan.onboardingStatus || "Not Started") !== state.review.onboarding) return false;
    }

    if (search) {
      const hay = `${plan.oemName || ""} ${plan.focusStatus || ""} ${plan.nextSteps || ""}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }

    return true;
  });

  const sorted = filtered.slice().sort((a, b) => {
    const sortBy = state.review.sortBy;
    let cmp = 0;

    if (sortBy === "oemName") cmp = String(a.oemName || "").localeCompare(String(b.oemName || ""));
    else if (sortBy === "region") cmp = regionName(a.regionId).localeCompare(regionName(b.regionId));
    else if (sortBy === "forecast") cmp = num(a.annualForecastCr) - num(b.annualForecastCr);
    else if (sortBy === "actual") cmp = num(a.annualActualCr) - num(b.annualActualCr);
    else if (sortBy === "gap") cmp = (num(a.annualForecastCr) - num(a.annualActualCr)) - (num(b.annualForecastCr) - num(b.annualActualCr));
    else cmp = String(a.month || "").localeCompare(String(b.month || ""));

    if (cmp === 0) cmp = String(a.oemName || "").localeCompare(String(b.oemName || ""));
    return state.review.sortOrder === "asc" ? cmp : -cmp;
  });

  return sorted;
}

function renderManagementView() {
  const tbody = q("pa2MgmtRows");
  const totalRow = q("pa2MgmtTotalRow");
  if (!tbody || !totalRow) return;

  const selectedRegionId = q("pa2Region") ? q("pa2Region").value : "";
  const applyRegionFilter = selectedRegionId && selectedRegionId !== ALL_REGION_VALUE;

  const grouped = new Map();

  state.pa2Plans.forEach(plan => {
    if (applyRegionFilter && plan.regionId !== selectedRegionId) return;

    const products = planProducts(plan);
    products.forEach(product => {
      const key = `${plan.regionId}::${product}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          regionId: plan.regionId,
          product,
          oemSet: new Set(),
          forecast: 0,
          actual: 0
        });
      }

      const rec = grouped.get(key);
      rec.oemSet.add((plan.oemName || "").toUpperCase());
      rec.forecast += num(plan.annualForecastCr);
      rec.actual += num(plan.annualActualCr);
    });
  });

  const rows = Array.from(grouped.values()).sort((a, b) => {
    const regionCmp = regionName(a.regionId).localeCompare(regionName(b.regionId));
    if (regionCmp !== 0) return regionCmp;
    return String(a.product || "").localeCompare(String(b.product || ""));
  });

  tbody.innerHTML = rows.map(r => {
    const count = r.oemSet.size;
    const status = forecastStatus(r.forecast, r.actual);
    return `
      <tr>
        <td>${esc(regionName(r.regionId))}</td>
        <td>${esc(r.product || "-")}</td>
        <td>${esc(String(count))}</td>
        <td>${esc(moneyCr(r.forecast))}</td>
        <td>${esc(moneyCr(r.actual))}</td>
        <td><span class="mgmt-status ${status.className}">${esc(status.label)}</span></td>
      </tr>
    `;
  }).join("");

  const totalCount = rows.reduce((acc, r) => acc + r.oemSet.size, 0);
  const totalForecast = rows.reduce((acc, r) => acc + num(r.forecast), 0);
  const totalActual = rows.reduce((acc, r) => acc + num(r.actual), 0);
  const totalStatus = forecastStatus(totalForecast, totalActual);

  totalRow.innerHTML = `
    <th>Total</th>
    <th>All Products</th>
    <th>${esc(String(totalCount))}</th>
    <th>${esc(moneyCr(totalForecast))}</th>
    <th>${esc(moneyCr(totalActual))}</th>
    <th><span class="mgmt-status ${totalStatus.className}">${esc(totalStatus.label)}</span></th>
  `;
}

function forecastStatus(forecast, actual) {
  const f = num(forecast);
  const a = num(actual);
  if (f <= 0) return { label: "No Plan", className: "status-noplan" };
  const ratio = a / f;
  if (ratio >= 1) return { label: "On Track", className: "status-good" };
  if (ratio >= 0.75) return { label: "Watch", className: "status-watch" };
  return { label: "At Risk", className: "status-risk" };
}

function openPlanManager(planId) {
  window.location.href = `pa2_oem_manage.html?planId=${encodeURIComponent(planId)}`;
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
    .filter(p => regionId === ALL_REGION_VALUE || p.regionId === regionId)
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

function planProducts(plan) {
  if (Array.isArray(plan.products) && plan.products.length) return plan.products;
  if (plan.product) return [plan.product];
  return [];
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
