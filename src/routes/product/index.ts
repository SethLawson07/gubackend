import { create, get, update, delete_, products_from_category } from "../../services/Product"
import { Auth, UserIsAdmin } from "../../utils/middlewares"
import { Router } from "express"

const router = Router();

router.route("").post(Auth, UserIsAdmin, create);
router.route("").get(get);
router.route("").put(Auth, UserIsAdmin, update);
router.route("").delete(Auth, UserIsAdmin, delete_);
router.route("/fromcat").post(products_from_category);

export default router;
