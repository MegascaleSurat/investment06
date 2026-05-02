const ok = (res, { status = 200, message = "Success", data = null }) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

module.exports = { ok };