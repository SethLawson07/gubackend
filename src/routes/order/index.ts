import { Router } from "express";
import { Auth, UserIsAdmin, UserIsDeliveryMan } from "../../utils/middlewares";
import { create, cancel_order, get_all, get_user_orders } from "../../services/Order"

const router = Router()

router.route("").post( Auth, create )
router.route("").get( Auth, get_user_orders )
router.route("/all").get( Auth, UserIsAdmin, get_all);
router.route("/users").get( Auth, UserIsDeliveryMan, get_all);
router.route("").put(Auth, cancel_order)

export default router
