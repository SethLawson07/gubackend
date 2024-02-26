import { Router } from "express"
import { Auth, UserIsAdmin } from "../../../utils/middlewares"
import { get, get_all } from "../../../services/old/Transaction"

const router = Router()

router.route("").get(Auth, get)
router.route("/all").get(Auth, UserIsAdmin, get_all)

export default router
