const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, access: user.access },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
