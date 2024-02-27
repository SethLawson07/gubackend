import cors from "cors";
import morgan from "morgan";
import * as dotenv from "dotenv"; dotenv.config();
const Agenda = require('agenda');
import swagger from "swagger-ui-express";
import swagger_doc from "./swagger.json";
import { PrismaClient } from "@prisma/client";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import express, { NextFunction, Request, Response } from "express";
import { validateContributionJobQueue } from "./queues/queues";
import { verboseFormat } from "./utils";


// Routes
import book from "./routes/books";
import auth from "./routes/auth";
import activity from "./routes/activity";
import contribution from "./routes/contribution";
import deposit from "./routes/deposit";
import sheet from "./routes/sheet";
import users from "./routes/users";
import hook from "./routes/hook";
import report from "./routes/report";
import account from "./routes/account";
import notification from "./routes/notification";

// App PORT
const PORT = process.env.PORT || 5000;

// Server
const app = express();

// BullBoard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// BullMQ Admin
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
        new BullMQAdapter(validateContributionJobQueue),
    ],
    serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

//
export const prisma = new PrismaClient();

// Agenda
export const agenda = new Agenda();
agenda.database(process.env.DATABASE);

// Middlewares
app.use(cors());
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
    const content_type = req.get("content-type") ?? "";
    if (content_type.startsWith("application/json")) {
        express.json()(req, res, next);
    } else if (content_type.startsWith("application/x-www-form-urlencoded")) {
        express.urlencoded({ extended: true })(req, res, next);
    } else {
        next();
    }
})
app.use(morgan(verboseFormat));
app.use('/docs', swagger.serve, swagger.setup(swagger_doc));

// routes
app.use("/auth", auth);
app.use('/account', account);
app.use("/activity", activity);
app.use("/book", book);
app.use("/contribution", contribution);
app.use("/deposit", deposit);
app.use("/report", report);
app.use("/sheet", sheet);
app.use("/hook", hook);
app.use("/users", users);
app.use('/push', notification);

// Health
app.get("/health", (_req: Request, res: Response) => {
    return res.status(200).send();
});

// App listen
app.listen(PORT, async () => {
    try {
        await prisma.$connect();
        console.info("Connected to database");
        console.info(`App listening on ${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});