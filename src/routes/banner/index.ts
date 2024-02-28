import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addBanner, deleteBanner, listBanner, updateBanner } from "../../services/banner";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addBanner);

router.route("/all").get(Auth,listBanner);

router.route("/update/:id").put(Auth, UserIsAdmin, updateBanner);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteBanner);


export default router;

