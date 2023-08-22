import { create, get, update, delete_, create_csl, slider_csl } from "../../services/Slider"
import { Auth, UserIsAdmin } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("").post(Auth, UserIsAdmin, create)
router.route("").get(get)
router.route("").put(Auth, UserIsAdmin, update)
router.route("").delete(Auth, UserIsAdmin, delete_);
router.route("/create").post(Auth, UserIsAdmin, create_csl);
router.route("/slider").post(Auth, UserIsAdmin, slider_csl);

export default router
