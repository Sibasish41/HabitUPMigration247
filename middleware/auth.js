const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const authorize = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user permissions
      const userPermissions = await req.user.getPermissions();
      const userPermissionTypes = userPermissions.map(p => p.permissionType);

      // Check if user has required permissions
      const hasPermission = permissions.some(permission => 
        userPermissionTypes.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          required: permissions,
          userPermissions: userPermissionTypes
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Admin authorization
const requireAdmin = authorize(['ADMIN_ACCESS']);

// Doctor authorization
const requireDoctor = authorize(['DOCTOR_ACCESS']);

// User management permissions
const requireUserManagement = authorize(['MANAGE_USERS']);

module.exports = {
  authenticateToken,
  authorize,
  requireAdmin,
  requireDoctor,
  requireUserManagement
};
