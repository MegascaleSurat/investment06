import brokerService from './broker.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class BrokerController {
  saveCredentials = asyncHandler(async (req, res) => {
    const data = await brokerService.saveCredentials(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(data, 'Credentials saved successfully'));
  });

  getCredentials = asyncHandler(async (req, res) => {
    const data = await brokerService.getCredentials(req.user.id);
    res.json(ApiResponse.success(data, 'Credentials fetched successfully'));
  });

  updateCredentials = asyncHandler(async (req, res) => {
    const data = await brokerService.saveCredentials(req.user.id, req.body);
    res.json(ApiResponse.success(data, 'Credentials updated successfully'));
  });

  deleteCredentials = asyncHandler(async (req, res) => {
    await brokerService.deleteCredentials(req.user.id);
    res.json(ApiResponse.success(null, 'Credentials deleted successfully'));
  });

  getSessionStatus = asyncHandler(async (req, res) => {
    const data = await brokerService.getSessionStatus(req.user.id);
    res.json(ApiResponse.success(data, 'Session status fetched successfully'));
  });
}

export default new BrokerController();
