const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  settingId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  settingKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  settingValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settingType: {
    type: DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE'),
    allowNull: false,
    defaultValue: 'STRING'
  },
  category: {
    type: DataTypes.ENUM('GENERAL', 'EMAIL', 'PAYMENT', 'SECURITY', 'FEATURES', 'LIMITS', 'NOTIFICATIONS'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this setting can be accessed by non-admin users'
  },
  isReadOnly: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  defaultValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validationRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing validation rules'
  },
  lastModifiedBy: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'user',
      key: 'UserId'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  indexes: [
    {
      fields: ['settingKey'],
      unique: true
    },
    {
      fields: ['category']
    },
    {
      fields: ['isPublic']
    }
  ]
});

// Static method to get setting value with type conversion
SystemSetting.getValue = async (key, defaultValue = null) => {
  const setting = await SystemSetting.findOne({
    where: { settingKey: key }
  });
  
  if (!setting || setting.settingValue === null) {
    return defaultValue;
  }
  
  const value = setting.settingValue;
  
  switch (setting.settingType) {
    case 'NUMBER':
      return parseFloat(value);
    case 'BOOLEAN':
      return value.toLowerCase() === 'true';
    case 'JSON':
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    case 'DATE':
      return new Date(value);
    default:
      return value;
  }
};

// Static method to set setting value
SystemSetting.setValue = async (key, value, modifiedBy = null) => {
  let stringValue;
  
  if (typeof value === 'object' && value !== null) {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }
  
  const [setting] = await SystemSetting.findOrCreate({
    where: { settingKey: key },
    defaults: {
      settingKey: key,
      settingValue: stringValue,
      lastModifiedBy: modifiedBy
    }
  });
  
  if (setting.settingValue !== stringValue || setting.lastModifiedBy !== modifiedBy) {
    await setting.update({
      settingValue: stringValue,
      lastModifiedBy: modifiedBy
    });
  }
  
  return setting;
};

// Static method to get all public settings
SystemSetting.getPublicSettings = async () => {
  const settings = await SystemSetting.findAll({
    where: { isPublic: true },
    attributes: ['settingKey', 'settingValue', 'settingType', 'description']
  });
  
  const result = {};
  for (const setting of settings) {
    result[setting.settingKey] = await SystemSetting.getValue(setting.settingKey);
  }
  
  return result;
};

module.exports = SystemSetting;
