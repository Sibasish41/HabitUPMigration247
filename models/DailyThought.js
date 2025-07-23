const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyThought = sequelize.define('DailyThought', {
  thoughtId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('MOTIVATION', 'INSPIRATION', 'WELLNESS', 'SUCCESS', 'MINDFULNESS', 'PRODUCTIVITY', 'GENERAL'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Higher number = higher priority'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of tags for categorization'
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'en'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Specific date when this thought should be shown'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  likeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'daily_thoughts',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['scheduledDate']
    }
  ]
});

// Static method to get today's thought
DailyThought.getTodaysThought = async (category = null) => {
  const today = new Date().toISOString().split('T')[0];
  
  const whereClause = {
    isActive: true
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  // First try to get a thought scheduled for today
  let thought = await DailyThought.findOne({
    where: {
      ...whereClause,
      scheduledDate: today
    },
    order: [['priority', 'DESC']]
  });
  
  // If no scheduled thought, get a random one
  if (!thought) {
    thought = await DailyThought.findOne({
      where: {
        ...whereClause,
        scheduledDate: null
      },
      order: sequelize.random(),
      limit: 1
    });
  }
  
  // Increment view count
  if (thought) {
    await thought.increment('viewCount');
  }
  
  return thought;
};

module.exports = DailyThought;
