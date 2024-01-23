import { Router } from "express"
import { make_order, package_payment_event } from "../../services/PackageOrder";

const router = Router();

router.route("/create").post(make_order);
router.route("/validate/:tid").post(package_payment_event);

export default router;