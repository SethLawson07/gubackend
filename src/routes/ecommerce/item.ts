import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { active, addItem, all, deleteItem, updateItem } from "../../services/ecommerce/item";
import { productsByItem } from "../../services/ecommerce/product";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addItem);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/product/:slugitem").get(productsByItem);

router.route("/update/:id").put(Auth, UserIsAdmin, updateItem);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteItem);


export default router;

