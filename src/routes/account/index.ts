import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { create_account, create_book } from "../../services/Account";

const router = Router()

router.route("/create").post(Auth, UserIsAdmin, create_account)

router.route("/addbook").post(Auth, UserIsAdmin, create_book)

export default router