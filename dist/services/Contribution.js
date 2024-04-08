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
exports.contributionValidationEvent = exports.contributionEvent = exports.userContributions = exports.target_contribution = exports.contributions_agent = exports.user_contributions = exports.reject_contribution = exports.validate_contribution = exports.contribute = void 0;
const server_1 = require("../server");
const zod_validation_error_1 = require("zod-validation-error");
const zod_1 = require("zod");
const utils_1 = require("../utils");
const Book_1 = require("./Book");
const Sheet_1 = require("./Sheet");
// Cotiser
function contribute(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                customer: zod_1.z.string(),
                amount: zod_1.z.number(),
                p_method: zod_1.z.string(),
                createdAt: zod_1.z.coerce.date(),
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).message, data: {} });
            const { user } = req.body.user;
            let data = validation_result.data;
            return yield (0, exports.contributionEvent)(req, res, user, data, "directmethod");
        }
        catch (e) {
            console.log(e);
            return res.status(500).send({ error: true, message: "Une erreur interne est survenue" });
        }
    });
}
exports.contribute = contribute;
// Validate contribution
function validate_contribution(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contribution = req.params.id;
            const schema = zod_1.z.object({ validatedat: zod_1.z.coerce.date(), });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const { user } = req.body.user;
            let targeted_contribution = yield server_1.prisma.contribution.findUnique({ where: { id: contribution } });
            if (targeted_contribution) {
                const customer = yield server_1.prisma.user.findUnique({ where: { id: targeted_contribution.userId } });
                if (!customer)
                    return res.status(404).send({ error: true, message: "Customer not found" });
                const status = user.role == "admin" ? "paid" : "awaiting";
                let result = yield (0, utils_1.sheet_validate)(customer, targeted_contribution.cases, status);
                if (!result.error && result.cases) {
                    const validated = yield server_1.prisma.contribution.update({ where: { id: contribution }, data: { agent: customer.agentId, awaiting: user.role == "agent" ? "admin" : "none", status: status } });
                    if (validated) {
                        return yield (0, exports.contributionValidationEvent)(req, res, user, { customer, targeted_contribution, user, result, schemadata: validation.data, validated, book: result.book.data });
                        // await validateContributionJobQueue.add("validateContribution", { customer, targeted_contribution, user, result, schemadata: validation.data, validated, book: result.book.data });
                    }
                    else {
                        return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: {} });
                    }
                }
            }
            else {
                return res.status(401).send({ error: true, message: "Ressources non trouvées", data: {} });
            }
        }
        catch (err) {
            console.log(err);
            console.log("Error while ... action");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.validate_contribution = validate_contribution;
// Reject contribution
function reject_contribution(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contribution = req.params.id;
            const schema = zod_1.z.object({ validatedat: zod_1.z.coerce.date(), });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const { user } = req.body.user;
            let targeted_contribution = yield server_1.prisma.contribution.findUnique({ where: { id: contribution } });
            if (targeted_contribution) {
                const customer = yield server_1.prisma.user.findUnique({ where: { id: targeted_contribution.userId } });
                if (!customer)
                    return res.status(404).send({ error: true, message: "User not found", data: {} });
                let result = yield (0, utils_1.sheet_reject)(customer, targeted_contribution.cases);
                if (!result.error && result.cases) {
                    yield server_1.prisma.contribution.update({ where: { id: contribution }, data: { awaiting: user.role == "agent" ? "admin" : "none", status: "rejected" } });
                    yield server_1.prisma.report.update({ where: { id: targeted_contribution.reportId }, data: { status: "unpaid", agentId: customer.agentId } });
                    yield server_1.prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets } });
                    if (customer.device_token) {
                        yield (0, utils_1.sendPushNotification)(customer.device_token, "Cotisation", `Votre cotisation a été rejetée`);
                    }
                    ;
                    return res.status(200).send({ error: false, message: "Cotisation rejetée", data: {} });
                }
                else {
                    return res.status(400).send({ error: result.error, message: result.message, data: {} });
                }
            }
            else {
                return res.status(401).send({ error: true, message: "Ressources non trouvées", data: {} });
            }
        }
        catch (err) {
            console.log(err);
            console.log("Error while ... action");
            return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.reject_contribution = reject_contribution;
// Liste des cotisations utilisateurs
function user_contributions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const schema = zod_1.z.object({
            status: zod_1.z.string().default("awaiting"),
            startDate: zod_1.z.coerce.date(),
            endDate: zod_1.z.coerce.date(),
            userId: zod_1.z.string().default("all"),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const { user } = req.body.user;
        let contributions;
        switch (user.role) {
            case "customer":
                contributions = yield (0, utils_1.customerContributions)(user);
                break;
            case "agent":
                contributions = yield (0, utils_1.userAgentContributions)(user);
                break;
            case "admin":
                contributions = yield (0, utils_1.allContributions)(validation.data);
                break;
            default: break;
        }
        return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions });
    });
}
exports.user_contributions = user_contributions;
// Liste des cotisations utilisateurs
function contributions_agent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const schema = zod_1.z.object({ type: zod_1.z.string().default("all") });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const data = validation.data;
        const { user } = req.body.user;
        const contributions = yield server_1.prisma.contribution.findMany({ where: { agent: user.id, status: data.type == "all" ? { in: ["paid", "unpaid", "awaiting", "rejected"] } : data.type }, include: { customer: true } });
        return res.status(200).send({ error: false, message: "Requête aboutie", data: contributions });
    });
}
exports.contributions_agent = contributions_agent;
// Trouver une cotisation
function target_contribution(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const contribution = req.params.id;
        let targeted_contribution = yield server_1.prisma.contribution.findUnique({ where: { id: contribution } });
        let targeted_user = yield server_1.prisma.user.findUnique({ where: { id: targeted_contribution.userId } });
        return res.status(200).send({ error: false, message: "Request end", data: Object.assign(Object.assign({}, targeted_contribution), { customer: targeted_user }) });
    });
}
exports.target_contribution = target_contribution;
// Get user contributions
const userContributions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userid;
        const contributions = yield server_1.prisma.contribution.findMany({ where: { userId: userId }, include: { customer: true } });
        return res.status(200).send({ error: false, data: contributions, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.userContributions = userContributions;
const contributionEvent = (req, res, user, data, type) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield (0, utils_1.sheet_contribute)(data.customer, data.amount, data.p_method);
    const agentId = user.role == "agent" ? user.id : user.agentId;
    if (!result.error && result.cases) {
        const report = yield server_1.prisma.report.create({
            data: {
                type: "contribution",
                amount: data.amount,
                createdat: data.createdAt,
                payment: data.p_method,
                sheet: result.sheet,
                cases: result.cases.map(chiffre => chiffre + 1),
                status: "awaiting",
                customerId: data.customer, agentId
            }
        });
        if (!report)
            return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        const contribution = yield server_1.prisma.contribution.create({
            data: {
                createdAt: data.createdAt,
                userId: data.customer,
                pmethod: data.p_method,
                status: "awaiting",
                reportId: report.id,
                awaiting: user.role == "agent" ? "admin" : "agent",
                amount: data.amount,
                cases: result.cases.map(chiffre => chiffre + 1),
                sheet: result.sheet.id,
                agent: agentId,
            },
        });
        if (contribution) {
            switch (type) {
                case "directmethod":
                    yield server_1.prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets } });
                    if (user.role == "customer") {
                        const agent = yield server_1.prisma.user.findFirst({ where: { id: user.agentId } });
                        if (!agent)
                            return res.status(404).send({ error: true, message: "Agent not found", data: {} });
                        agent.device_token != "" ? yield (0, utils_1.sendPushNotification)(agent.device_token, "Cotisation", `${user.user_name} vient de cotiser la somme de ${data.amount} FCFA pour son compte tontine`) : {};
                    }
                    ;
                    return res.status(200).send({ error: false, message: "Cotisation éffectée", data: contribution });
                case "mobilemoney":
                    const user_acount = yield server_1.prisma.account.findFirst({ where: { userId: data.customer } });
                    if (!user_acount)
                        return console.log("Compte non trouvé");
                    let balance = ((user_acount === null || user_acount === void 0 ? void 0 : user_acount.balance) + data.amount);
                    const cases = result.cases.map(chiffre => chiffre + 1);
                    if (cases.includes(1)) {
                        server_1.prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet) } });
                    }
                    else {
                        yield server_1.prisma.account.update({ where: { id: user_acount.id }, data: { balance } });
                    }
                    yield server_1.prisma.book.update({ where: { id: result.book.data.id }, data: { sheets: result.updated_sheets } });
                    yield server_1.prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
                    yield server_1.prisma.contribution.update({ where: { id: contribution.id }, data: { status: "paid" } });
                default:
                    break;
            }
        }
        else {
            return res.status(401).send({ error: true, message: "Une erreur s'est produite réessayer", data: contribution });
        }
    }
    else {
        if (result.isSheetFull) {
            yield (0, Sheet_1.forceclosesheet)(user);
            return res.status(200).send({ error: result.error, message: result.message, data: { isSheetFull: true }, });
        }
        ;
        if (result.isBookFull) {
            yield (0, Book_1.forceclosebook)(user);
            return res.status(200).send({ error: result.error, message: result.message, data: { isBookFull: true }, });
        }
        ;
        return res.status(200).send({ error: result.error, message: result.message, data: {} });
    }
});
exports.contributionEvent = contributionEvent;
const contributionValidationEvent = (req, res, user, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { customer, targeted_contribution, result, schemadata, validated, book } = data;
    const user_acount = yield server_1.prisma.account.findFirst({ where: { userId: customer.id } });
    if (!user_acount)
        return res.status(404).send({ error: true, message: "Utilisateur non trouvé", data: {} });
    let balance = ((user_acount === null || user_acount === void 0 ? void 0 : user_acount.balance) + targeted_contribution.amount);
    if (user.role == "admin") {
        if (result.cases.includes(1)) {
            const agent_benefit = result.sheet.bet * 0.2;
            const [uaUpdate, report_bet] = yield server_1.prisma.$transaction([
                server_1.prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet) } }),
                server_1.prisma.betReport.create({
                    data: {
                        goodnessbalance: result.sheet.bet - agent_benefit, agentbalance: agent_benefit, createdat: schemadata.validatedat,
                        agentId: customer.agentId, customerId: customer.id, type: "bet"
                    }
                }),
            ]);
            if (!uaUpdate || !report_bet)
                return res.status(403).send({ error: true, message: "Cotisation non validée", data: {} });
        }
        else {
            yield server_1.prisma.account.update({ where: { id: user_acount.id }, data: { balance } });
        }
    }
    yield server_1.prisma.book.update({ where: { id: book.id }, data: { sheets: result.updated_sheets } });
    yield server_1.prisma.report.update({ where: { id: validated.reportId }, data: { agentId: customer.agentId, status: validated.status, } });
    if (user.role == "admin" && (customer === null || customer === void 0 ? void 0 : customer.device_token)) {
        yield (0, utils_1.sendPushNotification)(customer === null || customer === void 0 ? void 0 : customer.device_token, "Cotisation", `Votre cotisation en attente vient d'être validé`);
    }
    ;
    return res.status(200).send({ status: 200, error: false, message: "Cotisation validée", data: validated });
});
exports.contributionValidationEvent = contributionValidationEvent;
