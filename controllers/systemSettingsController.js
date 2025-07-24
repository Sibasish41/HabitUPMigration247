const { SystemSetting } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class SystemSettingsController {
  // Get public settings (accessible to all users)
  async getPublicSettings(req, res, next) {
    try {
      const publicSettings = await SystemSetting.getPublicSettings();
      
      res.json({
        success: true,
        data: publicSettings
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all settings (admin only)
  async getAllSettings(req, res, next) {
    try {
      const { category, search, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const whereClause = {};
      
      if (category) {
        whereClause.category = category;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { settingKey: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: settings } = await SystemSetting.findAndCountAll({
        where: whereClause,
        include: [{
          model: require('../models').User,
          as: 'modifier',
          attributes: ['userId', 'name', 'email'],
          required: false
        }],
        order: [['category', 'ASC'], ['settingKey', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          settings,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalSettings: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific setting by key
  async getSettingByKey(req, res, next) {
    try {
      const { key } = req.params;
      
      const setting = await SystemSetting.findOne({
        where: { settingKey: key },
        include: [{
          model: require('../models').User,
          as: 'modifier',
          attributes: ['userId', 'name', 'email'],
          required: false
        }]
      });

      if (!setting) {
        return next(new ApiError('Setting not found', 404));
      }

      // Check if user has permission to view this setting
      if (!setting.isPublic && req.user.userType !== 'ADMIN' && req.user.userType !== 'SYSTEM_ADMIN') {
        return next(new ApiError('Access denied', 403));
      }

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }

  // Create or update setting (admin only)
  async setSetting(req, res, next) {
    try {
      const {
        settingKey,
        settingValue,
        settingType = 'STRING',
        category = 'GENERAL',
        description,
        isPublic = false,
        isReadOnly = false,
        defaultValue,
        validationRules
      } = req.body;

      if (!settingKey) {
        return next(new ApiError('Setting key is required', 400));
      }

      // Check if setting exists and is read-only
      const existingSetting = await SystemSetting.findOne({
        where: { settingKey }
      });

      if (existingSetting && existingSetting.isReadOnly) {
        return next(new ApiError('Cannot modify read-only setting', 400));
      }

      // Validate setting type and value
      if (settingType === 'BOOLEAN' && !['true', 'false'].includes(String(settingValue).toLowerCase())) {
        return next(new ApiError('Boolean setting must be true or false', 400));
      }

      if (settingType === 'NUMBER' && isNaN(Number(settingValue))) {
        return next(new ApiError('Number setting must be a valid number', 400));
      }

      if (settingType === 'JSON') {
        try {
          JSON.parse(settingValue);
        } catch {
          return next(new ApiError('JSON setting must be valid JSON', 400));
        }
      }

      const setting = await SystemSetting.setValue(settingKey, settingValue, req.user.userId);
      
      // Update other properties if it's a new setting or update allowed
      if (!existingSetting || !existingSetting.isReadOnly) {
        await setting.update({
          settingType,
          category,
          description,
          isPublic,
          isReadOnly,
          defaultValue,
          validationRules
        });
      }

      res.json({
        success: true,
        message: 'Setting updated successfully',
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete setting (admin only)
  async deleteSetting(req, res, next) {
    try {
      const { key } = req.params;
      
      const setting = await SystemSetting.findOne({
        where: { settingKey: key }
      });

      if (!setting) {
        return next(new ApiError('Setting not found', 404));
      }

      if (setting.isReadOnly) {
        return next(new ApiError('Cannot delete read-only setting', 400));
      }

      await setting.destroy();

      res.json({
        success: true,
        message: 'Setting deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get settings by category
  async getSettingsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { includePrivate = false } = req.query;
      
      const whereClause = { category };
      
      // Non-admin users can only see public settings
      if (req.user.userType !== 'ADMIN' && req.user.userType !== 'SYSTEM_ADMIN') {
        whereClause.isPublic = true;
      } else if (!includePrivate) {
        whereClause.isPublic = true;
      }

      const settings = await SystemSetting.findAll({
        where: whereClause,
        order: [['settingKey', 'ASC']]
      });

      // Convert to key-value pairs for easier consumption
      const settingsMap = {};
      for (const setting of settings) {
        settingsMap[setting.settingKey] = await SystemSetting.getValue(setting.settingKey);
      }

      res.json({
        success: true,
        data: settingsMap
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset setting to default value
  async resetSetting(req, res, next) {
    try {
      const { key } = req.params;
      
      const setting = await SystemSetting.findOne({
        where: { settingKey: key }
      });

      if (!setting) {
        return next(new ApiError('Setting not found', 404));
      }

      if (setting.isReadOnly) {
        return next(new ApiError('Cannot reset read-only setting', 400));
      }

      if (!setting.defaultValue) {
        return next(new ApiError('No default value defined for this setting', 400));
      }

      await setting.update({
        settingValue: setting.defaultValue,
        lastModifiedBy: req.user.userId
      });

      res.json({
        success: true,
        message: 'Setting reset to default value successfully',
        data: setting
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update settings
  async bulkUpdateSettings(req, res, next) {
    try {
      const { settings } = req.body;
      
      if (!Array.isArray(settings)) {
        return next(new ApiError('Settings must be an array', 400));
      }

      const results = [];
      const errors = [];

      for (const settingData of settings) {
        try {
          const { settingKey, settingValue } = settingData;
          
          if (!settingKey) {
            errors.push({ settingKey, error: 'Setting key is required' });
            continue;
          }

          // Check if setting exists and is read-only
          const existingSetting = await SystemSetting.findOne({
            where: { settingKey }
          });

          if (existingSetting && existingSetting.isReadOnly) {
            errors.push({ settingKey, error: 'Cannot modify read-only setting' });
            continue;
          }

          const setting = await SystemSetting.setValue(settingKey, settingValue, req.user.userId);
          results.push({ settingKey, success: true, data: setting });
          
        } catch (error) {
          errors.push({ settingKey: settingData.settingKey, error: error.message });
        }
      }

      res.json({
        success: true,
        message: `Updated ${results.length} settings successfully`,
        data: {
          successful: results,
          failed: errors
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SystemSettingsController();
