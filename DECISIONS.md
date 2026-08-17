# Architectural Decisions & Technical Documentation

---

## 1. Assumptions Made

1. **Defensive Multiplier & Rate Coercion**:
   Seed data and administrative inputs may store multipliers as numbers (`1.12`) or strings (`"1.12"`). A centralized float coercion helper (`safeParseFloat`) normalizes string inputs and applies fallbacks (`1.0` multiplier, `$0.00` rate) to prevent runtime `NaN` pollution.

2. **Fallback Values for Missing Modifiers**:
   If modifier settings (e.g. `waste_factor`, `permit_flat_fee`, `range_spread_pct`) are omitted or corrupt in MongoDB, the pricing engine defaults to roofing industry standards: `15%` waste factor, `$250` flat permit fee, and a `10%` low/high range spread.

3. **Non-Strict Schema for Dynamic Answers**:
   Homeowner responses are stored as a flexible key-value object (`answers: Map/Mixed`) tied to the active config version at submission time. Historical leads may contain legacy fields (e.g., `chimney_count`, `legacy_gutters`, `old_roof_type`). The Owner Dashboard handles unmapped legacy keys gracefully by formatting them into human-readable titles instead of crashing.

---

## 2. Calculation Formula Breakdown

Pricing calculations execute exclusively on the server (`POST /api/estimate`) using the following formula:

1. **Base Cost Calculation**:
   $$\text{Base Cost} = (\text{Roof Area} \times \text{Material Rate}) + (\text{Roof Area} \times \text{Tear-off Rate})$$

2. **Subtotal Calculation**:
   $$\text{Subtotal} = \text{Base Cost} \times \text{Pitch Multiplier} \times \text{Stories Multiplier} \times (1 + \text{Waste Factor})$$

3. **Total Estimated Cost**:
   $$\text{Total Cost} = \text{Subtotal} + \text{Permit Flat Fee}$$

4. **Estimate Range Output**:
   - **Low Estimate**: $\text{Math.round}(\text{Total Cost} \times (1 - \frac{\text{Range Spread \%}}{100}))$
   - **High Estimate**: $\text{Math.round}(\text{Total Cost} \times (1 + \frac{\text{Range Spread \%}}{100}))$

---

## 3. Deliberate Scope Cuts

- **Multi-User RBAC / OAuth**: Omitted complex multi-user role-based access control and OAuth providers in favor of a single header-based secret key authentication (`Bearer <ADMIN_SECRET>`). This prioritizes simplicity for small business owners while remaining secure over HTTPS.
- **Drag-and-Drop Question Reordering**: Omitted visual drag-and-drop ordering libraries to minimize frontend bundle size. Question order is governed predictably by array index in the active configuration.

---

## 4. Questions for Dale

1. **Mid-Session Schema Updates**: If an owner updates rates or adds a question while a homeowner is midway through filling out an estimate, should the backend validate against the schema version active when the session started or at submission time?
2. **Minimum Roof Area Threshold**: Should the estimator enforce a minimum square footage limit (e.g. 500 sq ft) or support flat minimum job charges for small structures (e.g., sheds or detached garages)?

---

## 5. 1-Week Feature Roadmap

- **Day 1–2**: Webhook Integrations (Zapier, Make, HubSpot) to automatically route new lead payloads to CRM platforms upon submission.
- **Day 3**: One-click CSV / Excel export functionality in the Owner Dashboard Leads Viewer.
- **Day 4–5**: Automated SMS and Email confirmation alerts (via Twilio and SendGrid) delivering PDF price estimates to homeowners.
