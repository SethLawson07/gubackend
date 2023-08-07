import { Router } from "express"
import { addBook,activeBook} from "../../services/Book"
import { Auth, UserIsAdmin,UserIsCustomer } from "../../utils/middlewares"

const router = Router()
router.route("/").post(Auth, UserIsAdmin, addBook)
router.route("/activate").put(Auth,UserIsCustomer,activeBook)

export default router
