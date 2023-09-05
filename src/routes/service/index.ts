import { Router } from "express"
import { create, create_service_category, delete_category_service, delete_service, get, service_categories, update_category_service, update_service } from "../../services/Service"
import { Auth, UserIsAdmin } from "../../utils/middlewares"

const router = Router();

// Add Service
router.route("").post(Auth, UserIsAdmin, create);
// Services
router.route("").get(get);
// Update
router.route("").put(Auth, UserIsAdmin, update_service);
// Delete
router.route("").delete(Auth, UserIsAdmin, delete_service);

// Category Services
router.route("/category").get(service_categories);
// Create category service
router.route("/category").post(Auth, UserIsAdmin, create_service_category);
// Modifier une catégorie de service
router.route("/category").put(Auth, UserIsAdmin, update_category_service);
// Supprimer une catégorie de service
router.route("/category").delete(Auth, UserIsAdmin, delete_category_service);


export default router;
