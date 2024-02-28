import { hookValidateOrder, hookCreateOrder } from "../../services/Hook";
import { Router } from "express";
import { Auth } from "../../utils/middlewares";

const router = Router();

router.route("/order/create").post(Auth, hookCreateOrder);

router.route("/order/validate/:data").post(hookValidateOrder);


export default router
