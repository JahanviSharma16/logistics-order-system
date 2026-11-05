const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { register, login, me };
