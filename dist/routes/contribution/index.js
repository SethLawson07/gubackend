"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Contribution_1 = require("../../services/Contribution");
const router = (0, express_1.Router)();
// User make contribution
router.route("/contribute").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrCustomer, Contribution_1.contribute);
// Agent or Admin validate contribution
router.route("/validate/:id").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrAdmin, Contribution_1.validate_contribution);
router.route("/reject/:id").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrAdmin, Contribution_1.reject_contribution);
// Get Contributions | admin or Agent
router.route("/").post(middlewares_1.Auth, middlewares_1.UserIsAgentCustomerOrAdmin, Contribution_1.user_contributions);
// A user agent contributions
router.route("/agent").post(middlewares_1.Auth, middlewares_1.UserIsAgent, Contribution_1.contributions_agent);
// Get user contributions
router.route("/user/:userid").get(middlewares_1.Auth, Contribution_1.userContributions);
// Get a contribution | Admin or Agent  
router.route("/:id").get(middlewares_1.Auth, middlewares_1.UserIsAgentOrAdmin, Contribution_1.target_contribution);
exports.default = router;
