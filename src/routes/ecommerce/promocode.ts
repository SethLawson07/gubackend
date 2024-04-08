import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addPromoCode,all,active, updatePromoCode, deletePromoCode } from "../../services/ecommerce/promocode";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addPromoCode);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updatePromoCode);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deletePromoCode);


export default router;

