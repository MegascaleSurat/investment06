const express = require("express");

const { validate } = require("../../../middlewares/validate");
const { loginSchema } = require("./auth.schema");
const controller = require("./auth.controller");

const router = express.Router();

// done
// system Auth
router.post("/login", validate(loginSchema, "body"), controller.loginController);

// pending
// kite Auth

module.exports = router;