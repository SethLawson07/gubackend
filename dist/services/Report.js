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
exports.allAgentsBalance = exports.allCustomersBalance = exports.agentBalance = exports.totalBetReport = exports.report_all = void 0;
const server_1 = require("../server");
const zod_validation_error_1 = require("zod-validation-error");
const zod_1 = require("zod");
const report_all = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({
            type: zod_1.z.string(),
            startDate: zod_1.z.coerce.date(),
            endDate: zod_1.z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const vdata = validation.data;
        const reportData = yield server_1.prisma.report.findMany({ where: { type: vdata.type, status: 'paid', createdat: { gte: vdata.startDate, lte: vdata.endDate, } }, include: { agent: true, customer: true } });
        const aggregate = yield server_1.prisma.report.groupBy({ by: ["payment"], _sum: { amount: true }, where: { status: 'paid', type: vdata.type, createdat: { gte: vdata.startDate, lte: vdata.endDate, } } });
        const aggregatedData = aggregate.reduce((result, item) => {
            var _a;
            const paymentMethod = item.payment;
            const amount = (_a = item._sum.amount) !== null && _a !== void 0 ? _a : 0.0;
            result[paymentMethod] = (result[paymentMethod] || 0) + amount;
            result.total = (result.total || 0) + amount;
            return result;
        }, { total: 0 });
        const data = Object.assign({ reports: reportData }, aggregatedData);
        return res.status(200).send({ error: false, data, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.report_all = report_all;
// export const totalReport = async (req: Request, res: Response) => {
//     try {
//         const schema = z.object({
//             value: z.string().default("total"),
//             agent: z.array(z.string()),
//             method: z.string().default(""),
//             type: z.string().default("contribution"),
//         });
//         const validation = schema.safeParse(req.body);
//         if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
//         const data = validation.data;
//         switch (data.value) {
//             case "total":
//                 utilsTotalReport(data.type, data.agent, data.method); break;
//             case "":
//                 utilsNonSpecifiedReport(data.type, data.agent, data.method); break;
//             default: break;
//         }
//     } catch (err) {
//         console.log(err);
//         return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
//     }
// }
// Commissions.
const totalBetReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({
            startDate: zod_1.z.coerce.date(), endDate: zod_1.z.coerce.date(),
            type: zod_1.z.string().default("all"),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const vdata = validation.data;
        const where = vdata.type == "all" ? { type: { in: ["book", "bet"] }, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }
            : { type: vdata.type, createdat: { gte: vdata.startDate, lte: vdata.endDate, } };
        const reportData = yield server_1.prisma.betReport.findMany({ where, include: { agent: true, customer: true } });
        const goodnessAggregate = yield server_1.prisma.betReport.groupBy({ by: ["type"], _sum: { goodnessbalance: true }, where });
        const commercialAggregate = yield server_1.prisma.betReport.groupBy({ by: ["type"], _sum: { agentbalance: true }, where });
        const commAggregatedData = commercialAggregate.reduce((result, item) => {
            var _a;
            const type = item.type + "agent";
            const amount = (_a = item._sum.agentbalance) !== null && _a !== void 0 ? _a : 0.0;
            result[type] = (result[type] || 0) + amount;
            result.totalagent = (result.totalagent || 0) + amount;
            return result;
        }, { totalagent: 0 });
        const goodAggregatedData = goodnessAggregate.reduce((result, item) => {
            var _a;
            const type = item.type + "good";
            const amount = (_a = item._sum.goodnessbalance) !== null && _a !== void 0 ? _a : 0.0;
            result[type] = (result[type] || 0) + amount;
            result.totalgood = (result.totalgood || 0) + amount;
            return result;
        }, { totalgood: 0 });
        const data = Object.assign(Object.assign({ reports: reportData }, commAggregatedData), goodAggregatedData);
        return res.status(200).send({ error: false, data, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.totalBetReport = totalBetReport;
// Solde d'un agent
const agentBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schema = zod_1.z.object({ startDate: zod_1.z.coerce.date(), endDate: zod_1.z.coerce.date(), agentId: zod_1.z.string() });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const data = validation.data;
        const balance = yield server_1.prisma.betReport.aggregate({ where: { agentId: data.agentId, createdat: { gte: data.startDate, lte: data.endDate, } }, _sum: { agentbalance: true }, });
        return res.status(200).send({ error: false, data: (_a = balance._sum.agentbalance) !== null && _a !== void 0 ? _a : 0, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.agentBalance = agentBalance;
// Solde clients
const allCustomersBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield server_1.prisma.account.findMany({ include: { user: true } });
        return res.status(200).send({ data: data });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.allCustomersBalance = allCustomersBalance;
// Solde agents
const allAgentsBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({
            startDate: zod_1.z.coerce.date(), endDate: zod_1.z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        }
        const data = yield server_1.prisma.betReport.groupBy({ by: ["agentId"], _sum: { agentbalance: true }, where: { createdat: { gte: validation.data.startDate, lte: validation.data.endDate, } } });
        return res.status(200).send({ error: false, data, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.allAgentsBalance = allAgentsBalance;
