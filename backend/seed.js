const mongoose = require('mongoose');
require('dotenv').config();

const Config = require('./models/Config');
const Lead = require('./models/Lead');
const { calculateEstimate } = require('./services/calculator');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wandee_estimator';

const seedConfigV3 = {
  config_version: 3,
  business: {
    name: 'Apex Roofing & Solar',
    region: 'Texas / Southwest Region',
    currency: 'USD'
  },
  modifiers: {
    waste_factor: 0.15,
    permit_flat_fee: 250,
    range_spread_pct: 10
  },
  questions: [
    {
      key: 'roof_area',
      label: 'Roof Area (sq ft)',
      type: 'number',
      unit: 'sq ft',
      required: true,
      min: 500,
      max: 10000,
      active: true,
      options: []
    },
    {
      key: 'material',
      label: 'Roofing Material',
      type: 'select',
      unit: '',
      required: true,
      active: true,
      options: [
        { label: '3-Tab Asphalt Shingles', value: '3_tab_asphalt', rate: 3.50 },
        { label: 'Architectural Shingles', value: 'architectural_shingles', rate: 4.75 },
        { label: 'Standing Seam Metal', value: 'metal_standing_seam', rate: 9.50 },
        { label: 'Clay Tile', value: 'clay_tile', rate: 14.00 }
      ]
    },
    {
      key: 'pitch',
      label: 'Roof Pitch / Steepness',
      type: 'select',
      unit: '',
      required: true,
      active: true,
      options: [
        { label: 'Low Pitch (Flat - 4/12)', value: 'flat_low', multiplier: '1.00' },
        { label: 'Moderate Pitch (5/12 - 8/12)', value: 'moderate', multiplier: '1.12' },
        { label: 'Steep Pitch (9/12 - 12/12)', value: 'steep', multiplier: '1.25' },
        { label: 'Very Steep (> 12/12)', value: 'very_steep', multiplier: '1.40' }
      ]
    },
    {
      key: 'layers',
      label: 'Tear-off Layers Needed',
      type: 'select',
      unit: '',
      required: true,
      active: true,
      options: [
        { label: 'No Tear-off Needed (New / Overlay)', value: 'none', rate: 0.00 },
        { label: '1 Layer Tear-off', value: '1_layer', rate: 1.25 },
        { label: '2 Layers Tear-off', value: '2_layers', rate: 2.10 }
      ]
    },
    {
      key: 'stories',
      label: 'Home Stories',
      type: 'select',
      unit: '',
      required: true,
      active: true,
      options: [
        { label: '1 Story', value: '1_story', multiplier: '1.00' },
        { label: '2 Stories', value: '2_stories', multiplier: '1.10' },
        { label: '3+ Stories', value: '3_plus_stories', multiplier: '1.25' }
      ]
    }
  ]
};

async function seed() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // Clear existing collections
    await Config.deleteMany({});
    await Lead.deleteMany({});
    console.log('Wiped existing Config and Lead collections.');

    // Seed Config Version 3
    const configDoc = await Config.create(seedConfigV3);
    console.log(`Seeded Config Version ${configDoc.config_version}`);

    // Seed Historical Leads
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const anaAnswers = {
      roof_area: 2200,
      material: 'architectural_shingles',
      pitch: 'moderate',
      layers: '1_layer',
      stories: '2_stories'
    };
    const anaCalc = calculateEstimate(anaAnswers, seedConfigV3);

    const priyaAnswers = {
      roof_area: 3400,
      material: 'metal_standing_seam',
      pitch: 'steep',
      layers: '1_layer',
      stories: '2_stories'
    };
    const priyaCalc = calculateEstimate(priyaAnswers, seedConfigV3);

    const historicalLeads = [
      {
        name: 'Ana Ruiz',
        phone: '(512) 555-0192',
        email: 'ana.ruiz@example.com',
        config_version: 3,
        captured_at: twoDaysAgo,
        answers: anaAnswers,
        estimate_low: anaCalc.estimate_low,
        estimate_high: anaCalc.estimate_high
      },
      {
        name: 'Bill Tanner',
        phone: '(512) 555-0841',
        email: 'btanner77@example.com',
        config_version: 2,
        captured_at: tenDaysAgo,
        answers: {
          roof_area: 1800,
          material: '3_tab_asphalt',
          pitch: 'flat_low',
          layers: 'none',
          stories: '1_story',
          legacy_gutters: true,
          old_roof_type: 'wood_shake'
        },
        estimate_low: 7200,
        estimate_high: 8800
      },
      {
        name: 'Priya Nair',
        phone: '(512) 555-0333',
        email: 'pnair@example.com',
        config_version: 3,
        captured_at: oneDayAgo,
        answers: priyaAnswers,
        estimate_low: priyaCalc.estimate_low,
        estimate_high: priyaCalc.estimate_high
      }
    ];

    const seededLeads = await Lead.insertMany(historicalLeads);
    console.log(`Seeded ${seededLeads.length} historical leads:`);
    seededLeads.forEach((lead) => {
      console.log(` - ${lead.name} (${lead.email}): Low $${lead.estimate_low} / High $${lead.estimate_high}`);
    });

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
