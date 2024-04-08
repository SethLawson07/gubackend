"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const Book_1 = require("../../services/Book");
const router = (0, express_1.Router)();
// Create user book
router.route("/addbook").post(middlewares_1.Auth, middlewares_1.UserIsAgentCustomerOrAdmin, Book_1.create_book);
// Opened book
router.route("/opened").post(middlewares_1.Auth, middlewares_1.UserIsCustomer, Book_1.get_opened_book);
// Is Book Opened
router.route("/isopened/:customer").get(middlewares_1.Auth, Book_1.userBookIsOpened);
// Create book with Goodpay
router.route("/pay_book").post(middlewares_1.Auth, middlewares_1.UserIsAgentOrCustomer, Book_1.addBook);
// Get User books
router.route("/").get(middlewares_1.Auth, middlewares_1.UserIsCustomer, Book_1.get_books);
// Get book by Id
router.route("/:id").get(middlewares_1.Auth, middlewares_1.UserIsCustomer, Book_1.get_book);
exports.default = router;
