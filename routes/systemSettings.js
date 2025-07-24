const express = require('express');
const { body, param, query } = require('express-validator');
const systemSettingsController = require('../controllers/systemSettingsController');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware for admin permissions
const requireSystemAdmin = authorize(['MANAGE_SYSTEM_SETTINGS']);
const requireAdminOrSystemAdmin = authorize(['MANAGE_SYSTEM_SETTINGS', 'VIEW_SYSTEM_SETTINGS']);

// Public routes (no authentication required)
router.get('/public', systemSettingsController.getPublicSettings);

// Get all settings (admin only)
router.get('/all', [
  query('category').optional().isIn(['GENERAL', 'EMAIL', 'PAYMENT', 'SECURITY', 'FEATURES', 'LIMITS', 'NOTIFICATIONS']).withMessage('Invalid category'),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  requireAdminOrSystemAdmin
], systemSettingsController.getAllSettings);

// Get specific setting by key
router.get('/key/:key', [
  param('key').notEmpty().withMessage('Setting key is required'),
  requireAdminOrSystemAdmin
], systemSettingsController.getSettingByKey);

// Get settings by category
router.get('/category/:category', [
  param('category').isIn(['GENERAL', 'EMAIL', 'PAYMENT', 'SECURITY', 'FEATURES', 'LIMITS', 'NOTIFICATIONS']).withMessage('Invalid category'),
  query('includePrivate').optional().isBoolean().withMessage('includePrivate must be boolean')
], systemSettingsController.getSettingsByCategory);

// Create or update setting (system admin only)
router.post('/', [
  body('settingKey').notEmpty().withMessage('Setting key is required'),
  body('settingValue').exists().withMessage('Setting value is required'),
  body('settingType').optional().isIn(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE']).withMessage('Invalid setting type'),
  body('category').optional().isIn(['GENERAL', 'EMAIL', 'PAYMENT', 'SECURITY', 'FEATURES', 'LIMITS', 'NOTIFICATIONS']).withMessage('Invalid category'),
  body('description').optional().isString(),
  body('isPublic').optional().isBoolean(),
  body('isReadOnly').optional().isBoolean(),
  body('defaultValue').optional(),
  body('validationRules').optional().isObject(),
  requireSystemAdmin
], systemSettingsController.setSetting);

// Update setting (system admin only)
router.put('/:key', [
  param('key').notEmpty().withMessage('Setting key is required'),
  body('settingValue').exists().withMessage('Setting value is required'),
  body('settingType').optional().isIn(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE']).withMessage('Invalid setting type'),
  body('category').optional().isIn(['GENERAL', 'EMAIL', 'PAYMENT', 'SECURITY', 'FEATURES', 'LIMITS', 'NOTIFICATIONS']).withMessage('Invalid category'),
  body('description').optional().isString(),
  body('isPublic').optional().isBoolean(),
  body('isReadOnly').optional().isBoolean(),
  body('defaultValue').optional(),
  body('validationRules').optional().isObject(),
  requireSystemAdmin
], systemSettingsController.setSetting);

// Delete setting (system admin only)
router.delete('/:key', [
  param('key').notEmpty().withMessage('Setting key is required'),
  requireSystemAdmin
], systemSettingsController.deleteSetting);

// Reset setting to default value (system admin only)
router.post('/:key/reset', [
  param('key').notEmpty().withMessage('Setting key is required'),
  requireSystemAdmin
], systemSettingsController.resetSetting);

// Bulk update settings (system admin only)
router.post('/bulk-update', [
  body('settings').isArray().withMessage('Settings must be an array'),
  body('settings.*.settingKey').notEmpty().withMessage('Each setting must have a key'),
  body('settings.*.settingValue').exists().withMessage('Each setting must have a value'),
  requireSystemAdmin
], systemSettingsController.bulkUpdateSettings);

module.exports = router;
