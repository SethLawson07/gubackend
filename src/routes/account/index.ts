import { Router } from "express";
import { Auth, UserIsAdmin, UserIsAgent, UserIsAgentCustomerOrAdmin, UserIsAgentOrAdmin, UserIsAgentOrCustomer, UserIsCustomer, UserIsCustomerOrAdmin } from "../../utils/middlewares";
import { addBook, agentBalance, agentBalanceHistory, cases_valiation, check_for_opened_sheet, close_sheet, contribute, create_account, create_book, get_account, get_book, get_books, get_opened_book, get_sheet, get_user_account, makeDeposit, makeMobileMoneyDeposit, open_sheet, reject_contribution, report_all, target_contribution, totalBetReport, totalReport, userActivity, userContributions, userLastActivities, user_contributions, user_rejected_contributions, validate_contribution } from "../../services/Account";

const router = Router();

// Create user account
router.route("/create").post(Auth, UserIsAdmin, create_account);

// Create user book
router.route("/addbook").post(Auth, UserIsAgentCustomerOrAdmin, create_book);

router.route("/pay_book").post(Auth, UserIsAgentOrCustomer, addBook);

// Check for user opened sheet
router.route("/sheetcheck").get(Auth, UserIsCustomer, check_for_opened_sheet);

// Verification de la disponibité de cases avant cotisation par mobile money
router.route("/validatecases").post(Auth, cases_valiation);

// Cotisations rejetées pour un utilisateur donné
router.route("/unvalidated/:userId").post(Auth, UserIsAgentOrAdmin, user_rejected_contributions);

// Open User sheet
router.route("/opensheet").post(Auth, UserIsAgentOrCustomer, open_sheet);

// User make contribution
router.route("/contribute").post(Auth, UserIsAgentOrCustomer, contribute);

// User make Deposit
router.route("/deposit").post(Auth, UserIsAgentOrCustomer, makeDeposit);

// User make Deposit with mobile money
router.route("/deposit_event/:data").post(makeMobileMoneyDeposit);

// Agent or Admin validate contribution
router.route("/validate/:id").post(Auth, UserIsAgentOrAdmin, validate_contribution);

router.route("/reject/:id").post(Auth, UserIsAgentOrAdmin, reject_contribution);

// Get Contributions  | admin or Agent
router.route("/contribution").get(Auth, UserIsAgentCustomerOrAdmin, user_contributions);

router.route("/user/contributions/:userid").get(Auth, userContributions);

// Get a contribution | Admin or Agent  
router.route("/contribution/:id").get(Auth, UserIsAgentOrAdmin, target_contribution);

// Get User account
router.route("/acc/:id").get(Auth, UserIsCustomerOrAdmin, get_account);

// Get user account with user id
router.route("/user/:id").get(Auth, UserIsAgentCustomerOrAdmin, get_user_account);

// Get User books
router.route("/books").get(Auth, UserIsCustomer, get_books);

// Get a book
router.route("/book/:id").get(Auth, UserIsCustomer, get_book);

// Close sheet
router.route("/closesheet").post(Auth, UserIsCustomer, close_sheet);

// Rapport Global
router.route("/reports").post(report_all);

router.route("/saving").get(totalReport);

router.route("/bet/report").post(totalBetReport);

router.route("/agent/balance").post(agentBalance);

router.route("/agent/balance/history").post(agentBalanceHistory);

// Liste des activités utilisateurs (Filtrés en date)
router.route("/activity").post(Auth, userActivity);

// Liste des trois dernières activités
router.route("/activity/last").get(Auth, userLastActivities);

// Opened book
router.route("/book/opened").post(Auth, UserIsCustomer, get_opened_book);

router.route("/sheet").post(Auth, UserIsCustomer, get_sheet);




export default router