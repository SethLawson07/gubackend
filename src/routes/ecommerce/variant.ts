import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addItemVariant, addProductVariant, updateItemVariant } from "../../services/ecommerce/variant";

const router = Router();


router.route("/item/add").post(Auth, UserIsAdmin, addItemVariant);

router.route("/:variantId").put(Auth, UserIsAdmin, updateItemVariant);

router.route("/product/add").post(Auth, UserIsAdmin, addProductVariant);



export default router;

