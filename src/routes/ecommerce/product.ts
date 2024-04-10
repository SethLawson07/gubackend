import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addProduct ,all, updateProduct, deleteProduct, product, allproductsbyitem, oklm} from "../../services/ecommerce/product";
import { addItemVariant, addProductVariant } from "../../services/ecommerce/variant";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addProduct);

router.route("/all").get(Auth, UserIsAdmin,all);

// router.route("/active/:id").get(active);

router.route("/item/:slugitem").get(allproductsbyitem);

router.route("/:slugproduct").get(product);

router.route("/test/oklm").get(oklm);

router.route("/update/:id").put(Auth, UserIsAdmin, updateProduct);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteProduct);


export default router;

