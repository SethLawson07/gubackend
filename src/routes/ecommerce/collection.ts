import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addCollection,all,active, updateCollection, deleteCollection } from "../../services/ecommerce/collection";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addCollection);

router.route("/all").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateCollection);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteCollection);


export default router;

