import { Router } from "express";
import { Auth, UserIsAgent, UserIsAgentCustomerOrAdmin, UserIsAgentOrAdmin, UserIsAgentOrCustomer } from "../../utils/middlewares";
import { contribute, contributions_agent, reject_contribution, target_contribution, userContributions, user_contributions, validate_contribution } from "../../services/Contribution";

const router = Router();

// User make contribution
router.route("/contribute").post(Auth, UserIsAgentOrCustomer, contribute);

// Agent or Admin validate contribution
router.route("/validate/:id").post(Auth, UserIsAgentOrAdmin, validate_contribution);

router.route("/reject/:id").post(Auth, UserIsAgentOrAdmin, reject_contribution);

// Get Contributions | admin or Agent
router.route("/").post(Auth, UserIsAgentCustomerOrAdmin, user_contributions);

// A user agent contributions
router.route("/agent").post(Auth, UserIsAgent, contributions_agent);

// Get user contributions
router.route("/user/:userid").get(Auth, userContributions);

// Get a contribution | Admin or Agent  
router.route("/:id").get(Auth, UserIsAgentOrAdmin, target_contribution);

export default router;