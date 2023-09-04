import { Router } from "express"
import { create, create_service_category, get, service_categories } from "../../services/Service"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router();

// Add Service
router.route("").post(Auth, UserIsAdmin, create);
// Services
router.route("").get(get);

// Category Services
router.route("/category").get(service_categories);
// Create category service
router.route("/category").post(Auth, UserIsAdmin, create_service_category);


export default router;
