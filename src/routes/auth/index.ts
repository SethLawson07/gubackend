import { Router } from "express"
import { register, login, create_admin, get_orders} from "../../services/Auth"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router()

router.route("/register").post( register )

router.route("/login").post( login )

router.route("/create_admin").post( Auth, UserIsAdmin, create_admin  )

router.route("/orders").get( Auth, get_orders )

export default router
