import { Router } from "express"
import { get_orders, make_order, package_payment_event } from "../../services/PackageOrder";
import { Auth, UserIsAdmin } from "../../utils/middlewares";

const router = Router();

router.route("/create").post(make_order);
router.route("/orders").post(Auth, UserIsAdmin, get_orders);
router.route("/validate/:tid").post(package_payment_event);

export default router;