import { payment_event, momo_payment_event, contribution_event } from "../../services/Hook";
import { Router } from "express";

const router = Router()

router.route("/momo_event").post(momo_payment_event)

router.route("/payment_event/:id").post(payment_event)

router.route("/contrib_event/:data").post(contribution_event);


export default router
