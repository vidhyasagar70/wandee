/**
 * Defensive float parsing helper
 * @param {any} val - Value to parse (string, number, etc.)
 * @param {number} fallback - Default value if parsing fails or result is NaN
 * @returns {number}
 */
function safeParseFloat(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Calculates pricing estimates based on user answers and configuration schema.
 * 
 * Formula:
 * - Base = (roof_area * material_rate) + (roof_area * tear_off_rate)
 * - Subtotal = Base * pitch_multiplier * stories_multiplier * (1 + waste_factor)
 * - Total = Subtotal + permit_flat_fee
 * - Low = Total * (1 - range_spread_pct / 100)
 * - High = Total * (1 + range_spread_pct / 100)
 * 
 * @param {Object} answers - Key-value map of user responses
 * @param {Object} config - MongoDB Config document or object containing questions & modifiers
 * @returns {Object} { base, subtotal, total, estimate_low, estimate_high, breakdown }
 */
function calculateEstimate(answers = {}, config = {}) {
  const questions = config.questions || [];
  const modifiers = config.modifiers || {};

  // Extract modifiers with defensive defaults
  const waste_factor = safeParseFloat(modifiers.waste_factor, 0.15);
  const permit_flat_fee = safeParseFloat(modifiers.permit_flat_fee, 0);
  const range_spread_pct = safeParseFloat(modifiers.range_spread_pct, 10);

  // 1. Roof Area
  const roof_area = safeParseFloat(answers.roof_area, 0);

  // Helper to find selected option for a given question key
  const getSelectedOption = (questionKey) => {
    const question = questions.find((q) => q.key === questionKey);
    if (!question || !question.options) return null;
    const answerValue = answers[questionKey];
    return question.options.find((opt) => opt.value === answerValue) || null;
  };

  // 2. Material Rate
  const materialOption = getSelectedOption('material');
  const material_rate = safeParseFloat(materialOption ? materialOption.rate : 0, 0);

  // 3. Tear-off Rate (Layers)
  const layersOption = getSelectedOption('layers');
  const tear_off_rate = safeParseFloat(layersOption ? layersOption.rate : 0, 0);

  // 4. Pitch Multiplier (defensively parse string multipliers like "1.12")
  const pitchOption = getSelectedOption('pitch');
  const pitch_multiplier = safeParseFloat(pitchOption ? pitchOption.multiplier : 1, 1.0);

  // 5. Stories Multiplier (defensively parse string multipliers like "1.10")
  const storiesOption = getSelectedOption('stories');
  const stories_multiplier = safeParseFloat(storiesOption ? storiesOption.multiplier : 1, 1.0);

  // --- Formula Calculations ---
  // Base = (roof_area * material_rate) + (roof_area * tear_off_rate)
  const material_cost = roof_area * material_rate;
  const tear_off_cost = roof_area * tear_off_rate;
  const base = material_cost + tear_off_cost;

  // Subtotal = Base * pitch_multiplier * stories_multiplier * (1 + waste_factor)
  const subtotal = base * pitch_multiplier * stories_multiplier * (1 + waste_factor);

  // Total = Subtotal + permit_flat_fee
  const total = subtotal + permit_flat_fee;

  // Low = Total * (1 - range_spread_pct / 100)
  // High = Total * (1 + range_spread_pct / 100)
  const low = total * (1 - range_spread_pct / 100);
  const high = total * (1 + range_spread_pct / 100);

  // Round to nearest integer (or 2 decimals)
  const estimate_low = Math.round(low);
  const estimate_high = Math.round(high);

  return {
    base: Math.round(base * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    estimate_low,
    estimate_high,
    breakdown: {
      roof_area,
      material_rate,
      tear_off_rate,
      pitch_multiplier,
      stories_multiplier,
      waste_factor,
      permit_flat_fee,
      range_spread_pct
    }
  };
}

module.exports = {
  calculateEstimate,
  safeParseFloat
};
