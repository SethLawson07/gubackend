import { create_category, get_categories, update_category } from "../../services/Category"
import { UserIsAdmin, Auth } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("/").post( Auth, UserIsAdmin, create_category )

router.route("/").get( get_categories )

router.route("/").put( Auth, UserIsAdmin, update_category )

router.route("/").delete()

export default router
