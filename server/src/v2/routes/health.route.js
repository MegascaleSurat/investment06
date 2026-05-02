const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        service: "invest06-backend",
        env: process.env.NODE_ENV,
        version: "2.0.0"
    });
});

module.exports = router;