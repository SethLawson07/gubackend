"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceclosebook = exports.get_opened_book = exports.get_book = exports.get_books = exports.addBook = exports.userBookIsOpened = exports.create_book = void 0;
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../server");
const utils_1 = require("../utils");
const zod_1 = require("zod");
// Créer un carnet
function create_book(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // b refers to book
            const schema = zod_1.z.object({
                b_number: zod_1.z.string(),
                createdAt: zod_1.z.coerce.date(),
                customer: zod_1.z.string(),
                bet: zod_1.z.number().min(300, "Montant de la mise invalide").default(300)
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message });
            let b_data = validation_result.data;
            const tUser = yield server_1.prisma.user.findUnique({ where: { id: b_data.customer } });
            if (!tUser)
                return res.status(404).send({ error: true, message: "User not found", data: {} });
            const bookIsOpened = yield server_1.prisma.book.findFirst({ where: { status: "opened", userId: tUser.id } });
            if (bookIsOpened)
                return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
            const [created_book, report_bet] = yield server_1.prisma.$transaction([
                server_1.prisma.book.create({ data: { bookNumber: b_data.b_number, createdAt: new Date(b_data.createdAt), userId: tUser.id, status: "opened", sheets: [] } }),
                server_1.prisma.betReport.create({ data: { goodnessbalance: 250, agentbalance: 50, createdat: b_data.createdAt, agentId: tUser.agentId, customerId: tUser.id, type: "book" } }),
            ]);
            if (!create_book || !report_bet)
                return res.status(400).send({ error: true, message: "Erreur interne", data: {} });
            const sheets = (0, utils_1.create_sheets)(created_book, validation_result.data.bet, validation_result.data.createdAt);
            if (sheets)
                yield server_1.prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
            yield server_1.agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
            return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: created_book });
        }
        catch (err) {
            console.log(err);
            console.error(`Error while creating book`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.create_book = create_book;
// Is User Book Opened ?
function userBookIsOpened(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ customer: zod_1.z.string(), });
            const validation = schema.safeParse(req.params);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).details[0].message });
            const user = yield server_1.prisma.user.findUnique({ where: { id: validation.data.customer } });
            if (!user)
                return res.status(404).send({ error: true, message: "User not found", data: {} });
            const bookIsOpened = yield server_1.prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
            if (bookIsOpened)
                return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
            return res.status(201).send({ status: 201, error: false, message: 'Possible', data: {} });
        }
        catch (err) {
            console.log(err);
            console.error(`Error while creating book`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.userBookIsOpened = userBookIsOpened;
// addbook
function addBook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                createdAt: zod_1.z.coerce.date(),
                customer: zod_1.z.string()
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message });
            let b_data = validation_result.data;
            const { user } = req.body.user;
            const bookIsOpened = yield server_1.prisma.book.findFirst({ where: { status: "opened", userId: validation_result.data.customer } });
            if (bookIsOpened)
                return res.status(400).send({ error: true, message: "Impossible de créer le carnet", data: {} });
            const customer = yield server_1.prisma.user.findUnique({ where: { id: b_data.customer } });
            if (!customer)
                return res.status(404).send({ error: true, message: "User not found", data: {} });
            const account = yield server_1.prisma.account.findFirst({ where: { userId: customer.id } });
            if (!account)
                return res.status(404).send({ error: true, message: "User account not found", data: {} });
            if (account.balance < 300)
                return res.status(403).send({ error: true, message: "Solde Goodpay inssufisant", data: {} });
            const [addedbook, debit] = yield server_1.prisma.$transaction([
                server_1.prisma.book.create({ data: { bookNumber: "", createdAt: new Date(b_data.createdAt), userId: customer.id, status: "opened", sheets: [] } }),
                server_1.prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - 300 } }),
                server_1.prisma.betReport.create({ data: { goodnessbalance: 250, agentbalance: 50, createdat: b_data.createdAt, agentId: customer.agentId, customerId: customer.id, type: "book" } }),
            ]);
            const sheets = (0, utils_1.create_sheets)(addedbook, 300, validation_result.data.createdAt);
            if (sheets) {
                yield server_1.prisma.book.update({ where: { id: addedbook.id }, data: { sheets: sheets }, });
            }
            yield server_1.agenda.schedule('in 1 years, 7 days', 'closebook', { created_book: addedbook });
            return res.status(201).send({ status: 201, error: false, message: 'Le carnet a été créé', data: addedbook });
        }
        catch (err) {
            console.log(err);
            console.error(`Error while creating book`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.addBook = addBook;
// Liste de tous les carnets
function get_books(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body.user;
            let books = yield server_1.prisma.book.findMany({ where: { userId: user.id } });
            if (!books)
                return res.status(404).send({ error: true, message: "Aucun livre pour cet utilisateur", data: {} });
            return res.status(200).send({ error: false, message: "Requête aboutie", data: books });
        }
        catch (err) {
            console.log(err);
            console.log("Error while getting books");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.get_books = get_books;
// Trouver un carnet
function get_book(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let bookid = req.params.id;
            const { user } = req.body.user;
            let book = yield server_1.prisma.book.findUnique({ where: { id: bookid } });
            if (!book)
                return res.status(404).send({ error: true, message: "Carnet non trouvé" });
            return res.status(200).send({ error: false, message: "Requête aboutie", data: book });
        }
        catch (err) {
            console.log(err);
            console.log("Error while trying to get book");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.get_book = get_book;
// Carnet ouvert (courant ou actuel)
function get_opened_book(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body.user;
            let book = yield server_1.prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
            if (!book)
                return res.status(404).send({ error: true, message: "Aucun livre ouvert", data: {} });
            return res.status(200).send({ error: false, message: "", data: book });
        }
        catch (err) {
            console.log(err);
            console.log("Error while trying to get book");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.get_opened_book = get_opened_book;
// Close book on file
const forceclosebook = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield (0, utils_1.opened_book)(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
        yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
        return { error: false, message: "ok", data: {} };
    }
    catch (err) {
        console.log(err);
        console.log("Error while closing sheet");
        return false;
    }
});
exports.forceclosebook = forceclosebook;
