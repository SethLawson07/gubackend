import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            amount : z.number().int().positive(),
            cart: z.array(z.object({
                id: z.string(),
                quantity: z.number().int().positive()
            })),
            promocodes: z.array(z.string())
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { data } = validation_result
        const { user } = req.body.user as { user: string }
        await prisma.order.create({
            data:{
                user,
                ...data,
                remainder: data.amount,
                paid: false
            }
        })
    } catch (err) {
        console.log(`Error while creating order ${err}`)
        return res.status(500).send()
    }
}

export async function get_all(req: Request, res: Response){
    try {
        const data = await prisma.order.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting all orders ${err}`)
        return res.status(500).send()
    }
}

export async function get_user_orders(req: Request, res: Response){
    try {
        const { user } = req.body.user as { user: string }
        const targetted_user = await prisma.user.findUnique({
            where:{
                email: user
            }
        })
        if(!targetted_user) return res.status(401).send()
        const data = await prisma.order.findMany({
            where:{
                user: targetted_user.id
            }
        })
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting user orders ${err}`)
        return res.status(500).send()
    }
}
