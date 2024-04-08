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
exports.cases_valiation = exports.forceclosesheet = exports.close_sheet = exports.open_sheet = exports.check_for_opened_sheet = void 0;
const utils_1 = require("../utils");
const server_1 = require("../server");
const zod_validation_error_1 = require("zod-validation-error");
const zod_1 = require("zod");
// Trouver la feuille ouverte
function check_for_opened_sheet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body.user;
            const sheet = yield (0, utils_1.opened_sheet)(user);
            return res.status(200).send({ error: sheet.error, message: sheet.message, data: Object.assign(Object.assign({}, sheet.data), { book: sheet.book }), book: sheet.book });
        }
        catch (e) {
            console.log(e);
            res.status(500).send({ error: true, message: "Une erreur interne est survenue", data: {} });
        }
    });
}
exports.check_for_opened_sheet = check_for_opened_sheet;
// Ouvrir une feuille
function open_sheet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                bet: zod_1.z.number().min(300).default(300),
                openedAt: zod_1.z.coerce.date(),
                userId: zod_1.z.string(),
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).message, data: {} });
            const user = yield server_1.prisma.user.findUnique({ where: { id: validation_result.data.userId } });
            if (!user)
                return res.status(404).send({ error: true, message: "Utilisateur non trouvé", data: {} });
            const book = yield (0, utils_1.opened_book)(user.id);
            if (book.error || !book.book || !book.data)
                return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            const sheets = yield (0, utils_1.update_sheets)(user, validation_result.data.openedAt, validation_result.data.bet);
            if (sheets.error)
                return res.status(400).send({ error: true, message: sheets.message, data: {} });
            yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { sheets: sheets.updated_sheets } });
            // await agenda.schedule('in 1 months, 1 days', 'closesheet', { book, sheet: sheets.sheet });
            yield server_1.agenda.schedule('in 31 days', 'closesheet', { book: book.data, sheet: sheets.sheet });
            return res.status(200).send({ error: false, message: "Feuille ouverte", data: {} });
        }
        catch (e) {
            console.log(e);
            res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
        }
    });
}
exports.open_sheet = open_sheet;
// // Trouver une feuille
// export async function get_sheet(req: Request, res: Response) {
//     try {
//         const schema = z.object({ b_id: z.string(), s_id: z.string() });
//         const validation = schema.safeParse(req.body);
//         if (!validation.success) return res.status(404).send({ error: true, message: "Données non validées", data: {} });
//         const book = await prisma.book.findUnique({ where: { id: validation.data.b_id } });
//         if (!book) return res.status(404).send({ error: true, message: "Carnet non trouvé", data: {} });
//         const sheet = book.sheets.find((e) => e.id == validation.data.s_id);
//         if (!sheet) return res.status(404).send({ error: true, message: "", data: {} });
//         return res.status(200).send({ error: false, message: '', data: sheet });
//     } catch (err) {
//         console.log(err);
//         console.log("Error while getting sheets");
//         return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
//     }
// }
// Bloquer la feuile
function close_sheet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body.user;
            const book = yield (0, utils_1.opened_book)(user.id);
            if (book.error || !book.book || !book.data)
                return res.status(403).send({ error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null });
            const sheets = book.data.sheets;
            const sheetToClose = yield (0, utils_1.sheet_to_close)(user);
            if (sheetToClose.error || sheetToClose.data == null)
                return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
            const sheet = sheetToClose.data;
            let updated_sheets = sheets;
            let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
            const awaitingContributions = yield server_1.prisma.contribution.findMany({ where: { sheet: sheet.id, status: "awaiting" } });
            if (awaitingContributions.length > 0) {
                return res.status(400).send({ error: true, message: "Des cotisations sont en cours de validation" });
            }
            ;
            const unpaidCases = sheet.cases.filter((e) => e.contributionStatus == "unpaid");
            if (unpaidCases && unpaidCases.length >= 31) {
                return res.status(400).send({ error: true, message: "Impossible de bloquer la feuille vierge" });
            }
            ;
            sheet.status = "closed";
            updated_sheets[sheetIndex] = sheet;
            let update_book = yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
            if (update_book && sheetToClose.data.index == 11) {
                update_book = yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
            }
            return res.status(200).send({ status: 201, error: false, message: 'Feuille bloquée', data: update_book, });
        }
        catch (err) {
            console.log(err);
            console.log("Error while closing sheet");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.close_sheet = close_sheet;
// Close sheet on file
const forceclosesheet = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield (0, utils_1.opened_book)(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: false, update_sheets: null };
        const sheets = book.data.sheets;
        const sheetToClose = yield (0, utils_1.sheet_to_close)(user);
        if (sheetToClose.error || sheetToClose.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: false, update_sheets: null };
        const sheet = sheetToClose.data;
        let updated_sheets = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        sheet.status = "closed";
        updated_sheets[sheetIndex] = sheet;
        yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { sheets: updated_sheets } });
        return { error: false, message: "ok", data: {} };
    }
    catch (err) {
        console.log(err);
        console.log("Error while closing sheet");
        return false;
    }
});
exports.forceclosesheet = forceclosesheet;
// Sheet cases Validation
function cases_valiation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ amount: zod_1.z.number().min(300) });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: "Amount required", data: {} });
            const data = validation.data;
            const { user } = req.body.user;
            const result = yield (0, utils_1.sheet_validation)(user.id, data.amount);
            if (result.error)
                return res.status(400).send({ error: true, message: result.message, data: {} });
            return res.status(200).send({ error: false, data: {}, message: "ok" });
        }
        catch (err) {
            console.log(err);
            console.log("Error while ... action");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.cases_valiation = cases_valiation;
