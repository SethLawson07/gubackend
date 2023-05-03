import { create, get_all, update_brand, delete_brand } from "../../services/Brand";
import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";

const router = Router()

router.route("").post( Auth, UserIsAdmin, create )
router.route("").get( get_all )
router.route("").put( Auth, UserIsAdmin, update_brand )
router.route("").delete( Auth, UserIsAdmin, delete_brand )

export default router
