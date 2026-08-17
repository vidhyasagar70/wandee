const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  captured_at: { type: Date, default: Date.now },
  config_version: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  answers: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
  estimate_low: { type: Number, required: true },
  estimate_high: { type: Number, required: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Lead', LeadSchema);
