const STORAGE_KEY = "dealer-growth-tracker-v1";

const state = {
  unlocked: false,
  session: null,
  cognito: null,
  regions: [
    { id: crypto.randomUUID(), name: "South" },
    { id: crypto.randomUUID(), name: "West" }
  ],
  dealers: [
    { id: crypto.randomUUID(), regionId: null, name: "ABC Pneumatics", city: "Chennai" },
    { id: crypto.randomUUID(), regionId: null, name: "Flow Control Hub", city: "Pune" }
  ],
  monthly: [],
  supports: [],
  accounts: [],
  activities: []
};

(function init() {
  hydrate();
  normalizeSeedDealers();
  bindEvents();
  ensureDefaults();
  renderAll();
  loadCognitoConfig();
})();

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch (err) {
    console.error("Failed to parse stored data", err);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeSeedDealers() {
  if (!state.regions.length || !state.dealers.length) return;
  const first = state.regions[0].id;
  state.dealers = state.dealers.map((d, idx) => {
    if (d.regionId) return d;
    const region = state.regions[idx % state.regions.length];
    return { ...d, regionId: region.id || first };
  });
}

function ensureDefaults() {
  const monthEl = q("filterMonth");
  const entryMonth = q("entryMonth");
  const supportMonth = q("supportMonth");
  const accountMonth = q("accountMonth");
  const activityMonth = q("activityMonth");
  const nowMonth = new Date().toISOString().slice(0, 7);

  if (!monthEl.value) monthEl.value = nowMonth;
  if (!entryMonth.value) entryMonth.value = nowMonth;
  if (!supportMonth.value) supportMonth.value = nowMonth;
  if (!accountMonth.value) accountMonth.value = nowMonth;
  if (!activityMonth.value) activityMonth.value = nowMonth;
}

function bindEvents() {
  q("btnRequestCode").addEventListener("click", requestCode);
  q("btnVerifyCode").addEventListener("click", verifyCode);
  q("btnDemoUnlock").addEventListener("click", demoUnlock);

  ["filterMonth", "filterRegion", "filterDealer", "filterProduct"].forEach(id => {
    q(id).addEventListener("change", renderAll);
  });

  q("btnAddRegion").addEventListener("click", addRegion);
  q("btnAddDealer").addEventListener("click", addDealer);
  q("btnSaveForecast").addEventListener("click", saveForecast);
  q("btnSaveSupport").addEventListener("click", saveSupport);
  q("btnSaveAccount").addEventListener("click", saveAccount);
  q("btnSaveActivity").addEventListener("click", saveActivity);

  q("entryRegion").addEventListener("change", () => syncDealerByRegion("entryRegion", "entryDealer"));
  q("supportRegion").addEventListener("change", () => syncDealerByRegion("supportRegion", "supportDealer"));
  q("accountRegion").addEventListener("change", () => syncDealerByRegion("accountRegion", "accountDealer"));
  q("activityRegion").addEventListener("change", () => syncDealerByRegion("activityRegion", "activityDealer"));

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });
}

async function loadCognitoConfig() {
  try {
    const res = await fetch("cognito-config.json", { cache: "no-store" });
    if (!res.ok) return;
    state.cognito = await res.json();
  } catch (_err) {
    state.cognito = null;
  }
}

function setUnlocked(value, message) {
  state.unlocked = value;
  const status = q("authStatus");
  status.textContent = message;
  status.className = value ? "status ok" : "status";
  persist();
}

function demoUnlock() {
  setUnlocked(true, "Demo mode unlocked. Data entry enabled.");
}

async function requestCode() {
  const email = q("authEmail").value.trim();
  if (!email) {
    setUnlocked(false, "Enter email first.");
    return;
  }

  if (!state.cognito || !state.cognito.customAuthFlow) {
    setUnlocked(false, "Cognito config not found. Use Demo Unlock or add cognito-config.json.");
    return;
  }

  try {
    const payload = {
      AuthFlow: "CUSTOM_AUTH",
      ClientId: state.cognito.appClientId,
      AuthParameters: {
        USERNAME: email
      }
    };

    const resp = await cognitoPost("InitiateAuth", payload);
    state.session = resp.Session || null;
    persist();
    setUnlocked(false, "Code requested. Check email and verify.");
  } catch (err) {
    setUnlocked(false, "Code request failed. Confirm Cognito setup.");
    console.error(err);
  }
}

async function verifyCode() {
  const email = q("authEmail").value.trim();
  const code = q("authCode").value.trim();

  if (!email || !code) {
    setUnlocked(false, "Enter email and code.");
    return;
  }

  if (!state.cognito || !state.cognito.customAuthFlow) {
    setUnlocked(false, "Cognito config not found. Use Demo Unlock or add cognito-config.json.");
    return;
  }

  try {
    const challengeKey = state.cognito.codeParameterName || "code";
    const payload = {
      ClientId: state.cognito.appClientId,
      ChallengeName: state.cognito.customChallengeName || "CUSTOM_CHALLENGE",
      Session: state.session,
      ChallengeResponses: {
        USERNAME: email,
        [challengeKey]: code
      }
    };

    const resp = await cognitoPost("RespondToAuthChallenge", payload);
    if (resp.AuthenticationResult) {
      setUnlocked(true, "Authenticated with Cognito.");
    } else {
      setUnlocked(false, "Verification pending or failed.");
    }
  } catch (err) {
    setUnlocked(false, "Verification failed. Check code or Cognito challenge lambda.");
    console.error(err);
  }
}

async function cognitoPost(target, body) {
  const region = state.cognito.region;
  const url = `https://cognito-idp.${region}.amazonaws.com/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Cognito ${target} failed`);
  }
  return data;
}

function requireUnlock() {
  if (state.unlocked) return true;
  setUnlocked(false, "Locked. Authenticate or use Demo Unlock.");
  return false;
}

function addRegion() {
  if (!requireUnlock()) return;
  const name = q("regionName").value.trim();
  if (!name) return;
  state.regions.push({ id: crypto.randomUUID(), name });
  q("regionName").value = "";
  persist();
  renderAll();
}

function addDealer() {
  if (!requireUnlock()) return;
  const name = q("dealerName").value.trim();
  const city = q("dealerCity").value.trim();
  const regionId = q("entryRegion").value || (state.regions[0] && state.regions[0].id);
  if (!name || !regionId) return;

  state.dealers.push({ id: crypto.randomUUID(), regionId, name, city });
  q("dealerName").value = "";
  q("dealerCity").value = "";
  persist();
  renderAll();
}

function saveForecast() {
  if (!requireUnlock()) return;

  const rec = {
    id: crypto.randomUUID(),
    month: q("entryMonth").value,
    regionId: q("entryRegion").value,
    dealerId: q("entryDealer").value,
    product: q("entryProduct").value,
    potential: num(q("entryPotential").value),
    forecast: num(q("entryForecast").value),
    actual: num(q("entryActual").value),
    oppCount: intNum(q("entryOppCount").value)
  };

  state.monthly = state.monthly.filter(r => !(
    r.month === rec.month &&
    r.regionId === rec.regionId &&
    r.dealerId === rec.dealerId &&
    r.product === rec.product
  ));

  state.monthly.push(rec);
  persist();
  renderAll();
}

function saveSupport() {
  if (!requireUnlock()) return;
  const rec = {
    id: crypto.randomUUID(),
    month: q("supportMonth").value,
    regionId: q("supportRegion").value,
    dealerId: q("supportDealer").value,
    text: q("supportText").value.trim()
  };
  if (!rec.text) return;

  state.supports = state.supports.filter(r => !(
    r.month === rec.month && r.regionId === rec.regionId && r.dealerId === rec.dealerId
  ));
  state.supports.push(rec);
  q("supportText").value = "";
  persist();
  renderAll();
}

function saveAccount() {
  if (!requireUnlock()) return;
  const rec = {
    id: crypto.randomUUID(),
    month: q("accountMonth").value,
    regionId: q("accountRegion").value,
    dealerId: q("accountDealer").value,
    account: q("accountName").value.trim(),
    product: q("accountProduct").value,
    potential: num(q("accountPotential").value),
    forecast: num(q("accountForecast").value),
    stage: q("accountStage").value
  };
  if (!rec.account) return;
  state.accounts.push(rec);
  q("accountName").value = "";
  persist();
  renderAll();
}

function saveActivity() {
  if (!requireUnlock()) return;
  const rec = {
    id: crypto.randomUUID(),
    month: q("activityMonth").value,
    regionId: q("activityRegion").value,
    dealerId: q("activityDealer").value,
    visitPlan: intNum(q("visitPlan").value),
    visitDone: intNum(q("visitDone").value),
    expoAttended: intNum(q("expoAttended").value),
    expoHosted: intNum(q("expoHosted").value)
  };

  state.activities = state.activities.filter(r => !(
    r.month === rec.month && r.regionId === rec.regionId && r.dealerId === rec.dealerId
  ));

  state.activities.push(rec);
  persist();
  renderAll();
}

function activateTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
}

function renderAll() {
  fillRegionDealerSelects();
  renderKpis();
  renderMonthlyTable();
  renderAccountsTable();
}

function fillRegionDealerSelects() {
  const regionSelectIds = [
    "filterRegion", "entryRegion", "supportRegion", "accountRegion", "activityRegion"
  ];

  regionSelectIds.forEach(id => {
    const sel = q(id);
    const prev = sel.value;
    sel.innerHTML = "";
    if (id === "filterRegion") {
      sel.appendChild(opt("ALL", "All Regions"));
    }
    state.regions.forEach(r => sel.appendChild(opt(r.id, r.name)));
    if (Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
  });

  const map = [
    ["filterRegion", "filterDealer", true],
    ["entryRegion", "entryDealer", false],
    ["supportRegion", "supportDealer", false],
    ["accountRegion", "accountDealer", false],
    ["activityRegion", "activityDealer", false]
  ];
  map.forEach(([r, d, all]) => syncDealerByRegion(r, d, all));
}

function syncDealerByRegion(regionSelectId, dealerSelectId, includeAll) {
  const regionId = q(regionSelectId).value;
  const dealerSelect = q(dealerSelectId);
  const prev = dealerSelect.value;
  dealerSelect.innerHTML = "";

  if (includeAll) {
    dealerSelect.appendChild(opt("ALL", "All Dealers"));
  }

  const dealers = state.dealers.filter(d => regionId === "ALL" || d.regionId === regionId);
  dealers.forEach(d => dealerSelect.appendChild(opt(d.id, `${d.name} (${d.city || "-"})`)));

  if (Array.from(dealerSelect.options).some(o => o.value === prev)) {
    dealerSelect.value = prev;
  }
}

function renderKpis() {
  const filtered = filteredMonthly();
  const totalPotential = sum(filtered.map(r => r.potential));
  const totalForecast = sum(filtered.map(r => r.forecast));
  const totalActual = sum(filtered.map(r => r.actual));
  const totalOpp = sum(filtered.map(r => r.oppCount));
  const hitRate = totalForecast > 0 ? (totalActual / totalForecast) * 100 : 0;

  const currentSupports = filteredSupports();
  const activity = filteredActivities();
  const visitPlan = sum(activity.map(a => a.visitPlan));
  const visitDone = sum(activity.map(a => a.visitDone));

  const cards = [
    ["Potential", money(totalPotential)],
    ["Forecast", money(totalForecast)],
    ["Actual", money(totalActual)],
    ["Forecast Hit %", `${hitRate.toFixed(1)}%`],
    ["Open Opp (count)", String(totalOpp)],
    ["Support Open", String(currentSupports.length)],
    ["Visit Plan", String(visitPlan)],
    ["Visit Done", String(visitDone)]
  ];

  const root = q("kpiGrid");
  root.innerHTML = cards.map(([label, value]) => (
    `<div class="kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`
  )).join("");
}

function renderMonthlyTable() {
  const rows = filteredMonthly().map(r => {
    const support = state.supports.find(s => s.month === r.month && s.regionId === r.regionId && s.dealerId === r.dealerId);
    const gap = r.forecast - r.actual;
    return {
      month: r.month,
      region: regionName(r.regionId),
      dealer: dealerName(r.dealerId),
      product: r.product,
      potential: money(r.potential),
      forecast: money(r.forecast),
      actual: money(r.actual),
      gap: money(gap),
      opp: String(r.oppCount),
      support: support ? support.text : "-"
    };
  });

  q("reviewRows").innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.month)}</td>
      <td>${esc(r.region)}</td>
      <td>${esc(r.dealer)}</td>
      <td>${esc(r.product)}</td>
      <td>${esc(r.potential)}</td>
      <td>${esc(r.forecast)}</td>
      <td>${esc(r.actual)}</td>
      <td>${esc(r.gap)}</td>
      <td>${esc(r.opp)}</td>
      <td>${esc(r.support)}</td>
    </tr>
  `).join("");
}

function renderAccountsTable() {
  const month = q("filterMonth").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;
  const product = q("filterProduct").value;

  const rows = state.accounts.filter(a => {
    if (month && a.month !== month) return false;
    if (region && region !== "ALL" && a.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && a.dealerId !== dealer) return false;
    if (product && product !== "ALL" && a.product !== product) return false;
    return true;
  });

  q("accountRows").innerHTML = rows.map(a => `
    <tr>
      <td>${esc(a.month)}</td>
      <td>${esc(regionName(a.regionId))}</td>
      <td>${esc(dealerName(a.dealerId))}</td>
      <td>${esc(a.account)}</td>
      <td>${esc(a.product)}</td>
      <td>${esc(money(a.potential))}</td>
      <td>${esc(money(a.forecast))}</td>
      <td>${esc(a.stage)}</td>
    </tr>
  `).join("");
}

function filteredMonthly() {
  const month = q("filterMonth").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;
  const product = q("filterProduct").value;

  return state.monthly.filter(r => {
    if (month && r.month !== month) return false;
    if (region && region !== "ALL" && r.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && r.dealerId !== dealer) return false;
    if (product && product !== "ALL" && r.product !== product) return false;
    return true;
  });
}

function filteredSupports() {
  const month = q("filterMonth").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;

  return state.supports.filter(s => {
    if (month && s.month !== month) return false;
    if (region && region !== "ALL" && s.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && s.dealerId !== dealer) return false;
    return true;
  });
}

function filteredActivities() {
  const month = q("filterMonth").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;

  return state.activities.filter(a => {
    if (month && a.month !== month) return false;
    if (region && region !== "ALL" && a.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && a.dealerId !== dealer) return false;
    return true;
  });
}

function regionName(id) {
  const rec = state.regions.find(r => r.id === id);
  return rec ? rec.name : "-";
}

function dealerName(id) {
  const rec = state.dealers.find(d => d.id === id);
  return rec ? rec.name : "-";
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

function sum(arr) {
  return arr.reduce((a, b) => a + Number(b || 0), 0);
}

function money(v) {
  return Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
