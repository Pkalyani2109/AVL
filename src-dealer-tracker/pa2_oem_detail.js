const STORAGE_KEY = "dealer-growth-tracker-v1";

const state = {
  regions: [],
  pa2Plans: [],
  collapsedProducts: new Set(),
  controls: {
    region: "ALL",
    product: "ALL",
    status: "ALL",
    search: "",
    groupBy: "product-region",
    sortBy: "product-asc"
  }
};

const PIE_COLORS = ["#0a5da8", "#c7922f", "#1f8f4d", "#7a4cb1", "#1b728f", "#d2691e", "#4d5b74", "#8f3b69"];

(function init() {
  hydrate();
  bindEvents();
  populateFilterOptions();
  renderAll();
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

function bindEvents() {
  bindChange("detailFilterRegion", value => {
    state.controls.region = value;
    renderAll();
  });

  bindChange("detailFilterProduct", value => {
    state.controls.product = value;
    renderAll();
  });

  bindChange("detailFilterStatus", value => {
    state.controls.status = value;
    renderAll();
  });

  bindChange("detailGroupBy", value => {
    state.controls.groupBy = value;
    renderAll();
  });

  bindChange("detailSortBy", value => {
    state.controls.sortBy = value;
    renderAll();
  });

  const searchEl = document.getElementById("detailSearchOem");
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      state.controls.search = searchEl.value.trim().toLowerCase();
      renderAll();
    });
  }
}

function bindChange(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", () => handler(el.value));
}

function renderAll() {
  const rows = filteredRows();
  renderDetailKpis(rows);
  renderPieChart(rows);
  renderDetailTable(rows);
}

function planProducts(plan) {
  if (Array.isArray(plan.products) && plan.products.length) return plan.products;
  if (plan.product) return [plan.product];
  return ["-"];
}

function regionName(regionId) {
  const rec = state.regions.find(r => r.id === regionId);
  return rec ? rec.name : "-";
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyCr(v) {
  return Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusFrom(forecast, actual) {
  const f = num(forecast);
  const a = num(actual);
  if (f <= 0) return { label: "No Plan", className: "status-noplan" };
  const ratio = a / f;
  if (ratio >= 1) return { label: "On Track", className: "status-good" };
  if (ratio >= 0.75) return { label: "Watch", className: "status-watch" };
  return { label: "At Risk", className: "status-risk" };
}

function onboardingSummary(plan) {
  if (Array.isArray(plan.onboardingMilestones) && plan.onboardingMilestones.length) {
    const done = plan.onboardingMilestones.filter(m => m.completed).length;
    const total = plan.onboardingMilestones.length;
    return `${done}/${total} Completed`;
  }
  if (plan.onboardingStatus) return plan.onboardingStatus;
  return "-";
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function expandedRows() {
  const rows = [];
  state.pa2Plans.forEach(plan => {
    const products = planProducts(plan);
    products.forEach(product => {
      rows.push({
        product,
        region: regionName(plan.regionId),
        oemName: plan.oemName || "-",
        forecast: num(plan.annualForecastCr),
        actual: num(plan.annualActualCr),
        gap: num(plan.annualForecastCr) - num(plan.annualActualCr),
        status: statusFrom(plan.annualForecastCr, plan.annualActualCr),
        onboardingMilestone: onboardingSummary(plan)
      });
    });
  });
  return rows;
}

function filteredRows() {
  let rows = expandedRows();

  if (state.controls.region !== "ALL") {
    rows = rows.filter(r => r.region === state.controls.region);
  }

  if (state.controls.product !== "ALL") {
    rows = rows.filter(r => r.product === state.controls.product);
  }

  if (state.controls.status !== "ALL") {
    rows = rows.filter(r => r.status.label === state.controls.status);
  }

  if (state.controls.search) {
    rows = rows.filter(r => r.oemName.toLowerCase().includes(state.controls.search));
  }

  return sortRows(rows, state.controls.sortBy);
}

function sortRows(rows, sortBy) {
  const out = rows.slice();
  const compareText = (a, b) => String(a).localeCompare(String(b));

  out.sort((a, b) => {
    if (sortBy === "region-asc") return compareText(a.region, b.region);
    if (sortBy === "oem-asc") return compareText(a.oemName, b.oemName);
    if (sortBy === "forecast-desc") return b.forecast - a.forecast;
    if (sortBy === "actual-desc") return b.actual - a.actual;
    if (sortBy === "gap-desc") return b.gap - a.gap;
    return compareText(a.product, b.product);
  });

  return out;
}

function populateFilterOptions() {
  const regionSel = document.getElementById("detailFilterRegion");
  const productSel = document.getElementById("detailFilterProduct");
  if (!regionSel || !productSel) return;

  const regionSet = new Set(expandedRows().map(r => r.region));
  const productSet = new Set(expandedRows().map(r => r.product));

  regionSel.innerHTML = `<option value="ALL">All Regions</option>` + Array.from(regionSet).sort().map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join("");
  productSel.innerHTML = `<option value="ALL">All Products</option>` + Array.from(productSet).sort().map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
}

function renderDetailKpis(rows) {
  const totalForecast = rows.reduce((acc, r) => acc + r.forecast, 0);
  const totalActual = rows.reduce((acc, r) => acc + r.actual, 0);
  const totalOem = new Set(rows.map(r => r.oemName.toUpperCase())).size;
  const totalProducts = new Set(rows.map(r => r.product)).size;

  const cards = [
    ["Total Forecast (Cr)", moneyCr(totalForecast)],
    ["Total Actual (Cr)", moneyCr(totalActual)],
    ["Total OEM / Accounts", String(totalOem)],
    ["Total Products", String(totalProducts)]
  ];

  const root = document.getElementById("pa2DetailKpis");
  if (!root) return;
  root.innerHTML = cards.map(([label, value]) => (
    `<div class="kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`
  )).join("");
}

function renderPieChart(rows) {
  const pie = document.getElementById("pa2ProductPie");
  const legend = document.getElementById("pa2ProductPieLegend");
  if (!pie || !legend) return;

  const byProduct = new Map();
  rows.forEach(r => {
    byProduct.set(r.product, (byProduct.get(r.product) || 0) + r.forecast);
  });

  const entries = Array.from(byProduct.entries()).filter(([, v]) => v > 0);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  if (!entries.length || total <= 0) {
    pie.style.background = "#f7fbff";
    legend.innerHTML = `<div class="item">No forecast data for chart.</div>`;
    return;
  }

  let current = 0;
  const slices = entries.map(([product, value], idx) => {
    const start = (current / total) * 360;
    current += value;
    const end = (current / total) * 360;
    return `${PIE_COLORS[idx % PIE_COLORS.length]} ${start}deg ${end}deg`;
  });

  pie.style.background = `conic-gradient(${slices.join(",")})`;

  legend.innerHTML = entries.map(([product, value], idx) => {
    const pct = ((value / total) * 100).toFixed(1);
    return `<div class="item"><span class="swatch" style="background:${PIE_COLORS[idx % PIE_COLORS.length]}"></span><span>${esc(product)}: ${esc(moneyCr(value))} Cr (${esc(pct)}%)</span></div>`;
  }).join("");
}

function renderDetailTable(rows) {
  const tbody = document.getElementById("pa2DetailRows");
  const grand = document.getElementById("pa2DetailGrandTotal");
  if (!tbody || !grand) return;

  if (state.controls.groupBy === "flat") {
    renderFlatTable(rows, tbody, grand);
    return;
  }

  if (state.controls.groupBy === "region-product") {
    renderGroupedTable(rows, tbody, grand, "region", "product");
    return;
  }

  renderGroupedTable(rows, tbody, grand, "product", "region");
}

function renderGroupedTable(rows, tbody, grand, level1Key, level2Key) {
  const level1Map = new Map();

  rows.forEach(r => {
    const l1 = r[level1Key] || "-";
    const l2 = r[level2Key] || "-";

    if (!level1Map.has(l1)) {
      level1Map.set(l1, { sub: new Map(), forecast: 0, actual: 0 });
    }
    const l1Rec = level1Map.get(l1);

    if (!l1Rec.sub.has(l2)) {
      l1Rec.sub.set(l2, { rows: [], forecast: 0, actual: 0 });
    }
    const l2Rec = l1Rec.sub.get(l2);

    l2Rec.rows.push(r);
    l2Rec.forecast += r.forecast;
    l2Rec.actual += r.actual;
    l1Rec.forecast += r.forecast;
    l1Rec.actual += r.actual;
  });

  const out = [];
  let grandForecast = 0;
  let grandActual = 0;

  Array.from(level1Map.keys()).sort().forEach(l1 => {
    const l1Rec = level1Map.get(l1);
    grandForecast += l1Rec.forecast;
    grandActual += l1Rec.actual;

    const isProductGrouping = level1Key === "product";
    const isCollapsed = isProductGrouping && state.collapsedProducts.has(l1);

    out.push(buildSummaryRow(
      `${capitalize(level1Key)} Subtotal`,
      level1Key === "product" ? l1 : "All Products",
      level1Key === "region" ? l1 : "All Regions",
      "-",
      l1Rec.forecast,
      l1Rec.actual,
      statusFrom(l1Rec.forecast, l1Rec.actual),
      "-",
      isProductGrouping
        ? `<button type="button" class="btn ghost" style="padding:4px 10px;" data-toggle-product="${encodeURIComponent(l1)}">${isCollapsed ? "Expand" : "Collapse"}</button>`
        : ""
    ));

    if (isCollapsed) return;

    Array.from(l1Rec.sub.keys()).sort().forEach(l2 => {
      const l2Rec = l1Rec.sub.get(l2);
      out.push(buildSummaryRow(`${capitalize(level2Key)} Subtotal`, level1Key === "product" ? l1 : l2, level1Key === "region" ? l1 : l2, "-", l2Rec.forecast, l2Rec.actual, statusFrom(l2Rec.forecast, l2Rec.actual), "-"));

      l2Rec.rows.sort((a, b) => a.oemName.localeCompare(b.oemName)).forEach(r => {
        out.push(`
          <tr>
            <td>${esc(r.product)}</td>
            <td>${esc(r.region)}</td>
            <td>${esc(r.oemName)}</td>
            <td>${esc(moneyCr(r.forecast))}</td>
            <td>${esc(moneyCr(r.actual))}</td>
            <td>${esc(moneyCr(r.gap))}</td>
            <td><span class="mgmt-status ${r.status.className}">${esc(r.status.label)}</span></td>
            <td>${esc(r.onboardingMilestone)}</td>
          </tr>
        `);
      });
    });
  });

  tbody.innerHTML = out.join("");

  tbody.querySelectorAll("[data-toggle-product]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = decodeURIComponent(btn.getAttribute("data-toggle-product") || "");
      if (!product) return;
      if (state.collapsedProducts.has(product)) state.collapsedProducts.delete(product);
      else state.collapsedProducts.add(product);
      renderAll();
    });
  });

  const gStatus = statusFrom(grandForecast, grandActual);
  grand.innerHTML = `
    <th>All Products</th>
    <th>All Regions</th>
    <th>Grand Total</th>
    <th>${esc(moneyCr(grandForecast))}</th>
    <th>${esc(moneyCr(grandActual))}</th>
    <th>${esc(moneyCr(grandForecast - grandActual))}</th>
    <th><span class="mgmt-status ${gStatus.className}">${esc(gStatus.label)}</span></th>
    <th>-</th>
  `;
}

function renderFlatTable(rows, tbody, grand) {
  const out = rows.map(r => `
    <tr>
      <td>${esc(r.product)}</td>
      <td>${esc(r.region)}</td>
      <td>${esc(r.oemName)}</td>
      <td>${esc(moneyCr(r.forecast))}</td>
      <td>${esc(moneyCr(r.actual))}</td>
      <td>${esc(moneyCr(r.gap))}</td>
      <td><span class="mgmt-status ${r.status.className}">${esc(r.status.label)}</span></td>
      <td>${esc(r.onboardingMilestone)}</td>
    </tr>
  `);

  tbody.innerHTML = out.join("");

  const totalForecast = rows.reduce((acc, r) => acc + r.forecast, 0);
  const totalActual = rows.reduce((acc, r) => acc + r.actual, 0);
  const s = statusFrom(totalForecast, totalActual);

  grand.innerHTML = `
    <th>All Products</th>
    <th>All Regions</th>
    <th>Grand Total</th>
    <th>${esc(moneyCr(totalForecast))}</th>
    <th>${esc(moneyCr(totalActual))}</th>
    <th>${esc(moneyCr(totalForecast - totalActual))}</th>
    <th><span class="mgmt-status ${s.className}">${esc(s.label)}</span></th>
    <th>-</th>
  `;
}

function buildSummaryRow(label, product, region, oem, forecast, actual, status, onboarding, prefixHtml = "") {
  return `
    <tr class="detail-subtotal-row">
      <td>${esc(product)}</td>
      <td>${esc(region)}</td>
      <td>${prefixHtml}${esc(label)}</td>
      <td>${esc(moneyCr(forecast))}</td>
      <td>${esc(moneyCr(actual))}</td>
      <td>${esc(moneyCr(forecast - actual))}</td>
      <td><span class="mgmt-status ${status.className}">${esc(status.label)}</span></td>
      <td>${esc(onboarding)}</td>
    </tr>
  `;
}

function capitalize(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}
