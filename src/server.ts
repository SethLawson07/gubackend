import cors from "cors";
import morgan from "morgan";
import * as dotenv from "dotenv"; dotenv.config();
import Agenda, { Job, JobAttributesData } from 'agenda';
import swagger from "swagger-ui-express";
import swagger_doc from "./swagger.json";
import { PrismaClient } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import { verboseFormat } from "./utils";



// Routes
import banner from "./routes/banner";
import home from "./routes/home";
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

//RoutesE-COMMERCE
import brand from "./routes/ecommerce/brand";
import category from "./routes/ecommerce/category";
import collection from "./routes/ecommerce/collection";
import item from "./routes/ecommerce/item";
import orderproduct from "./routes/ecommerce/orderproduct";
import orderservice from "./routes/ecommerce/orderservice";
import product from "./routes/ecommerce/product";
import promocode from "./routes/ecommerce/promocode";
import section from "./routes/ecommerce/section";
import service from "./routes/ecommerce/service";
import subcategory from "./routes/ecommerce/subcategory";
import typeservice from "./routes/ecommerce/typeservice";
import itemservice from "./routes/ecommerce/itemservice";
import slider from "./routes/ecommerce/slider";
import variant from "./routes/ecommerce/variant";

// App PORT
const PORT = process.env.PORT || 5000;

// Server
const app = express();

//
export const prisma = new PrismaClient();

// Agenda
export const agenda = new Agenda();
agenda.database(process.env.DATABASE!);

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
app.use("/home", home);
app.use('/account', account);
app.use("/activity", activity);
app.use("/book", book);
app.use("/banner", banner);
app.use("/contribution", contribution);
app.use("/deposit", deposit);
app.use("/report", report);
app.use("/sheet", sheet);
app.use("/hook", hook);
app.use("/users", users);
app.use('/push', notification);

//routes E-COMMERCE
app.use('/brand', brand);
app.use('/category', category);
app.use('/collection', collection);
app.use('/item', item);
app.use('/orderproduct', orderproduct);
app.use('/orderservice', orderservice);
app.use('/product', product);
app.use('/section', section);
app.use('/service', service);
app.use('/subcategory', subcategory);
app.use('/typeservice', typeservice);
app.use('/itemservice', itemservice);
app.use('/slider', slider);
app.use('/variant', variant);
app.use('/promocode', promocode);



// Health
app.get("/health", (_req: Request, res: Response) => {
    return res.status(200).send();
});

// App listen
app.listen(PORT, async () => {
    try {
        await prisma.$connect();
        agenda.start();
        console.info("Connected to database");
        console.info(`App listening on ${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});