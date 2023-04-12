//import { Request, Response } from "express"
//import { prisma } from "../server"
import { Product } from "@prisma/client"

type Condition = {
    id: number,
    description: string
    condition: ( order:OrderData )=>boolean
}

type OrderData = {
    id: string,
    amount: number,
    user: string,
    products: Array<Product>
}

