"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Sheet_1 = require("../../services/Sheet");
const router = (0, express_1.Router)();
// Check for user opened sheet
router.route("/check").get(middlewares_1.Auth, middlewares_1.UserIsCustomer, Sheet_1.check_for_opened_sheet);
// Verification de la disponibité de cases avant cotisation par mobile money
router.route("/validatecases").post(middlewares_1.Auth, Sheet_1.cases_valiation);
// router.route("/sheet").post(Auth, UserIsCustomer, get_sheet);
// Open User sheet
router.route("/open").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrCustomer, Sheet_1.open_sheet);
// Close sheet
router.route("/close").post(middlewares_1.Auth, middlewares_1.UserIsCustomer, Sheet_1.close_sheet);
exports.default = router;
