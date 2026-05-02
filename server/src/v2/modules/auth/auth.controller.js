const service = require("./auth.service");
const { ok } = require("../../../core/utils/response");
const { asyncHandler } = require("../../../core/utils/asyncHandler");

const loginController = asyncHandler(async (req, res) => {
    const result = await service.loginUser(req.body);

    return ok(res, {
        message: "Login successful",
        data: result,
    });
});

module.exports = {
    loginController,
};