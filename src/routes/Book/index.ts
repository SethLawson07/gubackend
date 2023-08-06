import { Router } from "express"
import { addBook } from "../../services/Book"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router()
router.route("/").post(Auth, UserIsAdmin, addBook)
/* router.route("/").get() */

export default router
