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
exports.userLastActivities = exports.userActivity = exports.agentBalanceHistory = void 0;
const server_1 = require("../server");
const zod_validation_error_1 = require("zod-validation-error");
const zod_1 = require("zod");
// Historique de gains d'un agent
const agentBalanceHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agentId = req.params.agentid;
        if (!agentId)
            return res.status(400).send({ error: true, message: "Agent id is required", data: {} });
        const data = yield server_1.prisma.betReport.aggregateRaw({
            pipeline: [
                { $match: { 'agentId': { "$oid": `${agentId}` } } }, { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $group: { _id: { month: { $month: '$createdat' }, year: { $year: '$createdat' }, }, data: { $push: '$$ROOT' }, count: { $sum: 1 }, }, },
            ],
        });
        return res.status(200).send({ data: data });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.agentBalanceHistory = agentBalanceHistory;
const userActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({ startDate: zod_1.z.coerce.date(), endDate: zod_1.z.coerce.date(), userId: zod_1.z.string(), });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
        const vdata = validation.data;
        const user = yield server_1.prisma.user.findUnique({ where: { id: vdata.userId } });
        if (!user)
            return res.status(404).send({ error: true, message: "User not found", data: {} });
        const data = (yield server_1.prisma.report.findMany({
            where: user.role == "customer" ? { status: { in: ["unpaid", "paid"] }, customerId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }
                : { status: { in: ["unpaid", "paid"] }, agentId: user.id, createdat: { gte: vdata.startDate, lte: vdata.endDate, } }, include: { agent: true, customer: true }
        })).reverse();
        return res.status(200).send({ error: false, data, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.userActivity = userActivity;
const userLastActivities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body.user;
        const data = (yield server_1.prisma.report.findMany({
            where: user.role == "customer" ? { customerId: user.id, status: { in: ["paid", "unpaid"] } } : { agentId: user.id, status: { in: ["paid", "unpaid"] } }, include: { agent: true, customer: true },
            take: 3,
        })).reverse();
        return res.status(200).send({ error: false, data, message: "ok" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: true, message: "Une erreur est survenue", data: {} });
    }
});
exports.userLastActivities = userLastActivities;
