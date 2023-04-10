import { Router } from "express"
import { register, login} from "../../services/Auth"

const router = Router()

router.route("/register").post( register )

router.route("/login").post( login )

export default router
