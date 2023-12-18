import { Queue } from "bullmq";
import EventEmitter from "events";
import { Redis } from "ioredis";

const connection = new Redis(process.env.REDIS_URL!);

export const agentContributionJobQueue = new Queue("agentContribution", { connection: connection });
export const validateContributionJobQueue = new Queue("validateContribution", { connection: connection });
export const mMoneyContributionJobQueue = new Queue("mMoneyContribution", { connection: connection });

EventEmitter.setMaxListeners(11);
process.setMaxListeners(11);