import { Router } from "express";
import { Auth, UserIsAdmin, UserIsDeliveryMan } from "../../utils/middlewares";
import { all_delivery, awaiting_deliveries, delivered, gain_delivery, start_delivery } from "../../services/Delivery";

const router = Router()

router.route("/all").get(Auth, all_delivery);
router.route("/awaiting").get(Auth, awaiting_deliveries);
router.route("/gain").post(Auth, gain_delivery);
router.route("/start").post(Auth, start_delivery);
router.route("/deliver").post(Auth, delivered);
// router.route("/validate").post(Auth, UserIsAdmin, validate_order);
// router.route("/reject").put(Auth, UserIsAdmin, validate_order);


// router.route("/deliver").put(Auth, UserIsDeliveryMan, order_delivered);
// router.route("/delivered").get(Auth, delivered_orders);
// router.route("/pending").get(pending_orders);
// router.route("/validated").get(Auth, validated_orders);
// router.route("/delivery").get(Auth, delivery_process);
// router.route("/gain").post(Auth, gain_order);
// router.route("/gained").get(Auth, UserIsAdmin, gained_orders);
// router.route("/user/gained").get(Auth, UserIsDeliveryMan, user_gained_orders);


export default router;
