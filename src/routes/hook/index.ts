import { payment_event, momo_payment_event } from "../../services/Hook";
import { Router } from "express";

const router = Router()

router.route("/momo_event").post( momo_payment_event)

router.route("/payment_event").all( payment_event )

export default router
