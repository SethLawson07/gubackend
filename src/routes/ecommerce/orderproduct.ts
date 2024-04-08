import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addOrderProduct,all } from "../../services/ecommerce/orderproduct";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addOrderProduct);

router.route("/all").get(Auth, UserIsAdmin,all);

export default router;

