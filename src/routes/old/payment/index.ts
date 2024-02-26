import { Auth } from "../../../utils/middlewares";
import { pay } from "../../../services/old/Payment";
import { Router } from "express";

const router = Router()

router.route("").post(Auth, pay)

export default router
