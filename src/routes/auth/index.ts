import { Router } from "express"
import { register, adduser, login, create_admin, set_financepro_id, logout, updateUserDeviceToken, get_customer, _update, disable_user, update_password } from "../../services/Auth"
import { Auth, UserIsAdmin, UserIsAgentCustomerOrAdmin, UserIsAgentOrAdmin } from "../../utils/middlewares"

const router = Router();

router.route("/register").post(register);

router.route("/user/:userid").get(get_customer);

router.route("/adduser").post(Auth, UserIsAgentOrAdmin, adduser);

router.route("/disable/:userid").get(Auth, UserIsAdmin, disable_user);

router.route("/updateuser").post(Auth, UserIsAgentCustomerOrAdmin, _update);

router.route("/login").post(login);

router.route("/create_admin").post(Auth, UserIsAdmin, create_admin);

router.route("/change_password").put(Auth, update_password);

router.route("/set_id").post(Auth, UserIsAdmin, set_financepro_id);

router.route("/logout").post(Auth, logout);

router.route("/settoken").post(Auth, updateUserDeviceToken);


export default router