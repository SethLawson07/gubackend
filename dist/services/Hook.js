"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.payWithGoodpay = exports.hookValidateOrder = exports.hookCreateOrder = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const jwt = __importStar(require("jsonwebtoken"));
const server_1 = require("../server");
const utils_1 = require("../utils");
const headers_1 = require("../utils/headers");
const zod_validation_error_1 = require("zod-validation-error");
const axios_1 = __importDefault(require("axios"));
const dayjs_1 = __importDefault(require("dayjs"));
const Contribution_1 = require("./Contribution");
// Create Payment (Order)
const hookCreateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schema = zod_1.z.object({
            userId: zod_1.z.string(),
            type: zod_1.z.string(),
            amount: zod_1.z.number(),
            gateway: zod_1.z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const { user } = req.body.user;
        const header = (0, headers_1.semoaCashPayHeader)();
        const data = btoa(JSON.stringify(validation.data));
        if (!(validation.data.userId == user.id))
            return res.status(403).send({ error: true, message: "Forbidden", data: {} });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${process.env.SEMOA_CASHPAY_API_URL}/orders`,
            headers: header,
            data: JSON.stringify({
                "amount": validation.data.amount,
                "description": "Recharge de compte MidjoPay",
                "client": {
                    "lastname": user.id,
                    "firstname": user.user_name,
                    "phone": "+22897990733"
                    // "phone": `228${user.phone}`
                },
                "gateway_id": (0, utils_1.semoaCashPayGateway)(validation.data.gateway),
                "callback_url": `https://goodapp.onrender.com/hook/order/validate/${data}`,
                // "callback_url": `https://goodapp-9c0o.onrender.com/hook/order/validate/${data}`,
                "redirect_url": "https://google.com",
            })
        };
        const response = yield (0, axios_1.default)(config);
        if (!response)
            return res.status(400).send({ error: true, message: "...", data: {} });
        if (!(response.data.status == "success"))
            return res.status(400).send({ error: true, message: "Veuillez réssayer SVP !" });
        console.log(response.data);
        return res.status(200).send({
            error: false, message: "ok", data: {
                action: (_a = response.data["payments_method"][0].action) !== null && _a !== void 0 ? _a : null, phone: user.phone, transaction: validation.data.type, gateway: validation.data.gateway,
                others: response.data,
            }
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
});
exports.hookCreateOrder = hookCreateOrder;
const validateContribution = (customer, amount, phone) => __awaiter(void 0, void 0, void 0, function* () {
    const payment_method = (0, utils_1.operatorChecker)(phone);
    const schemaData = { customer, amount, p_method: payment_method, createdAt: (0, dayjs_1.default)(Date.now()).toDate() };
    const user = yield server_1.prisma.user.findUnique({ where: { id: customer } });
    if (!user) {
        console.log({ error: true, message: "User not found", data: {} });
        return;
    }
    ;
    return yield (0, Contribution_1.contributionEvent)(express_1.request, express_1.response, user, schemaData, "mobilemoney");
});
const validateDeposit = (userId, amount, phone) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield server_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.log({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
        return;
    }
    ;
    const account = yield server_1.prisma.account.findFirst({ where: { userId } });
    if (!account) {
        console.log({ error: true, status: 404, message: "Compte non trouvé", data: {} });
        return;
    }
    const report = yield server_1.prisma.report.create({
        data: {
            type: "deposit", amount: amount, createdat: (0, dayjs_1.default)(Date.now()).format(),
            payment: (0, utils_1.operatorChecker)(phone), status: "unpaid", customerId: user.id,
        }
    });
    if (!report) {
        console.log({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        return;
    }
    ;
    const [deposit, aUpdate] = yield server_1.prisma.$transaction([
        server_1.prisma.deposit.create({
            data: {
                account: account.id, amount: amount, createdAt: (0, dayjs_1.default)(Date.now()).format(),
                customer: user.id, madeby: user.role, payment: (0, utils_1.operatorChecker)(phone), reportId: report.id
            }
        }),
        server_1.prisma.account.update({ where: { id: account.id }, data: { balance: account.balance + amount } }),
    ]);
    if (!aUpdate && !deposit) {
        console.log({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
        return;
    }
    ;
    yield server_1.prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
    {
        console.log({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
        return;
    }
    ;
});
const validateAddBook = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield server_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.log({ error: true, message: "User not found", data: {} });
        return;
    }
    ;
    const bookIsOpened = yield server_1.prisma.book.findFirst({ where: { status: "opened", userId: user.id } });
    if (bookIsOpened) {
        console.log({ error: true, message: "Impossible de créer le carnet", data: {} });
        return;
    }
    ;
    const [created_book, report_bet] = yield server_1.prisma.$transaction([
        server_1.prisma.book.create({ data: { bookNumber: "", createdAt: (0, dayjs_1.default)(Date.now()).format(), userId: user.id, status: "opened", sheets: [] } }),
        server_1.prisma.betReport.create({ data: { goodnessbalance: 300, agentbalance: 0, createdat: (0, dayjs_1.default)(Date.now()).format(), agentId: user.agentId, customerId: user.id, type: "book" } }),
    ]);
    if (!created_book || !report_bet) {
        console.log({ error: true, message: "Cound not create", data: {} });
        return;
    }
    ;
    const sheets = (0, utils_1.create_sheets)(created_book, 300, (0, dayjs_1.default)(Date.now()).toDate());
    if (sheets) {
        yield server_1.prisma.book.update({ where: { id: created_book.id }, data: { sheets: sheets }, });
        yield server_1.agenda.schedule('in 1 years, 7 days', 'closebook', { created_book });
    }
    else {
        console.log("Erreur inconnue");
        return;
    }
});
// Validate payment
const hookValidateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({ token: zod_1.z.string() });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: "Body must be completed by SEMOA CASHPAY CALLBACK", data: {} });
        const data = req.params.data;
        const transactionData = JSON.parse(atob(data));
        const token = validation.data.token;
        const tokendata = jwt.verify(token, process.env.SEMOA_API_KEY, { algorithms: ["HS256"] });
        if (!tokendata)
            return res.status(403).send({ error: true, message: "You provide an invalid token", data: {} });
        console.log(tokendata);
        console.log(transactionData);
        if (tokendata && tokendata.state == "Paid") {
            console.log(transactionData);
            switch (transactionData.type) {
                case "tontine":
                    validateContribution(transactionData.userId, tokendata.amount, tokendata.client.phone);
                    break;
                case "saving":
                    validateDeposit(transactionData.userId, tokendata.amount, tokendata.client.phone);
                    break;
                case "addbook":
                    validateAddBook(transactionData.userId);
                    break;
                default: break;
            }
        }
        else {
            return res.status(404).send({ error: true, message: "Invalid Token!", data: {} });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
});
exports.hookValidateOrder = hookValidateOrder;
const payWithGoodpay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({
            userId: zod_1.z.string(),
            amount: zod_1.z.number(),
            date: zod_1.z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: "Schema incorrect", data: {} });
        var targetted_user = yield server_1.prisma.user.findUnique({ where: { id: validation.data.userId } });
        if (!targetted_user || !targetted_user.is_verified)
            return res.status(403).send({ error: true, message: "User not verified", data: {} });
        const account = yield server_1.prisma.account.findFirst({ where: { userId: validation.data.userId } });
        if (!account)
            return res.status(404).send({ error: true, message: "User Account not found", data: {} });
        if (account.balance < validation.data.amount)
            return res.status(403).send({ error: true, message: "Insufficient balance", data: {} });
        var updated = yield server_1.prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - validation.data.amount } });
        if (!updated)
            return res.status(501).send({ error: true, message: "Une erreur s'est produite", data: {} });
        return res.status(200).send({ error: false, message: `Transaction réussie. Nouveau solde: ${updated.balance}`, data: {} });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ error: true, message: "Un erreur s'est produite", data: {} });
    }
});
exports.payWithGoodpay = payWithGoodpay;
