const STORAGE_KEY = "dealer-growth-tracker-v1";
const PRODUCT_LABELS = {
  PA: "BFV - Butterfly Valve",
  BV: "BV - Ball Valve",
  QTA: "QTA - Quarter Turn Actuator",
  PV: "PV - Pulse Valve",
  ASV: "ASV - Angle Seat Valve"
};

const MASTER_DEALERS = [
  { region: "BANGALORE", person: "MR. NAGESH NAYAK", dealer: "PROCESS VALVES & FITTINGS", mobile: "9980008605", email: "nageshnaikpvft@gmail.com" },
  { region: "BANGALORE", person: "MR. HARISH", dealer: "LEO PNEUMATICS & FASTENERS", mobile: "9035697187", email: "info@leopneumatics.in" },
  { region: "BANGALORE", person: "MR. BHASKAR MURTHY", dealer: "B M TOOLS & TRADERS", mobile: "9845002427", email: "bmtmys@yahoo.com" },
  { region: "BANGALORE", person: "MR. OAN", dealer: "EVERGREEN HARDWARE STORES (HOSUR)", mobile: "9916289190", email: "evergreenhosur@gmail.com" },
  { region: "CBE 2", person: "MR. MUSTANSIR", dealer: "NOBLE HARDWARE & MACHINERY MART", mobile: "9894711031", email: "noble.nhmm@gmail.com" },
  { region: "CBE 2", person: "MR. PARAMESHWARA MOORTHY", dealer: "VELUSRI ELECTRICAL & ELECTRONICS", mobile: "9865422222", email: "velusrielectricals@yahoo.com" },
  { region: "CBE 2", person: "MR. MURUGAIYYAN", dealer: "GEMINI ENGINEERING CO.", mobile: "9842589444", email: "murugaiyan.gemini@gmail.com" },
  { region: "CBE 2", person: "MR. CHELLAPANDI", dealer: "SKY PNEUMATICS", mobile: "9442246170", email: "skypneumatic@gmail.com" },
  { region: "CBE 2", person: "MR. SIVAPRAKASAM & MR. KODEESWARAN", dealer: "TRUE ENGINEERING AND CONTROL SYSTEM", mobile: "9976019801", email: "trueerode@gmail.com" },
  { region: "CBE 2", person: "MR. UNNIKRISHNAN P.K", dealer: "EMC AUTOMATION", mobile: "8075109910", email: "emcautomation@yahoo.co.in" },
  { region: "CBE 2", person: "MR. VENKATESH. D", dealer: "SREE HARI HI-TECH AUTOMATIONS", mobile: "9443473126", email: "ayyappasivakasi@yahoo.co.in" },
  { region: "CHENNAI 1", person: "MR. DHANDAPANI", dealer: "HORIZON ENTERPRISES", mobile: "9840087543", email: "horizon.chennai@yahoo.in" },
  { region: "CHENNAI 1", person: "MS. SAMITHA", dealer: "SIVANANDAA AGENCY.", mobile: "9790919700", email: "ssradje@gmail.com  &  ssradje@ymail.com" },
  { region: "DELHI 1", person: "MR. RAKESH YADAV", dealer: "ANUBHAV ENTERPRISES", mobile: "9810256630", email: "anubhav_enterprises@yahoo.co.in" },
  { region: "DELHI 1", person: "MR. SANJEEV GUPTA", dealer: "D.S.PNEUMATICS CO.PVT.LTD", mobile: "9811115134", email: "dspneumatic@rediffmail.com" },
  { region: "DELHI 1", person: "MR. ANJUM MALHOTRA", dealer: "HYDRO-PNEU CONTROLS", mobile: "9872207779", email: "hydropneu@yahoo.com" },
  { region: "DELHI 1", person: "MR. RAGHUL YADAV", dealer: "RAMA SALES CORPORATION", mobile: "9810206630", email: "rscnoida@yahoo.com" },
  { region: "DELHI 1", person: "MR. SUNIL SABHARWAL", dealer: "INDUSTRIAL EQUIPMENT CORPORATION", mobile: "9810180097", email: "sabharwal_sunil@hotmail.com" },
  { region: "DELHI 1", person: "MR. MANISH SETHI", dealer: "SATYAM & CO.", mobile: "9839455598", email: "satyamandcompany@gmail.com" },
  { region: "DELHI 1", person: "MR. MANISH KALANI", dealer: "SUNIL COMMERCIAL CORPORATION", mobile: "9314710073", email: "manishkalani@hotmail.com" },
  { region: "DELHI 1", person: "MR. NITIN GOYAL", dealer: "HARYANA SANITARY STORE.", mobile: "9416001900", email: "haryanasanitarystore@gmail.com" },
  { region: "DELHI 1", person: "MR. TUSHAR BIHANI", dealer: "NAVYUG ENTERPRISES", mobile: "9999967477", email: "navyug.bosch@gmail.com" },
  { region: "DELHI 1", person: "MR. AMIT BAGLA", dealer: "BAGLA MACHINERY MART.", mobile: "9997023945", email: "baglamach1930@gmail.com  //  baglamach1930@rediffmail.com" },
  { region: "DELHI 1", person: "MR. JITENDRA UBANA", dealer: "DHANANJAY PNEUMATICS AND ENGINEERS", mobile: "9828112629", email: "jitendra@dhananjaypneumatics.com" },
  { region: "DELHI 1", person: "MR. LAKSHAY AGARWAL", dealer: "HARYANA IRON TRADERS", mobile: "7042514139", email: "haryanairon.alwar@gmail.com" },
  { region: "DELHI 1", person: "MR. ATUL AGARWAL", dealer: "SYNDICATE INDUSTRIAL SERVICES", mobile: "9335037579", email: "atul@sisindia.in" },
  { region: "DELHI 1", person: "MR. VIPUL GUPTA", dealer: "AGGARWAL AGENCIES", mobile: "9996030871", email: "vipul.karnal@yahoo.com" },
  { region: "DELHI 1", person: "MR. PUSHKAR BAKSHI", dealer: "DELTA AIR CONTROLS", mobile: "9218021212", email: "deltaaircontrols@gmail.com" },
  { region: "DELHI 1", person: "MR. BABU", dealer: "AUTOMAX (INDIA)", mobile: "9316187772", email: "automaxindia@ymail.com" },
  { region: "DELHI 1", person: "MR. ROHAN GUPTA", dealer: "INTERNATIONAL BEARING & HARDWARE STORE", mobile: "9797530044", email: "rohanguptaskf@gmail.com" },
  { region: "DELHI 1", person: "MR. HARI OM SUMAN & ANURAG JAIN", dealer: "N.B. MERCANTILE CO. PVT. LTD", mobile: "9829035159", email: "anurag_shell@rediffmail.com  &  hariomsuman25@gmail.com;" },
  { region: "GUJARAT", person: "MR. MANISH SHAH", dealer: "ENVISAFE ENGINEERS", mobile: "9825009879", email: "envisafe2000@gmail.com" },
  { region: "GUJARAT", person: "MR. RISHIT SHAH", dealer: "INTEGRATED SERVICES", mobile: "9825331134", email: "isbaroda@yahoo.com" },
  { region: "GUJARAT", person: "MR. HEMANSHU R NAIK", dealer: "H.M. ENTERPRISE", mobile: "9825260939", email: "enterprise_hm@yahoo.co.in" },
  { region: "GUJARAT", person: "MR. YASH VACHHANI", dealer: "SHREE UMIYAJI PNEUMATIC", mobile: "8469908333", email: "umiyajipneumatic@gmail.com" },
  { region: "GUJARAT", person: "MR. SAURABH PATEL & MR. SHIVAM PATEL", dealer: "NEELKANTH ENGINEERS", mobile: "7436010354", email: "neelkanth.engineers17@gmail.com" },
  { region: "GUJARAT", person: "MR. TUSHAR SHAH", dealer: "I.S. ENGINEERS", mobile: "9824148047", email: "isenggtushar@gmail.com" },
  { region: "GUJARAT", person: "MR.  YOGESHBHAI", dealer: "FITWELL HYDRAULICS", mobile: "9924132332", email: "fitwellhydraulics@yahoo.com" },
  { region: "HYDERABAD", person: "MR. BALAJI KRISHNA RAO", dealer: "HYDROMECH ENGINEERS", mobile: "9848185824", email: "hydromechvsp@gmail.com" },
  { region: "HYDERABAD", person: "MR.RAJASEKHAR & MR. YUVARAJ", dealer: "SARVANI MACHINE TOOLS", mobile: "9848470156", email: "sarvanimachinetools@gmail.com" },
  { region: "INDORE", person: "MR. MANISH JOSHI", dealer: "UMANG ENGINEERING PRIVATE LIMITED", mobile: "9993058587", email: "manish.umangengg@gmail.com" },
  { region: "INDORE", person: "MR. RAJESH BADONIA", dealer: "BADONIA TECHNOLOGIES PRIVATE LIMITED", mobile: "9422107933", email: "ngp@badonia.com & gb@badonia.com" },
  { region: "KOLKATA", person: "MR. TRIDEEP SINGH DHANJAL", dealer: "APPLIED SOLUTIONS", mobile: "9835114924", email: "appliedsolutions.jsr@gmail.com" },
  { region: "KOLKATA", person: "MR. HARDIK NARESH BHAGAT", dealer: "HARDIK SUPPLY AGENCY.", mobile: "9572936797", email: "hardiksupply@gmail.com" },
  { region: "KOLKATA", person: "MR. JAY MANGAL SAHU", dealer: "WELD CUT", mobile: "9835780312", email: "weldcut01@gmail.com" },
  { region: "MUMBAI", person: "MR. HIMANSHU NARESH", dealer: "YOGEETA ENTERPRISES", mobile: "9323258434", email: "yogeetaenterprises@gmail.com" },
  { region: "MUMBAI", person: "MR. RATNESH RAJENDRA", dealer: "S R ENTERPRISES", mobile: "9322294255", email: "srenterprises2002@gmail.com" },
  { region: "MUMBAI-2", person: "MR. SUMEGH & SUDEEP", dealer: "WIDERANGE CORPORATION", mobile: "9820738538", email: "widerangecorp@gmail.com" },
  { region: "MUMBAI-2", person: "MR. BHAVESH SHAH", dealer: "MULTILINKS", mobile: "9820142230", email: "multilinks2008@gmail.com" },
  { region: "MUMBAI-2", person: "MR. BHAVYA KALPESH SHAH", dealer: "PNEUMATIC SOLUTION HUB LLP", mobile: "9022573965", email: "skfjanatics@gmail.com" },
  { region: "PUNE", person: "MR. SHANKAR PATOLE", dealer: "TRADELINKS MARKETING SERVICES", mobile: "9922923304", email: "shankar@tradelinksmarketing.com" },
  { region: "PUNE", person: "MR. TEJAS", dealer: "STEAMATIC COMPONENTS PVT.LTD", mobile: "9373904811", email: "tejaskolhe23@gmail.com" },
  { region: "PUNE", person: "MR. MAHESH", dealer: "TECHNOMET ENTERPRISES PUNE", mobile: "9850083793", email: "mahesh.bhattad@technometent.co.in" },
  { region: "PUNE", person: "MR. AMOL PATIL", dealer: "SAI MARKETING CORPORATION", mobile: "9730224897", email: "saisales.in@gmail.com" },
  { region: "PUNE", person: "MR. SANDEEP KALE", dealer: "S S ENTERPRISES", mobile: "9822118240", email: "kalesp69@gmail.com  &  spkale2@rediffmail.com" },
  { region: "PUNE", person: "MR. JAYESH", dealer: "TECHNOMET INC", mobile: "9850056327", email: "jayesh.dhoot@technometent.co.in" },
  { region: "TEXTILE", person: "MR. VENKAT KRISHNA & MR. VINOTH", dealer: "BALAJI ELECTRICALS", mobile: "9944941598", email: "bbalajielectricals@gmail.com" },
  { region: "TEXTILE", person: "MR. LAKSHMAN", dealer: "FINE TRANSMISSION", mobile: "9943312356", email: "finetransmission@yahoo.co.in" },
  { region: "TEXTILE", person: "MR. PREETINDER SINGH", dealer: "SUNTEX SPARES", mobile: "9814031591", email: "suntexsp@yahoo.co.in" },
  { region: "TEXTILE", person: "MR. R. RANGARAJ & MR. MANOKEERTHI", dealer: "SOVEREIGN ELECTRO ELECTRONICS.", mobile: "9790599588", email: "sovereigncbe@gmail.com" },
  { region: "TEXTILE", person: "MR. KRUNAL PATEL & MR. RATHIN CHOKSHI", dealer: "BALAJI PNEUMATIC", mobile: "9824015788", email: "balajipneumatic23@gmail.com" },
  { region: "TEXTILE", person: "MR. VENKAT RAJ", dealer: "VAIBAVSRI SOLUTIONS INDIA", mobile: "9843077046", email: "sales@vaibavsri.com  &  vaibavsri08@gmail.com" },
  { region: "TEXTILE", person: "MR. PRABHJOT SINGH", dealer: "VISHAL ENTERPRISES", mobile: "9413315682", email: "vishalenterpriseschittor@gmail.com" },
  { region: "DELHI 1", person: "MR. SANJAY AGGARWAL", dealer: "JAY AMBAY ENTERPRISES", mobile: "", email: "" },
  { region: "CBE 2", person: "MR. ANTONY ALVIN", dealer: "TMC AUTOMATIONS", mobile: "", email: "" },
  { region: "CHENNAI 1", person: "MR. TAHEER M V", dealer: "PRIMETECH TRADERS", mobile: "", email: "" },
  { region: "DELHI 1", person: "MR. SANDEEP GUPTA", dealer: "SHRI BALAJI HYDRAULIC & PNEUMATICS MACHINERY STORE", mobile: "", email: "" },
  { region: "DELHI 1", person: "MR. SHREE KANT PAREEK", dealer: "BALAJI ASSOCIATES", mobile: "", email: "" },
  { region: "DELHI 1", person: "MR. GAJENDRA SINGH", dealer: "CHOUDHARY ENTERPRISES", mobile: "", email: "" },
  { region: "HYDERABAD", person: "MR. MOIZ BADRI", dealer: "HYDRO PNEUMATICS", mobile: "", email: "" },
];

const state = {
  unlocked: false,
  session: null,
  cognito: null,
  regions: [],
  dealers: [],
  monthly: [],
  supports: [],
  accounts: [],
  activities: []
};

(function init() {
  hydrate();
  seedMasterData();
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
    const affinity = d.affinity || "Medium";
    if (d.regionId) return { ...d, affinity };
    const region = state.regions[idx % state.regions.length];
    return { ...d, regionId: region.id || first, affinity };
  });
}

function seedMasterData() {
  const regionByName = new Map(state.regions.map(r => [r.name, r]));

  MASTER_DEALERS.forEach(item => {
    if (!regionByName.has(item.region)) {
      const rec = { id: crypto.randomUUID(), name: item.region };
      state.regions.push(rec);
      regionByName.set(item.region, rec);
    }
  });

  const dealerKey = d => `${regionName(d.regionId)}::${d.name}`.toUpperCase();
  const existing = new Set(state.dealers.map(dealerKey));

  MASTER_DEALERS.forEach(item => {
    const region = regionByName.get(item.region);
    const key = `${item.region}::${item.dealer}`.toUpperCase();
    if (existing.has(key)) return;

    state.dealers.push({
      id: crypto.randomUUID(),
      regionId: region.id,
      name: item.dealer,
      city: "",
      person: item.person,
      mobile: item.mobile,
      email: item.email,
      affinity: item.affinity || "Medium"
    });
  });

  state.regions.sort((a, b) => a.name.localeCompare(b.name));
  persist();
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

  if (!q("filterQuarter").value) q("filterQuarter").value = "ALL";
  updateQuarterField("entryMonth", "entryQuarter");
  updateQuarterField("supportMonth", "supportQuarter");
  updateQuarterField("accountMonth", "accountQuarter");
  updateQuarterField("activityMonth", "activityQuarter");
}

function bindEvents() {
  q("btnRequestCode").addEventListener("click", requestCode);
  q("btnVerifyCode").addEventListener("click", verifyCode);
  q("btnDemoUnlock").addEventListener("click", demoUnlock);

  ["filterMonth", "filterQuarter", "filterRegion", "filterDealer", "filterProduct"].forEach(id => {
    q(id).addEventListener("change", renderAll);
  });
  q("dealerDirectorySearch").addEventListener("input", renderDealerDirectory);

  [
    ["entryMonth", "entryQuarter"],
    ["supportMonth", "supportQuarter"],
    ["accountMonth", "accountQuarter"],
    ["activityMonth", "activityQuarter"]
  ].forEach(([monthId, quarterId]) => {
    q(monthId).addEventListener("change", () => updateQuarterField(monthId, quarterId));
  });

  const exportBtn = q("btnExportCsvDb");
  const importBtn = q("btnImportCsvDb");
  const importInput = q("csvDbFileInput");
  if (exportBtn) exportBtn.addEventListener("click", exportLocalDbCsv);
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", importLocalDbCsv);
  }

  q("btnAddRegion").addEventListener("click", addRegion);
  q("btnAddDealer").addEventListener("click", addDealer);
  q("btnRemoveDealer").addEventListener("click", removeDealer);
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

function setHierarchyStatus(message, ok) {
  const el = q("hierarchyStatus");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function addRegion() {
  const name = q("regionName").value.trim();
  if (!name) {
    setHierarchyStatus("Enter Region Name only if you want to create a new region.", false);
    return;
  }

  const exists = state.regions.some(r => r.name.toUpperCase() === name.toUpperCase());
  if (exists) {
    setHierarchyStatus("Region already exists.", false);
    return;
  }

  const newRegion = { id: crypto.randomUUID(), name };
  state.regions.push(newRegion);
  q("regionName").value = "";
  persist();
  renderAll();
  if (q("dealerRegion")) q("dealerRegion").value = newRegion.id;
  setHierarchyStatus(`Region ${name} added.`, true);
}

function addDealer() {
  const name = q("dealerName").value.trim();
  const city = q("dealerCity").value.trim();
  const activeRegionFromTab = q("filterRegion") && q("filterRegion").value !== "ALL" ? q("filterRegion").value : "";
  const dealerRegionEl = q("dealerRegion");
  if (dealerRegionEl && !dealerRegionEl.value && dealerRegionEl.options.length) {
    dealerRegionEl.value = dealerRegionEl.options[0].value;
  }
  const regionId = activeRegionFromTab || (dealerRegionEl && dealerRegionEl.value) || q("entryRegion").value || (state.regions[0] && state.regions[0].id);

  if (!name) {
    setHierarchyStatus("Enter Dealer Name.", false);
    return;
  }

  if (!regionId) {
    setHierarchyStatus("Select a region tab first or create a region.", false);
    return;
  }

  const duplicate = state.dealers.some(d => d.regionId === regionId && d.name.toUpperCase() === name.toUpperCase());
  if (duplicate) {
    setHierarchyStatus("Dealer already exists in selected region.", false);
    return;
  }

  const newDealer = { id: crypto.randomUUID(), regionId, name, city, person: "", mobile: "", email: "", affinity: "Medium" };
  state.dealers.push(newDealer);
  q("dealerName").value = "";
  q("dealerCity").value = "";

  const filterRegionEl = q("filterRegion");
  if (filterRegionEl && filterRegionEl.value === "ALL") {
    filterRegionEl.value = regionId;
  }

  persist();
  renderAll();
  const filterDealerEl = q("filterDealer");
  if (filterDealerEl && Array.from(filterDealerEl.options).some(o => o.value === newDealer.id)) {
    filterDealerEl.value = newDealer.id;
  }
  setHierarchyStatus(`Dealer ${name} added to ${regionName(regionId)}.`, true);
}

function removeDealer() {
  const removeEl = q("dealerToRemove");
  if (!removeEl || !removeEl.value) {
    setHierarchyStatus("Select a dealer to remove.", false);
    return;
  }

  const dealerId = removeEl.value;
  const dealer = state.dealers.find(d => d.id === dealerId);
  if (!dealer) {
    setHierarchyStatus("Selected dealer was not found.", false);
    return;
  }

  state.dealers = state.dealers.filter(d => d.id !== dealerId);
  state.monthly = state.monthly.filter(r => r.dealerId !== dealerId);
  state.supports = state.supports.filter(r => r.dealerId !== dealerId);
  state.accounts = state.accounts.filter(r => r.dealerId !== dealerId);
  state.activities = state.activities.filter(r => r.dealerId !== dealerId);

  if (q("filterDealer") && q("filterDealer").value === dealerId) {
    q("filterDealer").value = "ALL";
  }

  persist();
  renderAll();
  setHierarchyStatus(`Dealer ${dealer.name} removed from ${regionName(dealer.regionId)}.`, true);
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
  renderRegionTabs();
  renderKpis();
  renderMonthlyTable();
  renderQuarterlyTable();
  renderAccountsTable();
  renderDealerDirectory();
}

function renderRegionTabs() {
  const wrap = q("regionTabs");
  if (!wrap) return;

  const active = q("filterRegion").value || "ALL";
  const items = [{ value: "ALL", label: "All" }].concat(
    state.regions.map(r => ({ value: r.id, label: r.name }))
  );

  wrap.innerHTML = items.map(item => (
    `<button class="region-tab ${item.value === active ? "active" : ""}" data-region-id="${esc(item.value)}">${esc(item.label)}</button>`
  )).join("");

  wrap.querySelectorAll(".region-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      q("filterRegion").value = btn.dataset.regionId;
      syncDealerByRegion("filterRegion", "filterDealer", true);
      renderAll();
    });
  });
}

function renderDealerDirectory() {
  const tbody = q("dealerDirectoryRows");
  if (!tbody) return;

  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;
  const query = q("dealerDirectorySearch").value.trim().toLowerCase();

  const rows = state.dealers.filter(d => {
    if (region && region !== "ALL" && d.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && d.id !== dealer) return false;
    if (query) {
      const haystack = [
        regionName(d.regionId),
        d.name,
        d.person,
        d.mobile,
        d.email,
        d.affinity
      ].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  tbody.innerHTML = rows.map((d, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${esc(regionName(d.regionId))}</td>
      <td>${esc(d.name)}</td>
      <td>${esc(d.person || "-")}</td>
      <td>${esc(d.mobile || "-")}</td>
      <td>${esc(d.email || "-")}</td>
      <td>
        <select class="dealer-affinity-select ${affinityClass(d.affinity)}" data-dealer-id="${esc(d.id)}">
          <option value="High" ${normalizeAffinity(d.affinity) === "High" ? "selected" : ""}>High</option>
          <option value="Medium" ${normalizeAffinity(d.affinity) === "Medium" ? "selected" : ""}>Medium</option>
          <option value="Low" ${normalizeAffinity(d.affinity) === "Low" ? "selected" : ""}>Low</option>
        </select>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".dealer-affinity-select").forEach(sel => {
    sel.addEventListener("change", () => setDealerAffinity(sel.dataset.dealerId, sel.value, sel));
  });
}

function setDealerAffinity(dealerId, affinity, selectEl) {
  const normalized = normalizeAffinity(affinity);

  state.dealers = state.dealers.map(d => {
    if (d.id !== dealerId) return d;
    return { ...d, affinity: normalized };
  });
  if (selectEl) {
    selectEl.value = normalized;
    selectEl.className = `dealer-affinity-select ${affinityClass(normalized)}`;
  }
  persist();
}

function normalizeAffinity(value) {
  if (value === "High" || value === "Low") return value;
  return "Medium";
}

function affinityClass(value) {
  const affinity = normalizeAffinity(value).toLowerCase();
  return `affinity-${affinity}`;
}

function fillRegionDealerSelects() {
  const regionSelectIds = [
    "filterRegion", "entryRegion", "supportRegion", "accountRegion", "activityRegion", "dealerRegion"
  ];

  regionSelectIds.forEach(id => {
    const sel = q(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    if (id === "filterRegion") {
      sel.appendChild(opt("ALL", "All Regions"));
    }
    state.regions.forEach(r => sel.appendChild(opt(r.id, r.name)));
    if (Array.from(sel.options).some(o => o.value === prev)) {
      sel.value = prev;
    }

    if (id === "dealerRegion") {
      const filterRegionId = q("filterRegion") && q("filterRegion").value !== "ALL" ? q("filterRegion").value : "";
      if (filterRegionId && Array.from(sel.options).some(o => o.value === filterRegionId)) {
        sel.value = filterRegionId;
      }
    }

    if (id !== "filterRegion" && !sel.value && sel.options.length) {
      sel.value = sel.options[0].value;
    }
  });

  const map = [
    ["filterRegion", "filterDealer", true],
    ["entryRegion", "entryDealer", false],
    ["supportRegion", "supportDealer", false],
    ["accountRegion", "accountDealer", false],
    ["activityRegion", "activityDealer", false]
  ];
  map.forEach(([r, d, all]) => syncDealerByRegion(r, d, all));
  syncHierarchyDealerRemovalList();
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

function syncHierarchyDealerRemovalList() {
  const removeSel = q("dealerToRemove");
  if (!removeSel) return;

  const prev = removeSel.value;
  removeSel.innerHTML = "";

  const filterRegion = q("filterRegion") && q("filterRegion").value !== "ALL" ? q("filterRegion").value : "";
  const dealerRegion = q("dealerRegion") ? q("dealerRegion").value : "";
  const selectedRegionId = filterRegion || dealerRegion;

  const list = state.dealers.filter(d => !selectedRegionId || d.regionId === selectedRegionId);
  if (!list.length) {
    removeSel.appendChild(opt("", "No dealers available"));
    return;
  }

  list.forEach(d => removeSel.appendChild(opt(d.id, `${d.name} (${d.city || "-"})`)));
  if (Array.from(removeSel.options).some(o => o.value === prev)) {
    removeSel.value = prev;
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
    ["Potential (L)", money(totalPotential)],
    ["Forecast (L)", money(totalForecast)],
    ["Actual (L)", money(totalActual)],
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
      quarter: quarterFromMonth(r.month),
      region: regionName(r.regionId),
      dealer: dealerName(r.dealerId),
      product: productLabel(r.product),
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
      <td>${esc(r.quarter)}</td>
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

function renderQuarterlyTable() {
  const tbody = q("quarterlyReviewRows");
  if (!tbody) return;

  const grouped = new Map();
  filteredMonthly().forEach(r => {
    const quarter = quarterFromMonth(r.month);
    const key = [quarter, r.regionId, r.dealerId, r.product].join("::");
    if (!grouped.has(key)) {
      grouped.set(key, {
        quarter,
        region: regionName(r.regionId),
        dealer: dealerName(r.dealerId),
        product: productLabel(r.product),
        potential: 0,
        forecast: 0,
        actual: 0,
        opp: 0
      });
    }
    const g = grouped.get(key);
    g.potential += num(r.potential);
    g.forecast += num(r.forecast);
    g.actual += num(r.actual);
    g.opp += intNum(r.oppCount);
  });

  const rows = Array.from(grouped.values());
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.quarter)}</td>
      <td>${esc(r.region)}</td>
      <td>${esc(r.dealer)}</td>
      <td>${esc(r.product)}</td>
      <td>${esc(money(r.potential))}</td>
      <td>${esc(money(r.forecast))}</td>
      <td>${esc(money(r.actual))}</td>
      <td>${esc(money(r.forecast - r.actual))}</td>
      <td>${esc(String(r.opp))}</td>
    </tr>
  `).join("");
}

function renderAccountsTable() {
  const month = q("filterMonth").value;
  const quarter = q("filterQuarter").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;
  const product = q("filterProduct").value;

  const rows = state.accounts.filter(a => {
    if (month && quarter === "ALL" && a.month !== month) return false;
    if (quarter && quarter !== "ALL" && quarterFromMonth(a.month) !== quarter) return false;
    if (region && region !== "ALL" && a.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && a.dealerId !== dealer) return false;
    if (product && product !== "ALL" && a.product !== product) return false;
    return true;
  });

  q("accountRows").innerHTML = rows.map(a => `
    <tr>
      <td>${esc(a.month)}</td>
      <td>${esc(quarterFromMonth(a.month))}</td>
      <td>${esc(regionName(a.regionId))}</td>
      <td>${esc(dealerName(a.dealerId))}</td>
      <td>${esc(a.account)}</td>
      <td>${esc(productLabel(a.product))}</td>
      <td>${esc(money(a.potential))}</td>
      <td>${esc(money(a.forecast))}</td>
      <td>${esc(a.stage)}</td>
    </tr>
  `).join("");
}

function filteredMonthly() {
  const month = q("filterMonth").value;
  const quarter = q("filterQuarter").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;
  const product = q("filterProduct").value;

  return state.monthly.filter(r => {
    if (month && quarter === "ALL" && r.month !== month) return false;
    if (quarter && quarter !== "ALL" && quarterFromMonth(r.month) !== quarter) return false;
    if (region && region !== "ALL" && r.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && r.dealerId !== dealer) return false;
    if (product && product !== "ALL" && r.product !== product) return false;
    return true;
  });
}

function filteredSupports() {
  const month = q("filterMonth").value;
  const quarter = q("filterQuarter").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;

  return state.supports.filter(s => {
    if (month && quarter === "ALL" && s.month !== month) return false;
    if (quarter && quarter !== "ALL" && quarterFromMonth(s.month) !== quarter) return false;
    if (region && region !== "ALL" && s.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && s.dealerId !== dealer) return false;
    return true;
  });
}

function filteredActivities() {
  const month = q("filterMonth").value;
  const quarter = q("filterQuarter").value;
  const region = q("filterRegion").value;
  const dealer = q("filterDealer").value;

  return state.activities.filter(a => {
    if (month && quarter === "ALL" && a.month !== month) return false;
    if (quarter && quarter !== "ALL" && quarterFromMonth(a.month) !== quarter) return false;
    if (region && region !== "ALL" && a.regionId !== region) return false;
    if (dealer && dealer !== "ALL" && a.dealerId !== dealer) return false;
    return true;
  });
}

function quarterFromMonth(monthValue) {
  if (!monthValue || monthValue.length < 7) return "-";
  const m = Number(monthValue.slice(5, 7));
  if (m >= 4 && m <= 6) return "Q1";
  if (m >= 7 && m <= 9) return "Q2";
  if (m >= 10 && m <= 12) return "Q3";
  return "Q4";
}

function updateQuarterField(monthId, quarterId) {
  const monthEl = q(monthId);
  const quarterEl = q(quarterId);
  if (!monthEl || !quarterEl) return;
  quarterEl.value = quarterFromMonth(monthEl.value);
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
  return `${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
}

function productLabel(code) {
  return PRODUCT_LABELS[code] || code;
}

function setCsvStatus(message, ok) {
  const el = q("csvDbStatus");
  if (!el) return;
  el.textContent = message;
  el.className = ok ? "status ok" : "status";
}

function csvEscape(value) {
  const text = String(value == null ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportLocalDbCsv() {
  const rows = [];

  state.regions.forEach(r => {
    rows.push(["region", r.id, r.name, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
  });

  state.dealers.forEach(d => {
    rows.push([
      "dealer", d.id, d.regionId, d.name, d.city || "", d.person || "", d.mobile || "", d.email || "", d.salesEngineer || "",
      d.affinity || "Medium", "", "", "", "", "", "", "", "", "", ""
    ]);
  });

  state.monthly.forEach(m => {
    rows.push([
      "monthly", m.id, m.month, m.regionId, m.dealerId, m.product, m.potential, m.forecast, m.actual, m.oppCount,
      quarterFromMonth(m.month), "", "", "", "", "", "", "", "", ""
    ]);
  });

  state.supports.forEach(s => {
    rows.push(["support", s.id, s.month, s.regionId, s.dealerId, "", "", "", "", "", s.text || "", "", "", "", "", "", "", "", "", ""]);
  });

  state.accounts.forEach(a => {
    rows.push([
      "account", a.id, a.month, a.regionId, a.dealerId, a.product, a.potential, a.forecast, "", "",
      "", a.account || "", a.stage || "", "", "", "", "", "", "", ""
    ]);
  });

  state.activities.forEach(a => {
    rows.push([
      "activity", a.id, a.month, a.regionId, a.dealerId, "", "", "", "", "",
      "", "", "", a.visitPlan, a.visitDone, a.expoAttended, a.expoHosted, "", "", ""
    ]);
  });

  const header = [
    "entity", "id", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
    "f9", "f10", "f11", "f12", "f13", "f14", "f15", "f16", "f17", "f18"
  ];

  const lines = [header, ...rows].map(cols => cols.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dealer_tracker_localdb_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  setCsvStatus("CSV exported successfully.", true);
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

function importLocalDbCsv(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("Empty CSV");

      const imported = { regions: [], dealers: [], monthly: [], supports: [], accounts: [], activities: [] };
      lines.slice(1).forEach(line => {
        const c = parseCsvLine(line);
        const e = c[0];
        if (e === "region") imported.regions.push({ id: c[1], name: c[2] });
        if (e === "dealer") imported.dealers.push({ id: c[1], regionId: c[2], name: c[3], city: c[4], person: c[5], mobile: c[6], email: c[7], salesEngineer: c[8], affinity: c[9] || "Medium" });
        if (e === "monthly") imported.monthly.push({ id: c[1], month: c[2], regionId: c[3], dealerId: c[4], product: c[5], potential: num(c[6]), forecast: num(c[7]), actual: num(c[8]), oppCount: intNum(c[9]) });
        if (e === "support") imported.supports.push({ id: c[1], month: c[2], regionId: c[3], dealerId: c[4], text: c[10] });
        if (e === "account") imported.accounts.push({ id: c[1], month: c[2], regionId: c[3], dealerId: c[4], product: c[5], potential: num(c[6]), forecast: num(c[7]), account: c[11], stage: c[12] });
        if (e === "activity") imported.activities.push({ id: c[1], month: c[2], regionId: c[3], dealerId: c[4], visitPlan: intNum(c[13]), visitDone: intNum(c[14]), expoAttended: intNum(c[15]), expoHosted: intNum(c[16]) });
      });

      state.regions = imported.regions;
      state.dealers = imported.dealers;
      state.monthly = imported.monthly;
      state.supports = imported.supports;
      state.accounts = imported.accounts;
      state.activities = imported.activities;

      persist();
      ensureDefaults();
      renderAll();
      setCsvStatus("CSV imported successfully.", true);
    } catch (err) {
      console.error(err);
      setCsvStatus("CSV import failed. Please use LocalDB export format.", false);
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
