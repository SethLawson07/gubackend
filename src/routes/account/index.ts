import { Router } from "express";
import { Auth, UserIsAdmin, UserIsAgentCustomerOrAdmin, UserIsCustomerOrAdmin } from "../../utils/middlewares";
import { create_account, get_account, get_user_account, pay_goodpay, user_has_account, } from "../../services/Account";

const router = Router();

// Get User account
router.route("/:id").get(Auth, UserIsCustomerOrAdmin, get_account);

// Create user account
router.route("/create").post(Auth, UserIsAdmin, create_account);

// Is User exists
router.route("/exists/:userid").post(Auth, UserIsAdmin, user_has_account);

// Get user account with user id
router.route("/user/:id").get(Auth, UserIsAgentCustomerOrAdmin, get_user_account);

// Pay with Goodpay
router.route("/pay/goodpay").post(Auth, pay_goodpay);


export default router;