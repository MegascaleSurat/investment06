import settingsService from './settings.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class SettingsController {
  /**
   * Get Risk Configuration
   */
  getRiskSettings = asyncHandler(async (req, res) => {
    const data = await settingsService.getRiskSettings();
    res.json(ApiResponse.success(data, 'Risk settings fetched successfully'));
  });

  /**
   * Update Risk Configuration
   */
  updateRiskSettings = asyncHandler(async (req, res) => {
    const data = await settingsService.updateRiskSettings(req.body);
    res.json(ApiResponse.success(data));
  });

  /**
   * Get System Configuration
   */
  getSystemSettings = asyncHandler(async (req, res) => {
    const data = await settingsService.getSystemSettings();
    res.json(ApiResponse.success(data, 'System settings fetched successfully'));
  });

  /**
   * Update System Configuration
   */
  updateSystemSettings = asyncHandler(async (req, res) => {
    const data = await settingsService.updateSystemSettings(req.body);
    res.json(ApiResponse.success(data));
  });
}

export default new SettingsController();
