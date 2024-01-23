import { Router } from "express"
import { register, adduser, login, create_admin, get_orders, set_financepro_id, updateUserOnFirstLogin, logout, updateUserDeviceToken, get_customer, _update, disable_user } from "../../services/Auth"
import { Auth, UserIsAdmin, UserIsAgentCustomerOrAdmin, UserIsAgentOrAdmin } from "../../utils/middlewares"

const router = Router();

router.route("/register").post(register);

router.route("/user/:userid").get(get_customer);

router.route("/adduser").post(Auth, UserIsAgentOrAdmin, adduser);

router.route("/disable/:userid").get(Auth, UserIsAdmin, disable_user);

router.route("/updateuser").post(Auth, UserIsAgentCustomerOrAdmin, _update);

router.route("/login").post(login);

router.route("/create_admin").post(Auth, UserIsAdmin, create_admin);

router.route("/orders").get(Auth, get_orders);

router.route("/change_password").put(Auth, updateUserOnFirstLogin);

router.route("/set_id").post(Auth, UserIsAdmin, set_financepro_id);

router.route("/logout").post(Auth, logout);

router.route("/settoken").post(Auth, updateUserDeviceToken);


export default router