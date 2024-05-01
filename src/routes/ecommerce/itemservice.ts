import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addItemService,all,active, deleteItemService, updateItemService } from "../../services/ecommerce/itemservice";

const router = Router();

router.route("/").post(Auth, UserIsAdmin, addItemService);

router.route("/").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateItemService);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteItemService);


export default router;

