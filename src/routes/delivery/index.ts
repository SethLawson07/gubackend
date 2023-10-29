import { Router } from "express";
import { Auth, UserIsAdmin, UserIsDeliveryMan } from "../../utils/middlewares";
import { all_delivery, awaiting_deliveries, delivered, gain_delivery, start_delivery } from "../../services/Delivery";

const router = Router()

router.route("/all").get(Auth, all_delivery);
router.route("/awaiting").get(Auth, awaiting_deliveries);
router.route("/gain").post(Auth, gain_delivery);
router.route("/start").post(Auth, start_delivery);
router.route("/deliver").post(Auth, delivered);


export default router;
