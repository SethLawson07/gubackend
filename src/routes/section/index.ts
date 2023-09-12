import { Router } from "express";
import { Auth, UserIsAdmin } from "../../utils/middlewares";
import { all_sections, create_section, delete_section, section_byid } from "../../services/Section";

const router = Router();

router.route('').get(all_sections);
router.route('').post(Auth, UserIsAdmin, create_section);
// router.route('/:id').get(Auth, UserIsAdmin, section_byid);
router.route('').delete(Auth, UserIsAdmin, delete_section);


export default router;