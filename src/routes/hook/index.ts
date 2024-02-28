import { contribution_event, addbook_event, hookValidateOrder, hookCreateOrder } from "../../services/Hook";
import { Router } from "express";
import { Auth } from "../../utils/middlewares";

const router = Router();

router.route("/contrib_event/:data").post(contribution_event);

router.route("/addbook_event/:data").post(addbook_event);

router.route("/create").post(Auth, hookCreateOrder);

router.route("/validate/:data").post(hookValidateOrder);


export default router
