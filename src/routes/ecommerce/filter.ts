import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addFilter, allByItem, updateFilter } from "../../services/ecommerce/FIlter";

const router = Router();

router.route("/add").post(Auth, UserIsAdmin, addFilter);

router.route("/item/:id").get(allByItem);

router.route("/update/:id").put(Auth, UserIsAdmin, updateFilter);



export default router;

