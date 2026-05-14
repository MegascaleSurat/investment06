import userRepository from './user.repository.js';
import ApiError from '../../core/errors/ApiError.js';

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const { password, refreshToken, ...rest } = user;
    return rest;
  }
}

export default new UserService();
