const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Doctor = sequelize.define('Doctor', {
  doctorId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  accountStatus: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'),
    allowNull: false,
    defaultValue: 'PENDING_APPROVAL'
  },
  profilePhoto: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consultationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  availableHours: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object storing available time slots'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastLoginDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verificationDocuments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON array storing document URLs'
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  hooks: {
    beforeCreate: async (doctor) => {
      if (doctor.password) {
        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(doctor.password, salt);
      }
    },
    beforeUpdate: async (doctor) => {
      if (doctor.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(doctor.password, salt);
      }
    }
  }
});

// Instance methods
Doctor.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

Doctor.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Calculate average rating
Doctor.prototype.updateRating = async function(newRating) {
  const currentTotal = this.rating * this.totalRatings;
  const newTotal = currentTotal + newRating;
  const newCount = this.totalRatings + 1;
  
  await this.update({
    rating: (newTotal / newCount).toFixed(2),
    totalRatings: newCount
  });
};

module.exports = Doctor;
