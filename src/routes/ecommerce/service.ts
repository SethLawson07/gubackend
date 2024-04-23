import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { addService,all,active, updateService, deleteService } from "../../services/ecommerce/service";

const router = Router();

router.route("/").post(Auth, UserIsAdmin, addService);

router.route("/").get(Auth, UserIsAdmin,all);

router.route("/active").get(active);

router.route("/update/:id").put(Auth, UserIsAdmin, updateService);

router.route("/delete/:id").delete(Auth, UserIsAdmin, deleteService);


export default router;

