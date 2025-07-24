const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'UserId'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'Email',
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Name'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'Password'
  },
  joinDate: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'joinDate'
  },
  dob: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'DOB'
  },
  phoneNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    field: 'phoneNumber'
  },
  accountStatus: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'),
    allowNull: false,
    defaultValue: 'PENDING',
    field: 'AccountStatus'
  },
  subscriptionType: {
    type: DataTypes.ENUM('FREE', 'PREMIUM', 'TRIAL'),
    allowNull: false,
    defaultValue: 'FREE'
  },
  profilePhoto: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'ProfilePhoto'
  },
  userType: {
    type: DataTypes.ENUM('USER', 'ADMIN', 'DOCTOR', 'SYSTEM_ADMIN'),
    allowNull: false,
    defaultValue: 'USER',
    field: 'userType'
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
    allowNull: false,
    field: 'gender'
  }
}, {
  tableName: 'user',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
