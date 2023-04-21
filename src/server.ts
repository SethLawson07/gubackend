import express, { Request, Response } from "express"
import * as dotenv from "dotenv"
dotenv.config()
import morgan from "morgan"
import cors from "cors"
import swagger from "swagger-ui-express"
import swagger_doc from "./swagger.json"
import { PrismaClient } from "@prisma/client"

import auth from "./routes/auth"
import category from "./routes/category"
import slider from "./routes/slider"
import subcategory from "./routes/subcategory"
import item from "./routes/item"
import product from "./routes/product"
import payment from "./routes/payment"
import promocode from "./routes/promocode"
import order from "./routes/order"

const PORT = process.env.PORT || 5000

const app = express()

export const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use(morgan("dev"))
app.use('/docs', swagger.serve, swagger.setup(swagger_doc))

app.use("/auth", auth)
app.use("/category", category)
app.use("/slider", slider)
app.use("/subcategory", subcategory)
app.use("/item", item)
app.use("/product", product)
app.use("/pay", payment)
app.use("/promocode", promocode)
app.use("/order", order)

app.get("/health", (_req: Request, res: Response) => {
    return res.status(200).send()
})

app.listen(PORT, async () => {
    try {
        await prisma.$connect()
        console.info("Connected to database")
        console.info(`App listening on ${PORT}`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
})
