import { get_agent_customers, get_agent_customers_locations, get_agents, get_all_users, get_customers, get_deliverypersons } from "../../services/Auth"
import { Auth, UserIsAdmin, UserIsAgentOrAdmin } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("").get(Auth, UserIsAdmin, get_all_users);

router.route("/customers").post(Auth, UserIsAdmin, get_customers);

router.route("/agents").get(Auth, UserIsAdmin, get_agents);

router.route("/deliverypersons").get(Auth, UserIsAdmin, get_deliverypersons);

router.route("/agent/customers").post(Auth, UserIsAgentOrAdmin, get_agent_customers);

router.route("/location/customers").post(Auth, UserIsAgentOrAdmin, get_agent_customers_locations);

export default router
