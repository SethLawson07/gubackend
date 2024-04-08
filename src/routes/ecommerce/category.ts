import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { active, addCategory, all, deleteCategory, updateCategory } from "../../services/ecommerce/category";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addCategory);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateCategory);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteCategory);


export default router;

