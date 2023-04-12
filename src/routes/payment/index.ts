import { Auth } from "../../utils/middlewares";
import { pay } from "../../services/Payment";
import { Router } from "express";

const router = Router()

router.route("").post( Auth, pay )

export default router
