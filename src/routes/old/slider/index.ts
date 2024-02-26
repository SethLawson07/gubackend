import { create, get, update, delete_, create_csl, slider_csl, create_csl_srv, slider_csl_srv } from "../../../services/old/Slider"
import { Auth, UserIsAdmin } from "../../../utils/middlewares"
import { Router } from "express"

const router = Router();

router.route("").post(Auth, UserIsAdmin, create)
router.route("").get(get)
router.route("").put(Auth, UserIsAdmin, update)
router.route("").delete(Auth, UserIsAdmin, delete_);
router.route("/create").post(Auth, UserIsAdmin, create_csl);
router.route("/slides").get(slider_csl);
router.route("/service").post(Auth, UserIsAdmin, create_csl_srv);
router.route("/service").get(slider_csl_srv);


export default router
