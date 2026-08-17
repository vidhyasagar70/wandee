# Architectural Decisions & Technical Trade-Offs

This document outlines the core technical decisions, trade-offs, pricing calculation formulas, assumptions, deliberate scope cuts, client follow-up questions, and product roadmap for the **Wantace Config-Driven Estimator & Owner Panel**.

---

## 1. Key Assumptions Made

### 1.1 Defensive Multiplier & Rate Coercion
Seed data and administrative inputs may store numerical values either as native floats (e.g. `1.12`) or as strings (e.g. `"1.12"`). To prevent `NaN` values from propagating into price calculations or throwing runtime exceptions, all numerical attributes pass through a defensive float coercion helper (`safeParseFloat`). If a value is missing, empty, or unparsable, sensible fallbacks are applied (`1.0` for multipliers, `$0.00` for rates).

### 1.2 Global Modifier Fallback Defaults
If business pricing modifiers (`waste_factor`, `permit_flat_fee`, `range_spread_pct`) are omitted or malformed in MongoDB documents, the backend pricing service applies default roofing industry baselines:
- **Waste Factor**: `0.15` (15% standard material waste allowance)
- **Permit Flat Fee**: `$250.00` (standard municipal roofing permit fee)
- **Range Spread Percentage**: `10%` (producing a ±10% range spread for the initial quote)

### 1.3 Flexible Non-Strict Answer Schemas for Backward Compatibility
Homeowner submissions store answers as a flexible key-value object (`answers: Map/Mixed`) tied to the active `config_version` at submission time. Historical leads generated under legacy schema versions (e.g. `v1` containing keys like `chimney_count` or `gutter_replace`) are preserved intact. The Owner Dashboard Lead Viewer dynamically renders arbitrary key-value pairs without breaking layout or crashing if a field no longer exists in the active config.

---

## 2. Calculation Formula Breakdown

All pricing calculations execute strictly on the backend (`POST /api/estimate`) to prevent client-side rate inspection or manipulation. The mathematical model breaks down into four sequential stages:

### Step 1: Base Materials & Labor Cost
$$\text{Material Cost} = \text{Roof Area (sq ft)} \times \text{Material Rate (\$/sq ft)}$$
$$\text{Tear-Off Cost} = \text{Roof Area (sq ft)} \times \text{Tear-Off Rate (\$/sq ft)}$$
$$\text{Base Cost} = \text{Material Cost} + \text{Tear-Off Cost}$$

### Step 2: Multipliers & Waste Allowance Subtotal
$$\text{Subtotal} = \text{Base Cost} \times \text{Pitch Multiplier} \times \text{Stories Multiplier} \times (1 + \text{Waste Factor})$$

### Step 3: Fixed Permit Fees & Total Cost
$$\text{Total Estimated Cost} = \text{Subtotal} + \text{Permit Flat Fee}$$

### Step 4: Estimated Range Spread
$$\text{Estimate Low} = \text{Math.round}\left(\text{Total Cost} \times \left(1 - \frac{\text{Range Spread \%}}{100}\right)\right)$$
$$\text{Estimate High} = \text{Math.round}\left(\text{Total Cost} \times \left(1 + \frac{\text{Range Spread \%}}{100}\right)\right)$$

#### Numerical Example (Default Seed Version 3):
- **Inputs**: Roof Area = `2,000 sq ft`, Material = Architectural Shingles (`$4.75/sq ft`), Tear-Off = 1 Layer (`$1.25/sq ft`), Pitch = Moderate (`1.12`), Stories = 2 Stories (`1.10`), Waste Factor = `0.15` (15%), Permit Fee = `$250`, Range Spread = `10%`.
- **Base Cost**: $(2000 \times 4.75) + (2000 \times 1.25) = 9,500 + 2,500 = \$12,000$
- **Subtotal**: $12,000 \times 1.12 \times 1.10 \times 1.15 = \$17,006.40$
- **Total Cost**: $\$17,006.40 + \$250.00 = \$17,256.40$
- **Low Estimate**: $\text{Math.round}(17,256.40 \times 0.90) = \$15,531$
- **High Estimate**: $\text{Math.round}(17,256.40 \times 1.10) = \$18,982$

---

## 3. Deliberate Scope Cuts

To deliver a production-ready, zero-defect solution within the 24-hour window, the following items were intentionally cut:

1. **Complex Multi-User RBAC & OAuth**: Replaced OAuth/JWT infrastructure with a single secret key credential check (`Bearer <ADMIN_SECRET>`). This minimizes operational setup overhead while remaining secure for single-owner operations over HTTPS.
2. **Drag-and-Drop Form Builder UI**: Omitted complex drag-and-drop reordering libraries in favor of predictable array-index rendering. Questions can be added, toggled active/inactive, and edited with zero bundle bloat.
3. **Real-Time Client-Side Calculation Previews**: Avoided calculating quotes client-side on keypress to prevent exposing internal markup rates and pricing formulas to end users via DevTools.

---

## 4. Clarifying Questions for Dale (Client / Stakeholder)

1. **Minimum Call-Out Job Size**: Should we enforce a minimum job size (e.g. 500 sq ft or minimum $1,500 base charge) to prevent underquoting on small repair projects like detached garages?
2. **Regional Tax & Multi-Jurisdiction Permits**: Do permit fees vary by city/zip code, and should we integrate automatic tax calculation based on property location?
3. **In-Flight Quote Expiration**: Should estimates carry an expiration window (e.g. 30 days) to protect margins against volatile shingle and lumber material cost inflation?

---

## 5. 1-Week Feature Roadmap

### Day 1–2: CRM Webhook Integration
- Implement outbound webhook triggers (`POST`) to push lead payloads directly into Zapier, Jobber, HubSpot, or Salesforce upon quote submission.

### Day 3: Lead Export & Reporting
- Add one-click CSV/Excel export in the Owner Dashboard Leads Viewer and summary metrics (total lead volume, average estimated quote value).

### Day 4: Custom Dynamic Question Builder
- Expand the Owner Panel UI to allow creating arbitrary new numeric, choice, or boolean questions with custom rate/multiplier rules on the fly.

### Day 5: Instant SMS & Email Alerts
- Integrate Twilio SMS and SendGrid to dispatch immediate quote confirmations to homeowners and send real-time lead alerts to Dale's smartphone.
