"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Activity_1 = require("../../services/Activity");
const router = (0, express_1.Router)();
// Liste des activités utilisateurs (Filtrés en date)
router.route("/user").post(middlewares_1.Auth, Activity_1.userActivity);
// Historique des soldes agents
router.route("/balance/history/:angentid").post(middlewares_1.Auth, Activity_1.agentBalanceHistory);
// Liste des trois dernières activités
router.route("/last").get(middlewares_1.Auth, Activity_1.userLastActivities);
exports.default = router;
