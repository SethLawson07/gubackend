import { Router } from "express";
import { Auth, UserIsAgentOrCustomer, UserIsCustomer } from "../../utils/middlewares";
import { check_for_opened_sheet, cases_valiation, close_sheet, open_sheet } from "../../services/Sheet";

const router = Router();


// Check for user opened sheet
router.route("/check").get(Auth, UserIsCustomer, check_for_opened_sheet);

// Verification de la disponibité de cases avant cotisation par mobile money
router.route("/validatecases").post(Auth, cases_valiation);

// router.route("/sheet").post(Auth, UserIsCustomer, get_sheet);

// Open User sheet
router.route("/open").post(Auth, UserIsAgentOrCustomer, open_sheet);

// Close sheet
router.route("/close").post(Auth, UserIsCustomer, close_sheet);

export default router;