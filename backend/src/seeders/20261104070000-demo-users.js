'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hash = (pwd) => bcrypt.hash(pwd, 10);

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        password_hash: await hash('Admin@123'),
        role: 'ADMIN',
        access: null,
        created_at: now,
      },
      {
        email: 'user@example.com',
        password_hash: await hash('User@123'),
        role: 'USER',
        access: 'CREATE',
        created_at: now,
      },
      {
        email: 'viewer@example.com',
        password_hash: await hash('Viewer@123'),
        role: 'USER',
        access: 'VIEW',
        created_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@example.com', 'user@example.com', 'viewer@example.com'],
    });
  },
};
