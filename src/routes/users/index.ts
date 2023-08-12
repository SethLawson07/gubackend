import { get_agents, get_all_users, get_customers, get_deliverypersons } from "../../services/Auth"
import { Auth, UserIsAdmin } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("").get(Auth, UserIsAdmin, get_all_users);

router.route("/customers").get(Auth, UserIsAdmin, get_customers);

router.route("/agents").get(Auth, UserIsAdmin, get_agents);

router.route("/deliverypersons").get(Auth, UserIsAdmin, get_deliverypersons);

// router.route("/agentcustomers").get(Auth, UserIsAdmin, get_deliverypersons);

export default router
