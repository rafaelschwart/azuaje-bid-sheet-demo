// tests/reseed-triage.test.js
// Pins the whole reseed story chain of hoja-de-puja.html:
//   generateSale(400, 20260803)  ->  afterHard 81  ->  shortlist 10
//   triage seeder (seed 20260813) -> visual 38 -> carfax 30 -> READY 7
// Self-contained copies of the app's pure functions, same idiom as
// solver-techo-puja.test.js. Any drift in the generator, the default
// filters, the ledger calibration, the fee table, the shop coordinates
// or the seeder's draw discipline breaks these numbers — on purpose.
//
// NOTE — spec 05 quoted 83/41/31/11 and lot 58683451 from a Node sim
// ("measured"); that sim drifted from the app. The numbers pinned here
// were verified against the LIVE app in a browser (playwright, 2026-08-14):
// the funnel renders 400/353/301/165/132/91/81 machine stages, 38/30/7
// manual stages, and the shortlist tops out at lot 58524793. The file is
// the ground truth; these assertions reproduce it exactly in Node.
//
//   node tests/reseed-triage.test.js

"use strict";

let fails = 0;
function ok(name, cond, extra) {
  if (cond) console.log("  ok  " + name);
  else { fails++; console.log("  FAIL " + name + (extra !== undefined ? "  (" + extra + ")" : "")); }
}

/* ---------------- PRNG (exact copy) ---------------- */
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------------- generator (exact copy incl. the 12:00–15:30 saleTime) ---------------- */
const FLEET = [
  ["Toyota","Camry",1.00],["Toyota","Corolla",0.86],["Toyota","RAV4",1.18],
  ["Nissan","Altima",0.80],["Nissan","Sentra",0.70],["Nissan","Rogue",0.98],
  ["Hyundai","Elantra",0.74],["Hyundai","Sonata",0.86],["Hyundai","Tucson",1.02],
  ["Kia","Forte",0.72],["Kia","Optima",0.84],["Kia","Sportage",1.00],
  ["Chevrolet","Malibu",0.82],["Chevrolet","Equinox",1.00],["Chevrolet","Trax",0.78],
  ["Honda","Civic",0.92],["Honda","Accord",1.06],["Honda","CR-V",1.22],
  ["Mazda","Mazda3",0.86],["Mazda","CX-5",1.10],
  ["Volkswagen","Jetta",0.80],["Mitsubishi","Outlander",0.76],
  ["Ford","Fusion",0.80],["Ford","Escape",0.92],["Ford","Explorer",1.24],
  ["Dodge","Charger",1.02],["Dodge","Journey",0.72],["Chrysler","300",0.94],
  ["Chrysler","Pacifica",1.08],["Jeep","Compass",0.90],["Jeep","Cherokee",1.06],
  ["Ram","1500",1.30]
];
const DAMAGES = [
  ["FRONT END",.52],["REAR END",.19],["SIDE",.11],["MECHANICAL",.10],
  ["UNDERCARRIAGE",.03],["ALL OVER",.03],["BURN - INTERIOR",.01],["VANDALISM",.01]
];
const TITLES = [["CT",.726],["ST",.123],["CZ",.068],["SC",.055],["DC",.014],["SV",.014]];
const YARDS = [
  ["342","MD - BALTIMORE EAST","21225",39.2259,-76.6153], ["385","MI - WAYLAND","49348",42.6643,-85.6191],
  ["855","WHOLESALE AUCTION","94503",38.1668,-122.2553], ["369","KS - KANSAS CITY","66111",39.0803,-94.7806],
  ["362","AZ - PHOENIX NORTH","85085",33.7529,-112.0893], ["394","TX - NORTH AUSTIN","76574",30.5807,-97.4401],
  ["361","MA - FREETOWN","02702",41.7975,-71.0607], ["370","IN - DYER","46311",41.4920,-87.5108],
  ["376","OH - AKRON","44203",41.0197,-81.6212], ["838","RENTAL VEHICLE SALE","75172",32.5981,-96.6838],
  ["360","IN - FORT WAYNE","46803",41.0695,-85.1074], ["345","KY - EARLINGTON","42410",37.2743,-87.5131],
  ["344","NY - BUFFALO","14006",42.6366,-79.0497], ["350","CT - HARTFORD SPRINGFIELD","06026",41.9322,-72.7459],
  ["368","NC - RALEIGH NORTH","27545",35.7789,-78.4898], ["373","NC - LAGRANGE","28551",35.3054,-77.7686],
  ["371","WI - MILWAUKEE SOUTH","53132",42.9017,-88.0086], ["398","IA - CEDAR RAPIDS","52404",41.9521,-91.6853],
  ["197","SC - NORTH CHARLESTON","29448",33.2205,-80.4501], ["384","ME - WINDHAM","04062",43.7958,-70.4143],
  ["367","CA - MENTONE","92359",34.0774,-117.1126], ["340","NC - GASTONIA","28052",35.2449,-81.2194],
  ["199","RI - EXETER","02822",41.5740,-71.6076], ["338","NC - LUMBERTON","28360",34.6697,-79.1084],
  ["395","VT - RUTLAND","05736",43.6023,-73.0170], ["916","AL - CUSSETA","36852",32.7831,-85.2756],
  ["357","TX - HOUSTON EAST","77049",29.8235,-95.1848], ["836","HEAVY TRUCK SPECIALTY SALE","31008",32.6181,-83.7890],
  ["194","VA - FREDERICKSBURG","22408",38.2481,-77.4681], ["341","AL - DOTHAN","36352",31.3311,-85.5992],
  ["835","MEDIUM DUTY SPECIALTY SALE","79714",32.3201,-102.5409], ["386","LA - VINTON","70663",30.2190,-93.3639],
  ["359","GA - AUGUSTA","30906",33.3589,-82.0099], ["166","OH - DAYTON","45439",39.7010,-84.2187],
  ["880","*NCS - EASTERN REGION","27028",35.9220,-80.5370], ["343","CA - REDDING","96007",40.4574,-122.3282],
  ["841","CRASHEDTOYS POWERSPORT AUCTION","21225",39.2259,-76.6153], ["337","WA - SPANAWAY","98387",47.0732,-122.3943],
  ["111","OH - CLEVELAND EAST","44067",41.3208,-81.5429], ["366","FL - CLEWISTON","33440",26.7172,-80.9492],
  ["356","NC - CONCORD","28025",35.3716,-80.5300], ["339","WI - MILWAUKEE NORTH","53224",43.1594,-88.0327],
  ["396","SD - RAPID CITY","57701",44.1415,-103.2052], ["832","MEDIUM DUTY CLEAN TITLE SALE","75172",32.5981,-96.6838],
  ["363","ND - BISMARCK","58504",46.7231,-100.6780],
];

function haversine(a, b, c, d) {
  const R = 3958.8, rad = x => x * Math.PI / 180;
  const x = Math.pow(Math.sin(rad(c - a) / 2), 2) +
            Math.cos(rad(a)) * Math.cos(rad(c)) * Math.pow(Math.sin(rad(d - b) / 2), 2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
const YARD_BY_NUM = {};
YARDS.forEach(y => { YARD_BY_NUM[y[0]] = y; });

function pick(r, weighted) {
  const tot = weighted.reduce((a, x) => a + x[x.length - 1], 0);
  let v = r() * tot;
  for (let i = 0; i < weighted.length; i++) {
    v -= weighted[i][weighted[i].length - 1];
    if (v <= 0) return weighted[i];
  }
  return weighted[weighted.length - 1];
}

function generateSale(n, seed) {
  const r = rng(seed || 20260803);
  const out = [];
  for (let i = 0; i < n; i++) {
    const f = FLEET[Math.floor(r() * FLEET.length)];
    const dmg = pick(r, DAMAGES)[0];
    const dmg2 = r() < 0.44 ? pick(r, DAMAGES)[0] : "";
    const ttl = pick(r, TITLES)[0];
    const yard = YARDS[Math.floor(r() * YARDS.length)];
    const year = 2020 + Math.floor(r() * 7);
    const age = Math.max(0, 2026 - year);
    const miles = Math.round((18000 + Math.pow(r(), 0.9) * 108000) / 100) * 100;

    let base = 27500 * f[2] * Math.pow(0.885, age) * (0.92 + r() * 0.18);
    base -= Math.min(base * 0.26, miles * 0.030);
    const estRetail = Math.max(3200, Math.round(base / 50) * 50);

    const sev = { "VANDALISM":0.09, "MECHANICAL":0.10, "REAR END":0.13, "SIDE":0.15,
                  "FRONT END":0.17, "UNDERCARRIAGE":0.26, "BURN - INTERIOR":0.40,
                  "ALL OVER":0.45 }[dmg] || 0.15;
    const cpRepair = Math.round(estRetail * sev * (0.72 + r() * 0.62) / 25) * 25;

    const noMiles  = r() < 0.124;
    const noRepair = r() < 0.303;

    const lot = String(58100000 + Math.floor(r() * 899999));
    out.push({
      lotId: lot,
      vin: "DEMO" + lot + String(Math.floor(r() * 90) + 10),
      year: year, make: f[0].toUpperCase(), modelGroup: f[1].toUpperCase(),
      mileage: noMiles ? 0 : miles, _noMileage: noMiles,
      damageDescription: dmg, secondaryDamage: dmg2,
      yardNumber: yard[0], yardName: yard[1],
      saleTitleType: ttl, saleTitleState: yard[1].slice(0, 2),
      estRetailValue: estRetail,
      repairCost: noRepair ? 0 : cpRepair, _noRepair: noRepair,
      highBid: Math.round(Math.max(150, estRetail * (0.06 + r() * 0.26) - cpRepair * 0.55) / 25) * 25,
      runsDrives: r() < 0.72, hasKeys: r() < 0.81,
      rental: r() < 0.88,
      locationZip: yard[2],
      saleTime: (12 + Math.floor(r() * 4)) + ":" + (r() < .5 ? "00" : "30")
    });
  }
  return out;
}

/* ---------------- fee table + solver (exact copy, default cfg) ---------------- */
const cfg = {
  membership: "public",
  tiers: [
    { upTo: 399,  fee: 75  }, { upTo: 899,  fee: 135 }, { upTo: 1399, fee: 185 },
    { upTo: 1999, fee: 235 }, { upTo: 2499, fee: 285 }, { upTo: 2999, fee: 335 },
    { upTo: 3499, fee: 385 }, { upTo: 3999, fee: 435 }, { upTo: 4499, fee: 485 },
    { upTo: 4999, fee: 535 }
  ],
  topPct: 10, pct: 6, pctMin: 150, gate: 95, vbid: 99, env: 15, other: 0
};
function buyerFee(hammer) {
  if (hammer <= 0) return 0;
  if (cfg.membership === "licensed") return Math.max(cfg.pctMin, hammer * (cfg.pct / 100));
  for (let i = 0; i < cfg.tiers.length; i++) if (hammer <= cfg.tiers[i].upTo) return cfg.tiers[i].fee;
  return hammer * (cfg.topPct / 100);
}
function fixedFees() { return cfg.gate + cfg.vbid + cfg.env + cfg.other; }
function totalFees(hammer) { return buyerFee(hammer) + fixedFees(); }
function solveCeiling(budget) {
  const F = fixedFees();
  if (budget <= F) return 0;
  const okh = h => h > 0 && h + totalFees(h) <= budget + 1e-6;
  function fit(c, lo, hi) {
    c = Math.min(Math.floor(c), hi);
    while (c + 1 <= hi && okh(c + 1)) c++;
    while (c >= lo && !okh(c)) c--;
    return c >= lo ? c : -1;
  }
  let best = 0, c;
  let prev = 0;
  for (let i = 0; i < cfg.tiers.length; i++) {
    c = fit(budget - F - cfg.tiers[i].fee, prev + 1, cfg.tiers[i].upTo);
    if (c > best) best = c;
    prev = cfg.tiers[i].upTo;
  }
  c = fit((budget - F) / (1 + cfg.topPct / 100), prev + 1, Math.ceil(budget));
  if (c > best) best = c;
  return Math.max(0, best);
}

/* ---------------- ledger calibration from the six seeded sold units ---------------- */
const SOLD = [
  { cpRepair:2150, estRetail:16200, realParts:2680, realLabor:1550, realSale:13400 },
  { cpRepair:1720, estRetail:14500, realParts:1950, realLabor:1300, realSale:12100 },
  { cpRepair:1800, estRetail:12400, realParts:2340, realLabor:1450, realSale:10200 },
  { cpRepair:2400, estRetail:18100, realParts:2810, realLabor:1800, realSale:15100 },
  { cpRepair:2050, estRetail:11300, realParts:3450, realLabor:2100, realSale:9300  },
  { cpRepair:1500, estRetail:15400, realParts:1720, realLabor:1150, realSale:12850 }
];
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function calibration() {
  const s = SOLD.filter(u => u.cpRepair && u.estRetail);
  if (s.length >= 3) {
    return {
      n: s.length, source: "ledger",
      saleF:  avg(s.map(u => u.realSale / u.estRetail)),
      partsF: avg(s.map(u => u.realParts / u.cpRepair)),
      laborF: avg(s.map(u => u.realLabor / u.realParts))
    };
  }
  return { n: s.length, source: "default", saleF: 0.82, partsF: 1.15, laborF: 0.60 };
}

/* ---------------- tow (exact copy, default shop) ---------------- */
const shop = { name: "TX - DALLAS", lat: 32.7767, lon: -96.7970, base: 120, perMile: 1.85, minCharge: 175 };
function milesToYard(lot) {
  let y = YARD_BY_NUM[lot.yardNumber];
  if (!y) {
    for (let i = 0; i < YARDS.length; i++) {
      if (YARDS[i][1] === lot.yardName || YARDS[i][2] === lot.locationZip) { y = YARDS[i]; break; }
    }
  }
  if (!y) return null;
  return haversine(shop.lat, shop.lon, y[3], y[4]);
}
function towFor(lot) {
  const mi = milesToYard(lot);
  if (mi === null) return Math.round((shop.base + 60 * shop.perMile) / 5) * 5;
  lot._towMiles = Math.round(mi);
  return Math.max(shop.minCharge, Math.round((shop.base + mi * shop.perMile) / 5) * 5);
}
function estimateLot(lot, cal) {
  const sale  = lot.estRetailValue * cal.saleF;
  const parts = lot.repairCost * cal.partsF;
  const labor = parts * cal.laborF;
  const tow   = towFor(lot);
  return { sale, parts, labor, tow };
}

/* ---------------- default rules + facets (exact copy) ---------------- */
const JUAN_BAD_MAKES = ["chrysler","jeep","ford","dodge","ram"];
const JUAN_BAD_DAMAGE = ["all over","burn","flood","rollover","undercarriage","water/flood"];
const CLEAN_TITLE_CODES = ["CT","CZ","CJ","CD","CQ"];
const rules = {
  miles: 85000, yearMin: 0, margin: 6000, distMax: 0,
  retMin: 0, retMax: 0, repMax: 0, roomMin: 0,
  rental: true, runs: false, keys: false, noSecondary: false,
  makes: {}, damages: {}, titles: {}
};
const FACETS = [
  { key: "makes",   field: l => l.make,
    bad: v => JUAN_BAD_MAKES.indexOf(String(v).toLowerCase()) > -1 },
  { key: "damages", field: l => l.damageDescription,
    bad: v => JUAN_BAD_DAMAGE.some(b => String(v).toLowerCase().indexOf(b) > -1) },
  { key: "titles",  field: l => l.saleTitleType,
    bad: v => CLEAN_TITLE_CODES.indexOf(String(v).toUpperCase()) === -1 }
];
function ensureFacets(saleList) {
  FACETS.forEach(f => {
    const seen = {};
    saleList.forEach(l => {
      const v = f.field(l);
      if (v === undefined || v === null || v === "") return;
      seen[v] = true;
      if (rules[f.key][v] === undefined) rules[f.key][v] = !f.bad(v);
    });
    if (f.key === "damages") {
      saleList.forEach(l => {
        const v = l.secondaryDamage;
        if (!v) return;
        seen[v] = true;
        if (rules[f.key][v] === undefined) rules[f.key][v] = !f.bad(v);
      });
    }
    Object.keys(rules[f.key]).forEach(k => { if (!seen[k]) delete rules[f.key][k]; });
  });
}

/* ---------------- pipeline (default rules; same stage order as runPipeline) ---------------- */
function runPipeline(saleList) {
  const cal = calibration();
  let cur = saleList.slice();
  const stage = test => { cur = cur.filter(l => !test(l)); };

  if (rules.rental) stage(l => l.rental ? null : "x");
  stage(l => l._noMileage ? "x" : null);
  if (rules.miles > 0) stage(l => l.mileage <= rules.miles ? null : "x");
  if (rules.yearMin > 0) stage(l => l.year >= rules.yearMin ? null : "x");
  stage(l => rules.titles[l.saleTitleType] !== false ? null : "x");
  stage(l => rules.makes[l.make] !== false ? null : "x");
  stage(l => {
    if (rules.damages[l.damageDescription] === false) return "x";
    if (l.secondaryDamage && rules.damages[l.secondaryDamage] === false) return "x";
    return null;
  });
  // noSecondary / runs / keys / retail range / repMax / distMax all off by default

  const afterHard = cur.length;
  const afterHardLots = cur.slice();

  stage(l => {
    if (l._noRepair || !(l.repairCost > 0)) return "x";
    if (!(l.estRetailValue > 0)) return "x";
    return null;
  });

  cur.forEach(l => {
    const e = estimateLot(l, cal);
    l._est = e;
    l._budget = e.sale - rules.margin - e.tow - e.parts - e.labor;
    l._ceiling = solveCeiling(l._budget);
    l._room = l._ceiling - (l.highBid || 0);
  });

  stage(l => l._ceiling > 0 ? null : "x");
  stage(l => l._room > 0 ? null : "x");
  cur.sort((a, b) => b._room - a._room);

  return { afterHard, afterHardLots, short: cur };
}

/* ---------------- triage seeder (exact copy of the in-page algorithm) ---------------- */
function seedTriage(afterHardLots) {
  const store = { saleKey: "sample sale · 400 lots · typical Monday", seeded: true, lots: {} };
  const TRIAGE_SEED = 20260813;
  const P_VIS = { room: 0.85, other: 0.42 };
  const P_CFX = { room: 0.90, other: 0.72 };
  const rt = rng(TRIAGE_SEED);
  // Draw discipline: ONE draw on a visual fail, TWO on a visual pass.
  afterHardLots.forEach(l => {
    const hasRoom = l._room > 0;
    const v = rt() < (hasRoom ? P_VIS.room : P_VIS.other);
    const c = v ? (rt() < (hasRoom ? P_CFX.room : P_CFX.other)) : null;
    store.lots[l.lotId] = { v: v ? "pass" : "fail",
                            c: c === null ? null : (c ? "pass" : "fail"),
                            cWhy: "", note: "", ts: 0 };
  });
  return store;
}

/* ================= assertions ================= */
const sale = generateSale(400, 20260803);
ok("generateSale(400, 20260803).length === 400", sale.length === 400, sale.length);

const badTimes = sale.filter(l => {
  const h = parseInt(l.saleTime.split(":")[0], 10);
  const m = l.saleTime.split(":")[1];
  return h < 12 || h > 15 || (m !== "00" && m !== "30");
});
ok("saleTime of every lot within 12:00–15:30", badTimes.length === 0,
   badTimes.slice(0, 3).map(l => l.saleTime).join(","));

ensureFacets(sale);
const cal = calibration();
ok("calibration source is ledger (6 sold units)", cal.source === "ledger" && cal.n === 6,
   cal.source + "/" + cal.n);

const pipe = runPipeline(sale);
ok("afterHard === 81", pipe.afterHard === 81, pipe.afterHard);
ok("shortlist (room>0) === 10", pipe.short.length === 10, pipe.short.length);

const store = seedTriage(pipe.afterHardLots);
let vis = 0, cfx = 0, ready = 0;
pipe.afterHardLots.forEach(l => {
  const t = store.lots[l.lotId];
  if (t.v === "pass") vis++;
  if (t.v === "pass" && t.c === "pass") { cfx++; if (l._room > 0) ready++; }
});
ok("seeded visual pass === 38", vis === 38, vis);
ok("seeded carfax pass === 30", cfx === 30, cfx);
ok("READY (v pass, c pass, room>0) === 7", ready === 7, ready);

// the story beats the SEED_NOTES in the page annotate — verdicts must match
const v = id => store.lots[id];
ok("58524793 (machine #1 pick, $5,228 room) dies at his visual gate",
   v("58524793") && v("58524793").v === "fail" && v("58524793").c === null,
   JSON.stringify(v("58524793") || null));
ok("58988847 (machine #2 pick) fails visual",
   v("58988847") && v("58988847").v === "fail", JSON.stringify(v("58988847") || null));
ok("58683366 (2025 Accord, manual bucket) dies at the Carfax gate",
   v("58683366") && v("58683366").v === "pass" && v("58683366").c === "fail",
   JSON.stringify(v("58683366") || null));
ok("58335067 (READY top lot) passes both",
   v("58335067") && v("58335067").v === "pass" && v("58335067").c === "pass",
   JSON.stringify(v("58335067") || null));

const top = pipe.short[0];
ok("machine's top shortlist lot is 58524793", top && top.lotId === "58524793", top && top.lotId);
const readyTop = pipe.short.filter(l => {
  const t = store.lots[l.lotId];
  return t.v === "pass" && t.c === "pass" && l._room > 0;
})[0];
ok("top READY lot is 58335067", readyTop && readyTop.lotId === "58335067", readyTop && readyTop.lotId);

console.log("");
if (fails) { console.log("RESULT: FAIL (" + fails + ")"); process.exit(1); }
console.log("RESULT: PASS — 400 -> 81 -> 38 -> 30 -> 7 pinned");
