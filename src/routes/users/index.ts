import { get_all_users } from "../../services/Auth"
import { Auth, UserIsAdmin } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("").get( Auth, UserIsAdmin, get_all_users )

export default router
