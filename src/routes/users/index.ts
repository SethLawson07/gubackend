import { get_agent_customers, get_agents, get_all_users, get_customers, get_deliverypersons } from "../../services/Auth"
import { Auth, UserIsAdmin, UserIsAgent, UserIsAgentOrAdmin, UserIsCustomer } from "../../utils/middlewares"
import { Router } from "express"

const router = Router()

router.route("").get(Auth, UserIsAdmin, get_all_users);

router.route("/customers").get(Auth, UserIsAdmin, get_customers);

router.route("/agents").get(Auth, UserIsAdmin, get_agents);

router.route("/deliverypersons").get(Auth, UserIsAdmin, get_deliverypersons);

router.route("/agentcustomers/:agent").get(Auth, UserIsAgentOrAdmin, get_agent_customers);

export default router
