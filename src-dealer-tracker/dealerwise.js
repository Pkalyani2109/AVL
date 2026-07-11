const STORAGE_KEY = "dealer-growth-tracker-v1";
const PRODUCTS = ["PA", "BV", "QTA", "PV", "ASV"];

const state = {
  regions: [],
  dealers: [],
  monthly: [],
  accounts: []
};

(function init() {
  hydrate();
  bindEvents();
  initDefaults();
  renderSelectors();
  renderAll();
})();

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.regions = parsed.regions || [];
    state.dealers = parsed.dealers || [];
    state.monthly = parsed.monthly || [];
    state.accounts = parsed.accounts || [];
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

  base.regions = state.regions;
  base.dealers = state.dealers;
  base.monthly = state.monthly;
  base.accounts = state.accounts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
}

function bindEvents() {
  q("dwRegion").addEventListener("change", () => {
    renderDealersByRegion();
    renderAll();
  });
  q("dwDealer").addEventListener("change", () => {
    syncSalesEngineerInput();
    renderAll();
  });
  q("dwMonth").addEventListener("change", renderAll);
  q("btnDwSaveProducts").addEventListener("click", saveProductRows);
  q("btnDwAddAccount").addEventListener("click", addPaAccount);
  q("btnDwSaveEngineer").addEventListener("click", saveSalesEngineerMapping);
}

function initDefaults() {
  if (!q("dwMonth").value) {
    q("dwMonth").value = new Date().toISOString().slice(0, 7);
  }
}

function renderSelectors() {
  const regionSel = q("dwRegion");
  regionSel.innerHTML = "";
  state.regions.forEach(r => regionSel.appendChild(opt(r.id, r.name)));
  if (!regionSel.value && state.regions[0]) regionSel.value = state.regions[0].id;

  renderDealersByRegion();
}

function renderDealersByRegion() {
  const regionId = q("dwRegion").value;
  const dealerSel = q("dwDealer");
  const prev = dealerSel.value;
  dealerSel.innerHTML = "";

  state.dealers
    .filter(d => d.regionId === regionId)
    .forEach(d => dealerSel.appendChild(opt(d.id, d.name)));

  if (Array.from(dealerSel.options).some(o => o.value === prev)) {
    dealerSel.value = prev;
  } else if (dealerSel.options[0]) {
    dealerSel.value = dealerSel.options[0].value;
  }
}

function renderAll() {
  syncSalesEngineerInput();
  renderContext();
  renderProductRows();
  renderPaAccounts();
}

function syncSalesEngineerInput() {
  const dealer = selectedDealer();
  const input = q("dwSalesEngineer");
  if (!input) return;
  input.value = dealer && dealer.salesEngineer ? dealer.salesEngineer : "";
}

function saveSalesEngineerMapping() {
  const dealer = selectedDealer();
  if (!dealer) return;
  const engineer = q("dwSalesEngineer").value.trim();

  state.dealers = state.dealers.map(d => {
    if (d.id !== dealer.id) return d;
    return { ...d, salesEngineer: engineer };
  });

  persist();
  renderAll();
}

function renderContext() {
  const dealer = selectedDealer();
  const region = selectedRegion();
  const engineer = dealer && dealer.salesEngineer ? dealer.salesEngineer : "Not assigned";
  q("dwContext").textContent = dealer
    ? `Region: ${region ? region.name : "-"} | Dealer: ${dealer.name} | Janatics Sales Engineer: ${engineer}`
    : "Select a dealer to manage product-wise business.";
}

function renderProductRows() {
  const month = q("dwMonth").value;
  const dealer = selectedDealer();
  const region = selectedRegion();
  const tbody = q("dwProductRows");
  tbody.innerHTML = "";
  if (!dealer || !region) return;

  PRODUCTS.forEach(product => {
    const rec = state.monthly.find(r =>
      r.month === month &&
      r.regionId === region.id &&
      r.dealerId === dealer.id &&
      r.product === product
    );

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(product)}</td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="potential" value="${num(rec && rec.potential)}" /></td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="forecast" value="${num(rec && rec.forecast)}" /></td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="actual" value="${num(rec && rec.actual)}" /></td>
      <td><input type="number" min="0" step="1" data-product="${esc(product)}" data-field="oppCount" value="${intNum(rec && rec.oppCount)}" /></td>
    `;
    tbody.appendChild(tr);
  });
}

function saveProductRows() {
  const dealer = selectedDealer();
  const region = selectedRegion();
  const month = q("dwMonth").value;
  if (!dealer || !region || !month) return;

  PRODUCTS.forEach(product => {
    const potential = num(valFor(product, "potential"));
    const forecast = num(valFor(product, "forecast"));
    const actual = num(valFor(product, "actual"));
    const oppCount = intNum(valFor(product, "oppCount"));

    state.monthly = state.monthly.filter(r => !(
      r.month === month &&
      r.regionId === region.id &&
      r.dealerId === dealer.id &&
      r.product === product
    ));

    state.monthly.push({
      id: crypto.randomUUID(),
      month,
      regionId: region.id,
      dealerId: dealer.id,
      product,
      potential,
      forecast,
      actual,
      oppCount
    });
  });

  persist();
  renderAll();
}

function addPaAccount() {
  const dealer = selectedDealer();
  const region = selectedRegion();
  const month = q("dwMonth").value;
  const account = q("dwAccountName").value.trim();
  if (!dealer || !region || !month || !account) return;

  state.accounts.push({
    id: crypto.randomUUID(),
    month,
    regionId: region.id,
    dealerId: dealer.id,
    account,
    product: "PA",
    potential: num(q("dwAccountPotential").value),
    forecast: num(q("dwAccountForecast").value),
    stage: q("dwAccountStage").value
  });

  q("dwAccountName").value = "";
  q("dwAccountPotential").value = "";
  q("dwAccountForecast").value = "";
  persist();
  renderPaAccounts();
}

function renderPaAccounts() {
  const dealer = selectedDealer();
  const region = selectedRegion();
  const month = q("dwMonth").value;
  const tbody = q("dwAccountRows");
  tbody.innerHTML = "";
  if (!dealer || !region) return;

  const rows = state.accounts.filter(a =>
    a.month === month &&
    a.regionId === region.id &&
    a.dealerId === dealer.id &&
    a.product === "PA"
  );

  tbody.innerHTML = rows.map(a => `
    <tr>
      <td>${esc(a.month)}</td>
      <td>${esc(dealer.name)}</td>
      <td>${esc(dealer.salesEngineer || "-")}</td>
      <td>${esc(a.account)}</td>
      <td>${esc(a.product)}</td>
      <td>${esc(num(a.potential).toLocaleString("en-IN"))}</td>
      <td>${esc(num(a.forecast).toLocaleString("en-IN"))}</td>
      <td>${esc(a.stage)}</td>
    </tr>
  `).join("");
}

function selectedRegion() {
  return state.regions.find(r => r.id === q("dwRegion").value) || null;
}

function selectedDealer() {
  return state.dealers.find(d => d.id === q("dwDealer").value) || null;
}

function valFor(product, field) {
  const el = document.querySelector(`input[data-product='${product}'][data-field='${field}']`);
  return el ? el.value : "0";
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

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
