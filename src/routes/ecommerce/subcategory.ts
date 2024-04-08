import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { active, addSubCategory, all, deleteSubCategory, updateSubCategory } from "../../services/ecommerce/subcategory";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addSubCategory);

router.route("/all").get(Auth,UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateSubCategory);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteSubCategory);


export default router;

