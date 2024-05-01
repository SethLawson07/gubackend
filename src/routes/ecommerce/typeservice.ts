import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { active, addTypeService, all, deleteTypeService, updateTypeService } from "../../services/ecommerce/typeservice";

const router = Router();

router.route("/").post(Auth, UserIsAdmin, addTypeService);

router.route("/").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateTypeService);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteTypeService);


export default router;

