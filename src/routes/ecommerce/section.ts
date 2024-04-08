import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addSection,all,active, updateSection, deleteSection } from "../../services/ecommerce/section";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addSection);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateSection);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteSection);


export default router;

