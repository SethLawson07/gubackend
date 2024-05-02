import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addProductVariant, addVariant, updateVariant, variantByItem } from "../../services/ecommerce/variant";

const router = Router();


router.route("/").post(Auth, UserIsAdmin, addVariant);

router.route("/productvariant").post(Auth, UserIsAdmin, addProductVariant);

router.route("/:id").get(Auth, UserIsAdmin, variantByItem);



// router.route("/product/add").post(Auth, UserIsAdmin, addProductVariant);



export default router;

