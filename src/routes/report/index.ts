import { Router } from "express";
import { Auth, UserIsAdmin, UserIsAgentOrAdmin } from "../../utils/middlewares";

import { report_all, agentBalance, allAgentsBalance, allCustomersBalance, totalBetReport } from "../../services/Report";

const router = Router();


// Rapport Global
router.route("/").post(Auth, UserIsAdmin, report_all);

// router.route("/saving").get(totalReport);

// Rapport sur les commissions
router.route("/bet").post(Auth, UserIsAdmin, totalBetReport);

// Rapport solde d'un agent
router.route("/balance/agent").post(Auth, UserIsAgentOrAdmin, agentBalance);

// Rapport solde des agents
router.route("/balance/agents").post(Auth, UserIsAdmin, allAgentsBalance);

// // Rapport solde des clients
router.route("/balance/customers").get(Auth, UserIsAdmin, allCustomersBalance);


export default router;