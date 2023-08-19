import { Router } from "express";
import { Auth, UserIsAdmin, UserIsCustomer } from "../../utils/middlewares";
import { close_sheet, create_account, create_book, make_contribution, open_sheet } from "../../services/Account";

const router = Router();

router.route("/create").post(Auth, UserIsAdmin, create_account);

router.route("/addbook").post(Auth, UserIsAdmin, create_book);

router.route("/opensheet").post(Auth, UserIsCustomer, open_sheet);

router.route("/closesheet").post(Auth, UserIsCustomer, close_sheet);

router.route("/contribute").post(Auth, UserIsCustomer, make_contribution);


export default router