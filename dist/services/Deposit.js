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
exports.makeDeposit = void 0;
const server_1 = require("../server");
const zod_1 = require("zod");
// Faire un dépôt
const makeDeposit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = zod_1.z.object({
            customer: zod_1.z.string().nonempty(),
            amount: zod_1.z.number().nonnegative(),
            createdAt: zod_1.z.coerce.date(),
            p_method: zod_1.z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).send({ error: true, status: 400, message: "Veuillez vérifier les champs", data: {} });
        const { user } = req.body.user;
        const data = validation.data;
        let targetted_user;
        let targetted_account;
        if (user.role == "agent") {
            const findUser = yield server_1.prisma.user.findUnique({ where: { id: validation.data.customer } });
            if (!findUser)
                return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouvé", data: {} });
            targetted_user = findUser;
            const findAccount = yield server_1.prisma.account.findFirst({ where: { userId: findUser.id } });
            if (!findAccount)
                return res.status(404).send({ error: true, status: 404, message: "Compte non trouvé", data: {} });
            targetted_account = findAccount;
        }
        else {
            targetted_account = (yield server_1.prisma.account.findFirst({ where: { userId: user.id } }));
            targetted_user = user;
        }
        const report = yield server_1.prisma.report.create({ data: { type: "deposit", amount: data.amount, createdat: data.createdAt, payment: data.p_method, status: "unpaid", agentId: targetted_user.agentId, customerId: targetted_user.id, } });
        if (!report)
            return res.status(400).send({ error: true, message: "Oupps il s'est passé quelque chose!", data: {} });
        const [deposit, aUpdate] = yield server_1.prisma.$transaction([
            server_1.prisma.deposit.create({ data: { account: targetted_account.id, amount: validation.data.amount, createdAt: validation.data.createdAt, customer: targetted_user.id, madeby: "agent", payment: validation.data.p_method, reportId: report.id } }),
            server_1.prisma.account.update({ where: { id: targetted_account.id }, data: { balance: targetted_account.balance + data.amount } }),
        ]);
        if (!aUpdate && !deposit)
            return res.status(400).send({ status: 400, message: "Erreur, Dépôt non éffectué", data: {} });
        yield server_1.prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
        return res.status(200).send({ status: 200, error: false, message: "Dépôt éffectué avec succès", data: deposit });
    }
    catch (err) {
        console.log(err);
        console.log("Error while ... action");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} });
    }
});
exports.makeDeposit = makeDeposit;
