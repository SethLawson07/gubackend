import { Router } from "express"
import { create, get } from "../../services/Service"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router();
router.route("").post(Auth, UserIsAdmin, create);
router.route("").get(get);



export default router;
