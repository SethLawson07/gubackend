import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { userActivity, agentBalanceHistory, userLastActivities } from "../../services/Activity";

const router = Router();

// Liste des activités utilisateurs (Filtrés en date)
router.route("/user").post(Auth, userActivity);

// Historique des soldes agents
router.route("/balance/history/:angentid").post(Auth, agentBalanceHistory);

// Liste des trois dernières activités
router.route("/last").get(Auth, userLastActivities);

export default router;