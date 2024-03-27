import { hookValidateOrder, hookCreateOrder, payWithGoodpay } from "../../services/Hook";
import { Router } from "express";
import { Auth } from "../../utils/middlewares";

const router = Router();

router.route("/order/create").post(Auth, hookCreateOrder);

router.route("/order/validate/:data").post(hookValidateOrder);

router.route("/order/pay").post(/*Auth,*/ payWithGoodpay);


export default router
