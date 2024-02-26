import { Router } from "express";
import { create, get, delete_, verify } from "../../../services/old/PromoCode"
import { Auth, UserIsAdmin } from "../../../utils/middlewares";

const router = Router();

router.route("").post(Auth, UserIsAdmin, create)
router.route("").get(Auth, UserIsAdmin, get)
router.route("/verify").post(Auth, verify)
router.route("").delete(Auth, UserIsAdmin, delete_)

export default router;
