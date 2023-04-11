import { create, get, update, delete_} from "../../services/Slider"
import { Auth, UserIsAdmin} from "../../utils/middlewares"
import { Router } from "express"

const router  = Router()

router.route("").post( Auth, UserIsAdmin, create )
router.route("").get( get )
router.route("").put( Auth, UserIsAdmin, update )
router.route("").delete( Auth, UserIsAdmin, delete_ )
