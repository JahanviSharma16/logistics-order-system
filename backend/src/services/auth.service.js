const bcrypt = require('bcrypt');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const register = async ({ email, password, role, access }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError('Email is already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email,
    password_hash,
    role,
    access: role === 'ADMIN' ? null : access || 'CREATE',
  });

  return user; 
};


const login = async ({ email, password }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });

  const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);
  return { token, user };
};

module.exports = { register, login };
