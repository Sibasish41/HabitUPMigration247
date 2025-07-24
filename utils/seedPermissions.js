const { Permission } = require('../models');

const defaultPermissions = [
  { permissionType: 'MANAGE_USERS', description: 'Can create, update, and delete users' },
  { permissionType: 'VIEW_USERS', description: 'Can view user information' },
  { permissionType: 'VIEW_PROFILE', description: 'Can view own profile' },
  { permissionType: 'RESET_USER_PASSWORDS', description: 'Can reset user passwords' },
  { permissionType: 'MANAGE_SUBSCRIPTIONS', description: 'Can manage user subscriptions' },
  { permissionType: 'ACTIVATE_USERS', description: 'Can activate/deactivate users' },
  { permissionType: '30DAY_USER', description: 'Has been a user for 30+ days' },
  { permissionType: 'ADMIN_ACCESS', description: 'Has admin panel access' },
  { permissionType: 'DOCTOR_ACCESS', description: 'Has doctor panel access' },
  { permissionType: 'MANAGE_HABITS', description: 'Can create, update, and delete habits' },
  { permissionType: 'VIEW_HABITS', description: 'Can view habits' },
  { permissionType: 'MANAGE_MEETINGS', description: 'Can schedule and manage meetings' },
  { permissionType: 'VIEW_MEETINGS', description: 'Can view meetings' },
  { permissionType: 'MANAGE_PAYMENTS', description: 'Can process payments' },
  { permissionType: 'VIEW_PAYMENTS', description: 'Can view payment information' },
  { permissionType: 'SEND_MESSAGES', description: 'Can send messages' },
  { permissionType: 'VIEW_MESSAGES', description: 'Can view messages' },
  { permissionType: 'MANAGE_FEEDBACK', description: 'Can manage feedback' },
  { permissionType: 'VIEW_FEEDBACK', description: 'Can view feedback' }
];

const seedPermissions = async () => {
  try {
    console.log('🌱 Seeding permissions...');
    
    for (const permissionData of defaultPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { permissionType: permissionData.permissionType },
        defaults: permissionData
      });
      
      if (created) {
        console.log(`✅ Created permission: ${permission.permissionType}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permission.permissionType}`);
      }
    }
    
    console.log('🎉 Permission seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
};

module.exports = { seedPermissions };
