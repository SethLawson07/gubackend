"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Report_1 = require("../../services/Report");
const router = (0, express_1.Router)();
// Rapport Global
router.route("/").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Report_1.report_all);
// Rapport sur les commissions
router.route("/bet").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Report_1.totalBetReport);
// Rapport solde d'un agent
router.route("/balance/agent").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrAdmin, Report_1.agentBalance);
// Rapport solde des agents
router.route("/balance/agents").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Report_1.allAgentsBalance);
// // Rapport solde des clients
router.route("/balance/customers").get(middlewares_1.Auth, middlewares_1.UserIsAdmin, Report_1.allCustomersBalance);
exports.default = router;
