import { Router } from "express";
import { Auth, UserIsAgentCustomerOrAdmin, UserIsAgentOrCustomer, UserIsCustomer } from "../../utils/middlewares";
import { create_book, addBook, get_book, get_books, userBookIsOpened, get_opened_book } from "../../services/Book";

const router = Router();

// Create user book
router.route("/addbook").post(Auth, UserIsAgentCustomerOrAdmin, create_book);

// Opened book
router.route("/opened").post(Auth, UserIsCustomer, get_opened_book);

// Is Book Opened
router.route("/isopened/:customer").get(Auth, userBookIsOpened);

// Create book with Goodpay
router.route("/pay_book").post(Auth, UserIsAgentOrCustomer, addBook);

// Get User books
router.route("/").get(Auth, UserIsCustomer, get_books);

// Get book by Id
router.route("/:id").get(Auth, UserIsCustomer, get_book);


export default router;
