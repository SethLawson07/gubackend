import { Job, Worker } from "bullmq";
import { Redis } from 'ioredis';
import { sendPushNotification, todateTime, } from "../utils";
import { prisma } from "../server";


const agentContributionWorkerHandler = async (job: Job) => {
    const jobdata = job.data;
    const { } = jobdata;
}

const validateContributionWorkerHandler = async (job: Job) => {
    const jobdata = job.data;
    const { customer, targeted_contribution, user, result, schemadata, validated, book } = jobdata;

    const user_acount = await prisma.account.findFirst({ where: { userId: customer.id } });
    if (!user_acount) return console.log("Compte non trouvé");
    let balance = (user_acount?.balance! + targeted_contribution.amount);
    if (user.role == "admin") {
        if (result.cases.includes(1)) {
            const agent_benefit = result.sheet.bet! * 0.2;
            const [uaUpdate, report_bet] = await prisma.$transaction([
                prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet!) } }),
                prisma.betReport.create({
                    data: {
                        goodnessbalance: result.sheet.bet! - agent_benefit, agentbalance: agent_benefit, createdat: schemadata.validatedat,
                        agentId: customer.agentId, customerId: customer.id, type: "bet"
                    }
                }),
            ]);
            if (!uaUpdate || !report_bet) return false;
        }
        else { await prisma.account.update({ where: { id: user_acount.id }, data: { balance } }); }
    }
    await prisma.book.update({ where: { id: book.data.id }, data: { sheets: result.updated_sheets! } });
    await prisma.report.update({ where: { id: validated.reportId }, data: { agentId: customer.agentId, status: validated.status, } });
    if (user.role == "admin" && customer?.device_token!) { await sendPushNotification(customer?.device_token!, "Cotisation", `Votre cotisation en attente vient d'être validé`); };
}


const mMoneyContributionWorkerHandler = async (job: Job) => {
    const jobdata = job.data;
    const { customer, amount, result, book, report } = jobdata;
    const user_acount = await prisma.account.findFirst({ where: { userId: customer } });
    if (!user_acount) return console.log("Compte non trouvé");
    let balance = (user_acount?.balance! + amount);
    const cases = (result.cases as number[]).map(chiffre => chiffre + 1);
    if (cases.includes(1)) {
        prisma.account.update({ where: { id: user_acount.id }, data: { balance: (balance - result.sheet.bet!) } });
    }
    else {
        await prisma.account.update({ where: { id: user_acount.id }, data: { balance } });
    }
    await prisma.book.update({ where: { id: book.data.id }, data: { sheets: result.updated_sheets! } });
    await prisma.report.update({ where: { id: report.id }, data: { status: "paid" } });
}


const connection = new Redis(process.env.REDIS_URL!);

new Worker("agentContribution", agentContributionWorkerHandler, { connection: connection, autorun: true });

new Worker("validateContribution", validateContributionWorkerHandler, { connection: connection, autorun: true });

new Worker("mMoneyContribution", mMoneyContributionWorkerHandler, { connection: connection, autorun: true });

