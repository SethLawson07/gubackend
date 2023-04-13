//import { Request, Response } from "express"
//import { prisma } from "../server"
import { Product } from "@prisma/client"
import { prisma } from "../server"
import { deflate } from "zlib"

type Condition = {
    id: string,
    description: string
    condition: ( order:OrderData, param:string|undefined )=>Promise<boolean>
}

type OrderData = {
    id: string,
    amount: number,
    user: string,
    products: Array<Product>
}

const conditions: Condition[] = [
    {
        id:"0",
        description:"Applicable seulement pour les nouveaux utilisateurs",
        condition:async (order: OrderData, _param: string|undefined)=>{
            const current_user = await prisma.user.findUnique({
                where:{
                    email: order.user
                }
            })
            if(!current_user) return false
            const user_orders = await prisma.order.findMany({
                where:{
                    user: current_user.id
                }
            })
            if(user_orders.length!==0) return false
            return true
        }
    },
    {
        id:"1",
        description:"Applicable seulement pour les commandes au dela d'un montant donne",
        condition: async (order: OrderData, param: string|undefined)=>{
            if(!param) return false
            const min_amount = Number(param as string)
            if(isNaN(min_amount)) return false
            return min_amount>order.amount
        }
    }
]

export async function apply_conditions(given_conditions:string[], order: OrderData){
    for (const condition in given_conditions) {
        const targetted_condition = conditions.find((c)=>c.id==condition.split(":")[0])
        if(!targetted_condition) continue
        const condition_is_valid = await targetted_condition.condition(order, condition.split(":")[1])
        if(!condition_is_valid) return false
    }
    return true
}
