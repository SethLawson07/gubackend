import { Router } from "express"
import { register, login, create_admin} from "../../services/Auth"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router()

router.route("/register").post( register )

router.route("/login").post( login )

router.route("/create_admin").post( Auth, UserIsAdmin, create_admin  )

export default router
