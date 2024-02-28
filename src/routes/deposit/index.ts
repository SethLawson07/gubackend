import { Router } from "express";
import { Auth, UserIsAgentOrCustomer } from "../../utils/middlewares";
import { makeDeposit } from "../../services/Deposit";

const router = Router();

// User make Deposit
router.route("/create").post(Auth, UserIsAgentOrCustomer, makeDeposit);

export default router;