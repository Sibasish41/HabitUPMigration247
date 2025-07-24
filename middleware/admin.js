const { ApiError } = require('./errorHandler');

// Admin middleware - checks if user has admin role
const adminMiddleware = (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    // Check if user has admin role
    const { userType, role } = req.user;
    
    if (userType !== 'ADMIN' && role !== 'admin' && role !== 'super_admin') {
      return next(new ApiError('Admin access required', 403));
    }

    next();
  } catch (error) {
    next(new ApiError('Admin authorization failed', 500));
  }
};

// Super admin middleware - checks if user has super admin role
const superAdminMiddleware = (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    // Check if user has super admin role
    const { userType, role } = req.user;
    
    if (userType !== 'SUPER_ADMIN' && role !== 'super_admin') {
      return next(new ApiError('Super admin access required', 403));
    }

    next();
  } catch (error) {
    next(new ApiError('Super admin authorization failed', 500));
  }
};

// Role-based middleware factory
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return next(new ApiError('Authentication required', 401));
      }

      const { userType, role } = req.user;
      const userRoles = [userType, role].filter(Boolean).map(r => r.toLowerCase());
      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());

      // Check if user has any of the allowed roles
      const hasPermission = allowedRolesLower.some(allowedRole => 
        userRoles.includes(allowedRole)
      );

      if (!hasPermission) {
        return next(new ApiError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403));
      }

      next();
    } catch (error) {
      next(new ApiError('Role authorization failed', 500));
    }
  };
};

// Check if user is admin or owner of resource
const adminOrOwner = (resourceOwnerField = 'userId') => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return next(new ApiError('Authentication required', 401));
      }

      const { userId, userType, role } = req.user;
      
      // Allow if user is admin
      if (userType === 'ADMIN' || role === 'admin' || role === 'super_admin') {
        return next();
      }

      // Allow if user owns the resource
      const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
      if (resourceOwnerId && resourceOwnerId === userId) {
        return next();
      }

      return next(new ApiError('Access denied. Admin access or resource ownership required', 403));
    } catch (error) {
      next(new ApiError('Authorization failed', 500));
    }
  };
};

module.exports = {
  adminMiddleware,
  superAdminMiddleware,
  requireRole,
  adminOrOwner
};
