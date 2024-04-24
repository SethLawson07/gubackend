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
exports.adminHome = exports.agentHome = exports.customerHome = exports.siteHome = void 0;
const utils_1 = require("../utils");
const server_1 = require("../server");
function siteHome(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const latestProducts = yield server_1.prisma.product.findMany({
                orderBy: { createdat: 'desc' },
                take: 15, // Limiter les résultats à 15 produits
            });
            const areaOne = yield server_1.prisma.area.findMany({ where: { title: "one" }, include: { Section: { include: { Product: true } } } });
            const areaTwo = yield server_1.prisma.area.findMany({ where: { title: "two" }, include: { Section: { include: { Product: true } } } });
            const services = yield server_1.prisma.service.findMany({ where: { featured: true }, include: { TypeService: true } });
            const areaThree = yield server_1.prisma.area.findMany({ where: { title: "three" }, include: { Section: { include: { Product: true } } } });
            const categories = yield server_1.prisma.category.findMany({ where: { featured: true }, include: { SubCategory: { include: { Item: true } } } });
            const responseData = {
                "latest": latestProducts,
                "areaOne": areaOne,
                "areaTwo": areaTwo,
                "services": services,
                "areaThree": areaThree,
                "categories": categories,
            };
            return res.status(200).send({ error: false, message: "ok", data: [responseData] });
        }
        catch (err) {
            console.error(`${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.siteHome = siteHome;
const customerHome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body.user;
        const sheet = yield (0, utils_1.opened_sheet)(user);
        const account = yield server_1.prisma.account.findFirst({ where: { userId: user.id, type: "tontine" } });
        const banner = (yield server_1.prisma.banner.findMany()).reverse();
        return res.status(200).send({ error: false, data: Object.assign(Object.assign({}, sheet.data), { book: sheet.book, account, banner }), message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.customerHome = customerHome;
const agentHome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.agentHome = agentHome;
const adminHome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.status(200).send({ error: false, data: {}, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.adminHome = adminHome;
