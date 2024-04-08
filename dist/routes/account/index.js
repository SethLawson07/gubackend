"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Account_1 = require("../../services/Account");
const router = (0, express_1.Router)();
// Get User account
router.route("/:id").get(middlewares_1.Auth, middlewares_1.UserIsCustomerOrAdmin, Account_1.get_account);
// Create user account
router.route("/create").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Account_1.create_account);
// Is User exists
router.route("/exists/:userid").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Account_1.user_has_account);
// Get user account with user id
router.route("/user/:id").get(middlewares_1.Auth, middlewares_1.UserIsAgentCustomerOrAdmin, Account_1.get_user_account);
// Pay with Goodpay
router.route("/pay/goodpay").post(middlewares_1.Auth, Account_1.pay_goodpay);
exports.default = router;
