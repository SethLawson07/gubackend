import { Router } from "express";
import { Auth, UserIsAdmin, UserIsDeliveryMan } from "../../utils/middlewares";
import { create, cancel_order, get_all, get_user_orders, order_delivered, delivered_orders, pending_orders, validate_order, validated_orders, gain_order } from "../../services/Order"

const router = Router()

router.route("").post(Auth, create);;
router.route("").get(Auth, get_user_orders);
router.route("/all").get(Auth, UserIsAdmin, get_all);
router.route("/users").get(Auth, UserIsDeliveryMan, get_all);
router.route("/cancel").put(Auth, cancel_order);
router.route("/validate").put(Auth, UserIsAdmin, validate_order);
router.route("/deliver").put(Auth, UserIsDeliveryMan, order_delivered);
router.route("/delivered").get(Auth, delivered_orders);
router.route("/pending").get(pending_orders);
router.route("/validated").get(Auth, validated_orders);
router.route("/gain").post(Auth, gain_order);


export default router
