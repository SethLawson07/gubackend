import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import cors from "cors";
import swagger from "swagger-ui-express";
import swagger_doc from "./swagger.json";
import { PrismaClient } from "@prisma/client";

import auth from "./routes/auth";
import category from "./routes/category";
import slider from "./routes/slider";
import subcategory from "./routes/subcategory";
import item from "./routes/item";
import product from "./routes/product";
import payment from "./routes/payment";
import promocode from "./routes/promocode";
import order from "./routes/order";
import users from "./routes/users";
import hook from "./routes/hook";
import transaction from "./routes/transactions";
import brand from "./routes/brand";
import service from "./routes/service";
import account from "./routes/account";
import notification from "./routes/notification";
import section from "./routes/section";
import delivery from "./routes/delivery";
import home from "./routes/home";


const PORT = process.env.PORT || 5000;

const app = express();

export const prisma = new PrismaClient();

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

const verboseFormat = ':remote-addr :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';

app.use(morgan(verboseFormat));
app.use('/docs', swagger.serve, swagger.setup(swagger_doc));

// routes
app.use("/auth", auth);
app.use("/category", category);
app.use("/slider", slider);
app.use("/subcategory", subcategory);
app.use("/item", item);
app.use("/product", product);
app.use("/pay", payment);
app.use("/promocode", promocode);
app.use("/order", order);
app.use("/users", users);
app.use("/hook", hook);
app.use("/transaction", transaction);
app.use("/brand", brand);
app.use("/service", service);
app.use('/account', account);
app.use('/push', notification);
app.use('/section', section);
app.use('/delivery', delivery);
app.use('/home', home);


app.get("/health", (_req: Request, res: Response) => {
    return res.status(200).send()
});

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