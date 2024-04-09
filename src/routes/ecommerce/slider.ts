import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addSlider,all,active, updateSlider, deleteSlider, slider } from "../../services/ecommerce/slider";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addSlider);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/position/:position").get(slider);

router.route("/update/:id").put(Auth, UserIsAdmin, updateSlider);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteSlider);


export default router;

