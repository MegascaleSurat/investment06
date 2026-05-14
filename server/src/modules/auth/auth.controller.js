import authService from './auth.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(ApiResponse.success({
      user: result.user,
      accessToken: result.accessToken
    }, 'User registered successfully'));
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(ApiResponse.success({
      user: result.user,
      accessToken: result.accessToken
    }, 'Login successful'));
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken');
    res.json(ApiResponse.success(null, 'Logout successful'));
  });

  refresh = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const result = await authService.refresh(oldRefreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(ApiResponse.success({
      accessToken: result.accessToken
    }, 'Token refreshed successfully'));
  });
  
  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    res.json(ApiResponse.success(user, 'Profile fetched successfully'));
  });

  updateMe = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json(ApiResponse.success(user, 'Profile updated successfully'));
  });

  changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json(ApiResponse.success(null, 'Password changed successfully'));
  });
}

export default new AuthController();
