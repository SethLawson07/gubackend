import { Router } from "express"
import { register, adduser, login, create_admin, get_orders, set_financepro_id, updateUserOnFirstLogin, logout, updateUserDeviceToken } from "../../services/Auth"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router();

router.route("/register").post(register);

router.route("/adduser").post(Auth, UserIsAdmin, adduser);

router.route("/login").post(login);

router.route("/create_admin").post(Auth, UserIsAdmin, create_admin);

router.route("/orders").get(Auth, get_orders);

router.route("/change_password").put(Auth, updateUserOnFirstLogin);

router.route("/set_id").post(Auth, UserIsAdmin, set_financepro_id);

router.route("/logout").post(Auth, logout);

router.route("/settoken").post(Auth, updateUserDeviceToken);


export default router