import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addOrderService ,all} from "../../services/ecommerce/orderservice";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addOrderService);

router.route("/all").get(Auth, UserIsAdmin,all);


export default router;

