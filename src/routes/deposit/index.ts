import { Router } from "express";
import { Auth, UserIsAgentOrCustomer } from "../../utils/middlewares";
import { makeDeposit, makeMobileMoneyDeposit } from "../../services/Deposit";

const router = Router();

// User make Deposit
router.route("/make").post(Auth, UserIsAgentOrCustomer, makeDeposit);

// User make Deposit with mobile money
router.route("/deposit_event/:data").post(makeMobileMoneyDeposit);

export default router;