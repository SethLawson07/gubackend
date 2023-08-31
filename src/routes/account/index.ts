import { Router } from "express";
import { Auth, UserIsAdmin, UserIsCustomer } from "../../utils/middlewares";
import { check_for_opened_sheet, close_sheet, contribtest, contribute, create_account, create_book, get_book, get_books, get_opened_book, get_sheet, make_contribution, open_sheet } from "../../services/Account";

const router = Router();

router.route("/create").post(Auth, UserIsAdmin, create_account);

router.route("/addbook").post(Auth, UserIsAdmin, create_book);

router.route("/sheetcheck").get(Auth, UserIsCustomer, check_for_opened_sheet);

router.route("/opensheet").post(Auth, UserIsCustomer, open_sheet);

router.route("/closesheet").post(Auth, UserIsCustomer, close_sheet);

router.route("/contribute").post(Auth, UserIsCustomer, contribute);

router.route("/books").post(Auth, UserIsCustomer, get_books);

router.route("/book/:id").post(Auth, UserIsCustomer, get_book);

// Opened book
router.route("/book/opened").post(Auth, UserIsCustomer, get_opened_book);

router.route("/sheet").post(Auth, UserIsCustomer, get_sheet);

// alltest
router.route("/test").post(Auth, UserIsCustomer, contribtest);




export default router