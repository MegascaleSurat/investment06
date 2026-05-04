const userService = require('./user.service');
const { ok } = require("../../../core/utils/response");
const { asyncHandler } = require("../../../core/utils/asyncHandler");
const repo = require('./user.repository');


// Auth
const register = asyncHandler(async (req, res) => {
  const user = await userService.register(req.body);
  return ok(res, { status: 201, message: 'User registered successfully', data: user });
});

const login = asyncHandler(async (req, res) => {
  const result = await userService.login(req.body);
  return ok(res, { status: 200, message: 'Login successful', data: result });
});


// Me
const me = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const user = await userService.getMe(userId);
  return ok(res, { status: 200, message: 'Profile fetched', data: repo.toSafeUser(user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const user = await userService.updateMe(userId, req.body);
  return ok(res, { status: 200, message: 'Profile updated', data: repo.toSafeUser(user) });
});


// change password
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  await userService.changePassword(userId, req.body);
  return ok(res, { status: 200, message: 'Password changed successfully', data: null });
});


// admin routes
const adminList = asyncHandler(async (req, res) => {
  const { items, total } = await userService.adminListUsers(req.query);
  return res.status(200).json({
    success: true,
    message: 'Users fetched',
    data: items.map((u) => repo.toSafeUser(u)),
    meta: {
      page: req.query.page,
      limit: req.query.limit,
      total
    }
  });
});

const adminUpdateStatus = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateUserStatus(req.params.id, req.body.status);
  return ok(res, { status: 200, message: 'User status updated', data: repo.toSafeUser(user) });
});

module.exports = {
  register,
  login,
  me,
  updateMe,
  changePassword,
  adminList,
  adminUpdateStatus
};

