import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addProduct ,all,active, updateProduct, deleteProduct} from "../../services/ecommerce/product";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addProduct);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateProduct);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteProduct);


export default router;

