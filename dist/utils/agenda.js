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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
const axios_1 = __importDefault(require("axios"));
// Définition de la tâche
server_1.agenda.define('closebook', (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { created_book } = job.attrs.data;
    yield server_1.prisma.book.update({ where: { id: created_book.id }, data: { status: "closed" } });
}));
// Définition de la tâche
server_1.agenda.define('closesheet', (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { book, sheet } = job.attrs.data;
    const sheets = book.sheets;
    let updated_sheets = sheets;
    let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
    sheet.status = "closed";
    updated_sheets[sheetIndex] = sheet;
    yield server_1.prisma.book.update({ where: { id: book.id }, data: { sheets: updated_sheets } });
}));
// Appel récurent pour éviter la pause du serveur (gratuit)
// A enlever après
server_1.agenda.define('checkserver', (job) => __awaiter(void 0, void 0, void 0, function* () {
    let config = { method: 'GET', url: 'https://goodapp.onrender.com/health', };
    yield (0, axios_1.default)(config);
}));
