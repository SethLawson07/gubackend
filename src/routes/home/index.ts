import { Router } from "express";
import { customerHome, siteHome } from "../../services/Home";
import { Auth, UserIsCustomer } from "../../utils/middlewares";

const router = Router();

router.route("/customer").get(Auth, UserIsCustomer, customerHome);

router.route("/site").get(siteHome);

export default router
