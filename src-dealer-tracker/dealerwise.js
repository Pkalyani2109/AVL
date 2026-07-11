const STORAGE_KEY = "dealer-growth-tracker-v1";
const PRODUCTS = ["PA", "BV", "QTA", "PV", "ASV"];
const PRODUCT_LABELS = {
  PA: "BFV - Butterfly Valve",
  BV: "BV - Ball Valve",
  QTA: "QTA - Quarter Turn Actuator",
  PV: "PV - Pulse Valve",
  ASV: "ASV - Angle Seat Valve"
};

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
  q("dwMonth").addEventListener("change", () => {
    q("dwQuarter").value = quarterFromMonth(q("dwMonth").value);
    renderAll();
  });
  q("btnDwSaveProducts").addEventListener("click", saveProductRows);
  q("btnDwAddAccount").addEventListener("click", addPaAccount);
  q("btnDwSaveEngineer").addEventListener("click", saveSalesEngineerMapping);

  const importBtn = q("btnDwImportData");
  const importInput = q("dwImportFileInput");
  q("btnDwDownloadTemplate").addEventListener("click", downloadDealerTemplate);
  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", importDealerCsv);
}

function initDefaults() {
  if (!q("dwMonth").value) {
    q("dwMonth").value = new Date().toISOString().slice(0, 7);
  }
  q("dwQuarter").value = quarterFromMonth(q("dwMonth").value);
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
  renderQuarterSummary();
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
    ? `Region: ${region ? region.name : "-"} | Dealer: ${dealer.name} | Month: ${q("dwMonth").value} | Quarter: ${quarterFromMonth(q("dwMonth").value)} | Janatics Sales Engineer: ${engineer}`
    : "Select a dealer to manage product-wise business.";
}

function renderProductRows() {
  const month = q("dwMonth").value;
  const dealer = selectedDealer();
  const region = selectedRegion();
  const tbody = q("dwProductRows");
  tbody.innerHTML = "";
  if (!dealer || !region) return;

  let totalPotential = 0;
  let totalForecast = 0;
  let totalActual = 0;
  let totalOppCount = 0;

  PRODUCTS.forEach(product => {
    const rec = state.monthly.find(r =>
      r.month === month &&
      r.regionId === region.id &&
      r.dealerId === dealer.id &&
      r.product === product
    );

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(productLabel(product))}</td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="potential" value="${num(rec && rec.potential)}" /></td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="forecast" value="${num(rec && rec.forecast)}" /></td>
      <td><input type="number" min="0" step="0.01" data-product="${esc(product)}" data-field="actual" value="${num(rec && rec.actual)}" /></td>
      <td><input type="number" min="0" step="1" data-product="${esc(product)}" data-field="oppCount" value="${intNum(rec && rec.oppCount)}" /></td>
    `;
    tbody.appendChild(tr);

    totalPotential += num(rec && rec.potential);
    totalForecast += num(rec && rec.forecast);
    totalActual += num(rec && rec.actual);
    totalOppCount += intNum(rec && rec.oppCount);
  });

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td><strong>${esc(lakh(totalPotential))}</strong></td>
    <td><strong>${esc(lakh(totalForecast))}</strong></td>
    <td><strong>${esc(lakh(totalActual))}</strong></td>
    <td><strong>${esc(String(totalOppCount))}</strong></td>
  `;
  tbody.appendChild(totalRow);
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

  const totalPotential = rows.reduce((sum, row) => sum + num(row.potential), 0);
  const totalForecast = rows.reduce((sum, row) => sum + num(row.forecast), 0);

  tbody.innerHTML = rows.map(a => `
    <tr>
      <td>${esc(a.month)}</td>
      <td>${esc(quarterFromMonth(a.month))}</td>
      <td>${esc(dealer.name)}</td>
      <td>${esc(dealer.salesEngineer || "-")}</td>
      <td>${esc(a.account)}</td>
      <td>${esc(productLabel(a.product))}</td>
      <td>${esc(lakh(a.potential))}</td>
      <td>${esc(lakh(a.forecast))}</td>
      <td>${esc(a.stage)}</td>
    </tr>
  `).join("") + `
    <tr>
      <td><strong>Total</strong></td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td><strong>${esc(String(rows.length))} Accounts</strong></td>
      <td>${esc(productLabel("PA"))}</td>
      <td><strong>${esc(lakh(totalPotential))}</strong></td>
      <td><strong>${esc(lakh(totalForecast))}</strong></td>
      <td>-</td>
    </tr>
  `;
}

function renderQuarterSummary() {
  const dealer = selectedDealer();
  const region = selectedRegion();
  const quarter = quarterFromMonth(q("dwMonth").value);
  const tbody = q("dwQuarterRows");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!dealer || !region) return;

  const grouped = new Map();
  state.monthly
    .filter(r => r.regionId === region.id && r.dealerId === dealer.id && quarterFromMonth(r.month) === quarter)
    .forEach(r => {
      if (!grouped.has(r.product)) {
        grouped.set(r.product, { product: r.product, potential: 0, forecast: 0, actual: 0, oppCount: 0 });
      }
      const g = grouped.get(r.product);
      g.potential += num(r.potential);
      g.forecast += num(r.forecast);
      g.actual += num(r.actual);
      g.oppCount += intNum(r.oppCount);
    });

  let totalPotential = 0;
  let totalForecast = 0;
  let totalActual = 0;
  let totalOppCount = 0;

  PRODUCTS.forEach(product => {
    const g = grouped.get(product) || { product, potential: 0, forecast: 0, actual: 0, oppCount: 0 };
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(quarter)}</td>
      <td>${esc(productLabel(g.product))}</td>
      <td>${esc(lakh(g.potential))}</td>
      <td>${esc(lakh(g.forecast))}</td>
      <td>${esc(lakh(g.actual))}</td>
      <td>${esc(String(g.oppCount))}</td>
    `;
    tbody.appendChild(tr);

    totalPotential += num(g.potential);
    totalForecast += num(g.forecast);
    totalActual += num(g.actual);
    totalOppCount += intNum(g.oppCount);
  });

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td>-</td>
    <td><strong>${esc(lakh(totalPotential))}</strong></td>
    <td><strong>${esc(lakh(totalForecast))}</strong></td>
    <td><strong>${esc(lakh(totalActual))}</strong></td>
    <td><strong>${esc(String(totalOppCount))}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

function quarterFromMonth(monthValue) {
  if (!monthValue || monthValue.length < 7) return "-";
  const m = Number(monthValue.slice(5, 7));
  if (m >= 4 && m <= 6) return "Q1";
  if (m >= 7 && m <= 9) return "Q2";
  if (m >= 10 && m <= 12) return "Q3";
  return "Q4";
}

function productLabel(code) {
  return PRODUCT_LABELS[code] || code;
}

function normalizeProduct(value) {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return "PA";
  if (text.startsWith("PA") || text.startsWith("BFV") || text.includes("PROCESS") || text.includes("BUTTERFLY")) return "PA";
  if (text.startsWith("BV") || text.includes("BALL")) return "BV";
  if (text.startsWith("QTA") || text.includes("QUARTER")) return "QTA";
  if (text.startsWith("PV") || text.includes("PULSE")) return "PV";
  if (text.startsWith("ASV") || text.includes("ANGLE")) return "ASV";
  return PRODUCTS.includes(text) ? text : "PA";
}

function normalizeMonth(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.slice(0, 7);
  return "";
}

function csvEscape(value) {
  const text = String(value == null ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  out.push(current);
  return out;
}

function setImportStatus(message, ok) {
  const el = q("dwImportStatus");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function downloadDealerTemplate() {
  const month = q("dwMonth").value || new Date().toISOString().slice(0, 7);
  const region = selectedRegion();
  const dealer = selectedDealer();
  const rowsPerProduct = 10;

  const header = [
    "month",
    "region",
    "dealer",
    "salesEngineer",
    "product",
    "keyAccount",
    "potentialL",
    "forecastL",
    "affinity",
    "affinityExplanation",
    "stage"
  ];

  const rows = [header];
  PRODUCTS.forEach(product => {
    for (let i = 1; i <= rowsPerProduct; i += 1) {
      rows.push([
        month,
        region ? region.name : "",
        dealer ? dealer.name : "",
        dealer && dealer.salesEngineer ? dealer.salesEngineer : "",
        productLabel(product),
        `${product.replace(/[^A-Z]/g, "")} Account ${String(i).padStart(2, "0")}`,
        "0",
        "0",
        dealer && dealer.affinity ? dealer.affinity : "Medium",
        dealer && dealer.affinityReason ? dealer.affinityReason : "Strong fit for local process-valve demand",
        "Prospect"
      ]);
    }
  });

  const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dealer_data_template_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  setImportStatus("Template downloaded with 10 prefilled account rows per product. Fill in Excel and upload CSV.", true);
}

function ensureRegion(regionName) {
  const name = String(regionName || "").trim();
  if (!name) return null;
  const found = state.regions.find(r => r.name.toUpperCase() === name.toUpperCase());
  if (found) return found;
  const rec = { id: crypto.randomUUID(), name };
  state.regions.push(rec);
  return rec;
}

function ensureDealer(regionId, dealerName) {
  const name = String(dealerName || "").trim();
  if (!regionId || !name) return null;
  const found = state.dealers.find(d => d.regionId === regionId && d.name.toUpperCase() === name.toUpperCase());
  if (found) return found;
  const rec = {
    id: crypto.randomUUID(),
    regionId,
    name,
    city: "",
    person: "",
    mobile: "",
    email: "",
    affinity: "Medium"
  };
  state.dealers.push(rec);
  return rec;
}

function importDealerCsv(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV has no data rows");

      const header = parseCsvLine(lines[0]).map(h => String(h || "").trim());
      const idx = key => header.indexOf(key);
      const req = ["month", "region", "dealer"];
      if (req.some(k => idx(k) < 0)) throw new Error("Missing required columns: month, region, dealer");

      let monthlyCount = 0;
      let accountCount = 0;
      let dealerCount = 0;

      for (let i = 1; i < lines.length; i += 1) {
        const row = parseCsvLine(lines[i]);
        const get = key => {
          const j = idx(key);
          return j >= 0 ? String(row[j] || "").trim() : "";
        };

        const month = normalizeMonth(get("month"));
        const regionName = get("region");
        const dealerName = get("dealer");
        if (!month || !regionName || !dealerName) continue;

        const region = ensureRegion(regionName);
        const dealer = ensureDealer(region.id, dealerName);
        if (!dealer) continue;
        dealerCount += 1;

        const salesEngineer = get("salesEngineer");
        if (salesEngineer) dealer.salesEngineer = salesEngineer;

        const affinity = get("affinity");
        if (affinity) dealer.affinity = affinity;
        const affinityExplanation = get("affinityExplanation");
        if (affinityExplanation) dealer.affinityReason = affinityExplanation;

        const product = normalizeProduct(get("product"));
        const potential = num(get("potentialL"));
        const forecast = num(get("forecastL"));
        const actual = num(get("actualL"));
        const oppCount = intNum(get("oppCount"));
        const hasMonthly = ["potentialL", "forecastL", "actualL", "oppCount"].some(key => get(key) !== "");

        if (hasMonthly) {
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
          monthlyCount += 1;
        }

        const accountName = get("keyAccount") || get("accountName");
        if (accountName) {
          const accountPotential = get("accountPotentialL") !== "" ? num(get("accountPotentialL")) : potential;
          const accountForecast = get("accountForecastL") !== "" ? num(get("accountForecastL")) : forecast;
          const accountStage = get("stage") || get("accountStage") || "Prospect";

          state.accounts = state.accounts.filter(a => !(
            a.month === month &&
            a.regionId === region.id &&
            a.dealerId === dealer.id &&
            a.account.toUpperCase() === accountName.toUpperCase() &&
            a.product === "PA"
          ));

          state.accounts.push({
            id: crypto.randomUUID(),
            month,
            regionId: region.id,
            dealerId: dealer.id,
            account: accountName,
            product: "PA",
            potential: accountPotential,
            forecast: accountForecast,
            stage: accountStage
          });
          accountCount += 1;
        }
      }

      persist();
      renderSelectors();
      renderAll();
      setImportStatus(`Import successful: ${dealerCount} dealer rows, ${monthlyCount} monthly records, ${accountCount} BFV key accounts.`, true);
    } catch (err) {
      console.error(err);
      setImportStatus("Import failed. Please use the downloaded template and upload CSV format.", false);
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

function lakh(v) {
  return `${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
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
