import { Router } from "express";
import { customerHome } from "../../services/Home";
import { Auth, UserIsCustomer } from "../../utils/middlewares";

const router = Router();

router.route("/customer").get(Auth, UserIsCustomer, customerHome);

export default router
