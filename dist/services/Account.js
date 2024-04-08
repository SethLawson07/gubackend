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
exports.pay_goodpay = exports.get_user_account = exports.get_account = exports.user_has_account = exports.create_account = void 0;
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../server");
const zod_1 = require("zod");
// Créer un compte tontine ou depot utilisateur
function create_account(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // a refers to account
            const account_schema = zod_1.z.object({
                a_number: zod_1.z.string(),
                a_type: zod_1.z.string(),
                amount: zod_1.z.number().default(0.0),
                createdAt: zod_1.z.coerce.date(),
                customer: zod_1.z.string(),
            });
            const validation_result = account_schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message });
            let a_data = validation_result.data;
            const result = yield server_1.prisma.account.create({
                data: { number: a_data.a_number, type: a_data.a_type, balance: a_data.amount, createdAt: new Date(a_data.createdAt), userId: a_data.customer }
            });
            return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data: result });
        }
        catch (err) {
            console.error(`Error while creating account`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.create_account = create_account;
// Créer un compte tontine ou depot utilisateur
function user_has_account(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const account_schema = zod_1.z.object({
                userid: zod_1.z.string(),
            });
            let data = false;
            const validation_result = account_schema.safeParse(req.params);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message });
            const account = yield server_1.prisma.account.findFirst({ where: { userId: validation_result.data.userid } });
            if (account) {
                data = true;
            }
            return res.status(201).send({ status: 201, error: false, message: 'Le compte a été créé', data });
        }
        catch (err) {
            console.error(`Error while creating account`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.user_has_account = user_has_account;
// Get Account
function get_account(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accountid = req.params.id;
            const account = yield server_1.prisma.account.findUnique({ where: { id: accountid } });
            if (!account)
                return res.status(404).send({ error: true, message: "Carnet non trouvé", data: {} });
            return res.status(200).send({ error: false, message: "Requête aboutie", data: account });
        }
        catch (err) {
            console.log(err);
            console.log("Error while trying to get account");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.get_account = get_account;
// Get User Account
function get_user_account(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userid = req.params.id;
            const targetted_user = yield server_1.prisma.user.findUnique({ where: { id: userid } });
            if (!targetted_user)
                return res.status(404).send({ error: true, message: "User not found", data: {} });
            const targetted_account = yield server_1.prisma.account.findFirst({ where: { userId: targetted_user.id, type: "tontine" } });
            if (!targetted_account)
                return res.status(404).send({ error: true, message: "Account not found", data: {} });
            return res.status(200).send({ error: false, message: "Requête aboutie", data: targetted_account });
        }
        catch (err) {
            console.log(err);
            console.log("Error while trying to get user account");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.get_user_account = get_user_account;
// pay with Goodpay
function pay_goodpay(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                userid: zod_1.z.string().nonempty("Id utilisateur requis"),
                amount: zod_1.z.number().nonnegative("Montant invalide"),
                litpay: zod_1.z.boolean().default(false),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).details[0].message, data: {} });
            const data = validation.data;
            const account = yield server_1.prisma.account.findFirst({ where: { userId: data.userid } });
            if (!account)
                return res.status(404).send({ error: true, message: "Vous n'avez pas de compte Goodpay", data: {} });
            const p_validation = account.balance - data.amount;
            if (p_validation >= 0 || (p_validation < 0 && data.litpay)) {
                yield server_1.prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - data.amount } });
                return res.status(404).send({ error: false, message: "Paiement éffectué", data: {} });
            }
            else {
                return res.status(400).send({ error: true, message: "Solde insuffisant", data: {} });
            }
        }
        catch (err) {
            console.log(err);
            console.log("Error while ... action");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.pay_goodpay = pay_goodpay;
