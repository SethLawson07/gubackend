import { Router } from "express";
import { Auth, UserIsAdmin, UserIsDeliveryMan } from "../../../utils/middlewares";
import { all_delivery, awaiting_deliveries, deliver, delivered_by_user, delivery_by_user, gain_delivery, receive_delivery, start_delivery } from "../../../services/old/Delivery";

const router = Router();

router.route("/all").get(Auth, all_delivery);
router.route("/awaiting").get(Auth, awaiting_deliveries);
router.route("/user/delivery").get(Auth, delivery_by_user);
router.route("/delivered").get(Auth, delivered_by_user);
router.route("/gain").post(Auth, gain_delivery);
router.route("/receive").post(Auth, receive_delivery);
router.route("/start").post(Auth, start_delivery);
router.route("/deliver").post(Auth, deliver);


export default router;
