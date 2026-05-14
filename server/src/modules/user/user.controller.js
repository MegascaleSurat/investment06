import userService from './user.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class UserController {
  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    res.json(ApiResponse.success(user, 'User profile fetched successfully'));
  });
}

export default new UserController();
