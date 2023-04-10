import express, { Request, Response } from "express"
import * as dotenv from "dotenv"
dotenv.config()
import morgan from "morgan"
import cors from "cors"
import swagger from "swagger-ui-express"
import swagger_doc from "./swagger.json"

import auth from "./routes/auth"

const PORT = process.env.PORT || 5000

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan("tiny"))
app.use('/docs', swagger.serve, swagger.setup(swagger_doc))

app.use("/auth", auth)

app.get("/health", (_req: Request, res: Response)=>{
    return res.status(200).send()
})

app.listen(PORT, ()=>{
    console.log(`App listening on ${PORT}`)
})
