import maintenanceService from './maintenance.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class MaintenanceController {
  triggerEOD = asyncHandler(async (req, res) => {
    const data = await maintenanceService.triggerEOD(req.user.id);
    res.json(ApiResponse.success(data, 'End-of-day job triggered'));
  });

  pauseEngines = asyncHandler(async (req, res) => {
    const data = await maintenanceService.pauseAllEngines(req.user.id, req.body.reason);
    res.json(ApiResponse.success(data, 'All engines paused successfully'));
  });

  resumeEngines = asyncHandler(async (req, res) => {
    const data = await maintenanceService.resumeAllEngines(req.user.id);
    res.json(ApiResponse.success(data, 'All engines resumed successfully'));
  });

  getEngineStatus = asyncHandler(async (req, res) => {
    const data = await maintenanceService.getEngineStatuses();
    res.json(ApiResponse.success(data, 'Engine statuses fetched successfully'));
  });
}

export default new MaintenanceController();
