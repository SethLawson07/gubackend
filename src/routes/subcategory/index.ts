import { Router } from "express";
import { create, get, update, delete_} from "../../services/SubCategory"
import { Auth, UserIsAdmin } from "../../utils/middlewares";

const router = Router()

router.route("").post( Auth, UserIsAdmin, create )
router.route("").get( get )
router.route("").put( Auth, UserIsAdmin, update )
router.route("").delete( Auth, UserIsAdmin, delete_ )

export default router
