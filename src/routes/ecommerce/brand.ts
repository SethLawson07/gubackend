import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { active, addBrand, all, deleteBrand, updateBrand } from "../../services/ecommerce/brand";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addBrand);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateBrand);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteBrand);


export default router;

