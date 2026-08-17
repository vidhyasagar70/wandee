const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const Lead = require('../models/Lead');
const { calculateEstimate } = require('../services/calculator');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/config/active
 * Returns the latest active configuration for the public estimator (only active questions).
 */
router.get('/config/active', async (req, res) => {
  try {
    const latestConfig = await Config.findOne().sort({ config_version: -1 }).lean();

    if (!latestConfig) {
      return res.status(404).json({ error: 'No configuration found' });
    }

    // Filter questions to return only active ones for public UI
    const activeQuestions = (latestConfig.questions || []).filter((q) => q.active !== false);

    const publicConfig = {
      ...latestConfig,
      questions: activeQuestions
    };

    return res.json(publicConfig);
  } catch (error) {
    console.error('Error fetching active config:', error);
    return res.status(500).json({ error: 'Failed to retrieve active configuration' });
  }
});

/**
 * GET /api/admin/config
 * Returns the full latest config (including inactive questions) for the owner panel.
 */
router.get('/admin/config', authMiddleware, async (req, res) => {
  try {
    const latestConfig = await Config.findOne().sort({ config_version: -1 }).lean();

    if (!latestConfig) {
      return res.status(404).json({ error: 'No configuration found' });
    }

    return res.json(latestConfig);
  } catch (error) {
    console.error('Error fetching admin config:', error);
    return res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

/**
 * PUT /api/admin/config
 * Updates rates, labels, active status, modifiers, or increments version.
 */
router.put('/admin/config', authMiddleware, async (req, res) => {
  try {
    const { config_version, business, questions, modifiers, createNewVersion } = req.body;

    let targetConfig = await Config.findOne().sort({ config_version: -1 });

    if (!targetConfig || createNewVersion) {
      const nextVersion = targetConfig ? targetConfig.config_version + 1 : 1;
      targetConfig = new Config({
        config_version: config_version || nextVersion,
        business: business || (targetConfig ? targetConfig.business : { name: 'Default Business' }),
        questions: questions || (targetConfig ? targetConfig.questions : []),
        modifiers: modifiers || (targetConfig ? targetConfig.modifiers : {})
      });
    } else {
      if (business) targetConfig.business = business;
      if (questions) targetConfig.questions = questions;
      if (modifiers) targetConfig.modifiers = modifiers;
      if (config_version) targetConfig.config_version = config_version;
    }

    await targetConfig.save();
    return res.json({
      message: 'Configuration updated successfully',
      config: targetConfig
    });
  } catch (error) {
    console.error('Error updating admin config:', error);
    return res.status(500).json({ error: 'Failed to update configuration', details: error.message });
  }
});

/**
 * POST /api/estimate
 * Accepts contact info + answers object, validates required fields,
 * runs pricing calculation, saves Lead in MongoDB, and returns estimate results.
 */
router.post('/estimate', async (req, res) => {
  try {
    const { name, phone, email, answers } = req.body;

    // Contact info validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const userAnswers = answers && typeof answers === 'object' ? answers : {};

    // Fetch latest active config to validate answers & run calculation
    const currentConfig = await Config.findOne().sort({ config_version: -1 }).lean();
    if (!currentConfig) {
      return res.status(500).json({ error: 'Active configuration is unavailable' });
    }

    // Validate required questions
    const activeQuestions = (currentConfig.questions || []).filter((q) => q.active !== false);
    for (const q of activeQuestions) {
      if (q.required) {
        const val = userAnswers[q.key];
        if (val === undefined || val === null || val === '') {
          return res.status(400).json({
            error: `Missing required answer for: ${q.label || q.key}`,
            field: q.key
          });
        }
      }
    }

    // Pure pricing calculation on server
    const calculation = calculateEstimate(userAnswers, currentConfig);

    // Save Lead to MongoDB
    const lead = new Lead({
      config_version: currentConfig.config_version,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      answers: userAnswers,
      estimate_low: calculation.estimate_low,
      estimate_high: calculation.estimate_high
    });

    await lead.save();

    return res.status(201).json({
      estimate_low: calculation.estimate_low,
      estimate_high: calculation.estimate_high,
      leadId: lead._id.toString(),
      currency: currentConfig.business ? currentConfig.business.currency || 'USD' : 'USD'
    });
  } catch (error) {
    console.error('Error processing estimate:', error);
    return res.status(500).json({ error: 'Failed to generate estimate', details: error.message });
  }
});

/**
 * GET /api/admin/leads
 * Returns list of all leads sorted by captured_at descending.
 */
router.get('/admin/leads', authMiddleware, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ captured_at: -1 }).lean();

    // Map _id to id for clean API output
    const formattedLeads = leads.map((lead) => ({
      ...lead,
      id: lead._id.toString()
    }));

    return res.json(formattedLeads);
  } catch (error) {
    console.error('Error fetching admin leads:', error);
    return res.status(500).json({ error: 'Failed to retrieve leads' });
  }
});

module.exports = router;
