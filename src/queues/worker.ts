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

    const user_acount = await prisma.account.findFirst({ where: { user: customer?.id! } });
    let amount = (user_acount?.amount! + targeted_contribution.amount);
    if (user.role == "admin") {
        if (result.cases.includes(0)) {
            const agent_acount = await prisma.account.findFirst({ where: { user: customer?.agentId! } });
            const agent_benefit = (result.sheet.bet! * 20) / 100;
            const goodness_benefit = result.sheet.bet! - agent_benefit;
            await prisma.account.update({ where: { id: user_acount?.id! }, data: { amount: (amount - result.sheet.bet!) } });
            await prisma.account.update({ where: { id: agent_acount?.id! }, data: { amount: agent_acount?.amount! + agent_benefit } });
            await prisma.betForReport.create({
                data: {
                    gooAmount: goodness_benefit,
                    AgeAmount: agent_benefit,
                    createdat: todateTime(schemadata.validatedat),
                    agentId: customer?.agentId!,
                    customerId: customer?.id!,
                }
            })
        }
        else { await prisma.account.update({ where: { id: user_acount?.id! }, data: { amount: amount } }); }
    }
    await prisma.report.update({ where: { id: validated.reportId }, data: { status: validated.status, } });
    await prisma.book.update({ where: { id: book.data.id }, data: { sheets: result.updated_sheets! } });
    if (user.role == "admin" && customer?.device_token!) { await sendPushNotification(customer?.device_token!, "Cotisation", `Votre cotisation en attente vient d'être validé`); };
}


const mMoneyContributionWorkerHandler = async (job: Job) => {
    const jobdata = job.data;
    const { data, result, book } = jobdata;

    const targeted_acount = await prisma.account.findFirst({ where: { user: data.customer } });
    let amount = (targeted_acount?.amount! + data.amount);
    if (result.cases!.includes(0)) await prisma.account.update({ where: { id: targeted_acount?.id! }, data: { amount: (amount - result.sheet?.bet!) } });
    else { await prisma.account.update({ where: { id: targeted_acount?.id! }, data: { amount: amount } }); }
    await prisma.account.update({ where: { id: targeted_acount?.id! }, data: { amount: amount } });
    await prisma.book.update({ where: { id: book?.id! }, data: { sheets: result.updated_sheets! } });
}


const connection = new Redis(process.env.REDIS_URL!);

new Worker("agentContribution", agentContributionWorkerHandler, { connection: connection, autorun: true });

new Worker("validateContribution", validateContributionWorkerHandler, { connection: connection, autorun: true });

new Worker("mMoneyContribution", mMoneyContributionWorkerHandler, { connection: connection, autorun: true });

