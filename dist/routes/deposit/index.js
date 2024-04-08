"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Deposit_1 = require("../../services/Deposit");
const router = (0, express_1.Router)();
// User make Deposit
router.route("/create").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrCustomer, Deposit_1.makeDeposit);
exports.default = router;
