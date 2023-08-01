import { Router } from "express"
import { create } from "../../services/Service"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router()
router.route("/").post(create)
/* router.route("/").get() */



export default router
