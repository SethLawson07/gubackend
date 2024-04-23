"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Home_1 = require("../../services/Home");
const middlewares_1 = require("../../utils/middlewares");
const router = (0, express_1.Router)();
router.route("/customer").get(middlewares_1.Auth, middlewares_1.UserIsCustomer, Home_1.customerHome);
router.route("/site").get(Home_1.siteHome);
exports.default = router;
