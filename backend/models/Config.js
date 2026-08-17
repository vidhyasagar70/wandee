const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  rate: { type: Number, default: 0 },
  multiplier: { type: mongoose.Schema.Types.Mixed, default: 1 } // May arrive as string "1.12" or number 1.12
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true, enum: ['number', 'select', 'radio', 'checkbox', 'text'] },
  unit: { type: String, default: '' },
  required: { type: Boolean, default: true },
  min: { type: Number },
  max: { type: Number },
  active: { type: Boolean, default: true },
  options: [OptionSchema]
}, { _id: false });

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, default: '' },
  currency: { type: String, default: 'USD' }
}, { _id: false });

const ModifiersSchema = new mongoose.Schema({
  waste_factor: { type: Number, default: 0.15 },
  permit_flat_fee: { type: Number, default: 0 },
  range_spread_pct: { type: Number, default: 10 }
}, { _id: false });

const ConfigSchema = new mongoose.Schema({
  config_version: { type: Number, required: true, unique: true, index: true },
  business: { type: BusinessSchema, required: true },
  questions: [QuestionSchema],
  modifiers: { type: ModifiersSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
