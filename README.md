# Case 006 · Juan Azuaje · Bid Sheet

Working demo for a one-man operator who buys damaged rental vehicles at Copart
on Mondays and Wednesdays, repairs them, and resells them.

**Status: V2 demo, no client signed. Nothing here has been shown to Juan yet.**

`hoja-de-puja.html` is **one file, no dependencies, no build**. Double click and
it runs. All state lives in `localStorage` — nothing leaves the browser.

To serve locally if needed: `python3 -m http.server 8000`

---

## The nine screens, in the order they get used

| Tab | What it solves |
|---|---|
| **00 Start here** | Onboarding panel and a guided tour of the other eight |
| **01 List** | Loads a sale and narrows it to a shortlist, showing which rule killed each lot |
| **02 Filters** | His exclusion rules as editable code, with live counts and savable profiles |
| **03 Pre-bid** | The 8:00 morning: triage queue for his photo read and Carfax call, three-gate readiness, the noon bid board |
| **04 Bid** | Bid ceiling with Copart's fees **solved**, not estimated, plus the lot photo |
| **05 Parts** | Damage map, parts checklist by damage type, learned price memory, tow by real distance |
| **06 Pipeline** | Every owned car staged won to sold: transport, shop sub-stages, parts orders, shelf inventory, the daily carry clock |
| **07 Ledger** | Projected against real, unit by unit, financing interest included |
| **08 Your numbers** | Estimation bias, recalibrated formula, and seven charts |

Plus: dark mode, a command palette (`Ctrl`/`Cmd`+`K`), CSV export of the
shortlist, and a lightbox for the lot photos.

---

## LO IMPORTANTE: what is real and what is invented

This cannot be blurred when showing it. Stated without ambiguity:

### Real and verified

- **The 61-column Copart schema.** Measured over 5,000 live lots (13–17 Jul 2026).
  Sample in `data/muestra-copart-2026-07-17.csv`.
- **The 45 yards with their ZIP codes, geocoded.** `data/yards-copart-geocoded.json`.
  The tow cost is a real distance between them.
- **Field population rates** (see Findings below).
- **NHTSA vPIC**: tested live. 41 fields per VIN, batches of 50, 5 VINs in 0.70s.
  Free, no key, no cap. Not yet wired in — it lands when this moves to a server.
- **The bid-ceiling solver.** Verified exact against brute force.

### Invented

- **The 400 demo lots** (a typical Monday; peak days run 800+). Generated from a fixed seed. None exist. The
  *distributions* are calibrated against the real data; the *lots* are not.
- **The 6 sold Ledger units, the 7 active pipeline units, their parts orders and their loans** and every calibration factor derived from them. All financing values are labelled generated.
- **The parts templates.** Copart does not publish which parts a car needs — its
  damage vocabulary is 22 words. The templates are trade knowledge, written by us.
- **The base parts prices** and the severity factors.
- **The Copart fee table.** Editable on purpose: replace it with a real invoice
  from Juan and it stays calibrated.
- **The four vehicle photographs.** Generated examples, labelled `EXAMPLE`
  on screen. Not Copart images — see the architecture rules below.

---

## Findings measured on 5,000 lots (13–17 Jul 2026)

**Yard 838 "RENTAL VEHICLE SALE" is Juan's sale.** It runs Mondays (83) and
Wednesdays (39), no other day — exactly matching his description. It holds 90.4%
of lots flagged `rentals=true`. Profile: clean title 74.6% · FRONT END 51.6% ·
median mileage 41,428 · median year 2025 · Nissan 28, Kia 23, Toyota 15.

| Field | Populated | Note |
|---|---|---|
| `damageDescription` | 100% | Only 22 distinct values in the whole universe |
| `saleTitleType` | 100% | **83 distinct codes, 258 state+code combinations** |
| `estRetailValue` | — | **Redacted as `[PREMIUM]` in the free sample** |
| `repairCost` | 69.7% | Dollar figure, no breakdown. Median $10,944 |
| `mileage` | 87.6% | 12.4% arrive as 0, meaning absent, not zero miles |
| `secondaryDamage` | 48.3% | |
| `autoGrade` | 4.6% | Any score weighting it is imputing on 95% of lots |
| `FRAME DAMAGE` | 0.1% | 6 of 5,000. This is why structural damage is his biggest risk |

**Formats that break naive code:** `rentals` (plural) · `runsDrives` =
"Run & Drive Verified" / "Vehicle Starts" / "DEFAULT" · `hasKeys` = YES/NO/EXM ·
damage in UPPERCASE · `locationZip` sometimes carries ZIP+4 with a space.

**Copart's fees are not publicly available.** Their official pages return empty
shells (JavaScript behind Imperva) and third-party calculators contradict each
other. The table in the app is editable deliberately.

---

## Architecture decisions that are not negotiable

1. **Never automate a logged-in session** on Copart, Manheim, Carfax or eBay.
2. **Never bid automatically.** It is the one thing that can cost him his Copart account.
3. **Never download or rehost photographs.** Store the URL, render from origin.
   The demo's four images are generated examples, labelled as such.
4. **Carfax stays manual**, under his login, shortlist only. Nothing is derived from it.
5. **eBay by links, not ingestion.** The button builds the search; the price is read on eBay.
6. **The sale list is his**, exported under his own membership. No aggregator, no contract.

Never promise the tool catches structural damage. It says the opposite, on screen,
before he asks.

---

## Known defects, now closed (V2)

The three defects this section used to carry were fixed and re-verified in V2,
plus one the adversarial review caught in the fix itself:

- **The calibration loop closes correctly.** openBuy() now freezes the lot's
  RAW Copart figures (cpRepair, estRetail) onto every purchased unit, so
  calibration() and templateFactor() learn from real purchases. The first fix
  stored the calibrated sheet values instead, which would have converged the
  factors to 1.0 and quietly inflated future ceilings; review caught it, and
  hand-entered units now stay out of the sample entirely.
- **The structural reserve (cont) persists** onto the unit.
- **Segment coloring compares the group average target**, not the first unit's.
- **One financing truth.** The pipeline and financing layers briefly shipped
  parallel formulas (/365 vs /360); the financing layer now exports the single
  source and the pipeline delegates to it.

## Open — what blocks the next phase

1. **What columns does Juan's member CSV export carry?** We know what the site
   *shows*; we do not know what the *export* contains. If it lacks
   `estRetailValue`, the automatic estimate must be redesigned. **Resolved by one
   file of his, from any old Monday.**
2. **Are his ~200 pre- or post-filter?** Decides whether there is coverage to win.
   The first run on a real list answers it without asking him.
3. **Is the site's "Rental Vehicles" category the same universe as the `rentals` flag?**
4. **The photographs.** They are the only real source of which parts are broken,
   and the line we said we do not cross. Juan's decision, in writing, not ours in silence.

---

## Tests

```bash
node tests/solver-techo-puja.test.js     # ceiling accuracy vs brute force
node tests/calibracion-piezas.test.js    # parts template against the ledger
node tests/reseed-triage.test.js         # pins the demo story: 400 -> 81 -> 38 -> 30 -> 7 READY
```

The solver has a trap: the fee function **is not monotonic** — at $4,999 the
stepped fee is $535, and at $5,000 the 10% is $500, so it falls. A binary search
silently loses up to $35 of ceiling. It is solved per fee regime with local
repair. **Do not change it without running the test.**

---

## Design system

Minimalist console derived from a Stitch "Auction Auto Lifecycle Manager" study,
adapted to Arqentia's Instrument system: Hanken Grotesk, JetBrains Mono numerals,
warm neutral ground, zero border-radius, gapless hairline bento grids, one
inverted cell per view, blue `#2D5BFF` as the single accent.

Three-state theming — bare `:root` is light, `@media (prefers-color-scheme: dark)`
covers an un-stamped system-dark viewer, and `:root[data-theme="dark"]` lets the
toggle win in both directions. Chart palettes were validated with a
colour-vision checker rather than by eye; the light pair (`#2D5BFF` / `#A6342A`)
and the dark pair (`#3987E5` / `#E66767`) each clear every gate on their own surface.

Motion runs on three duration tiers (140 / 280 / 420ms), exits capped at 180ms,
and the whole layer is behind `prefers-reduced-motion`.
