import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { create_promocode_usage, generate_payment_link } from "../utils"

export async function create(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number().int().positive(),
            cart: z.array(z.object({
                id: z.string(),
                quantity: z.number().int().positive()
            })).nonempty(),
            promocodes: z.array(z.string()),
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        const { user } = req.body.user as { user: string }
        const current_user = await prisma.user.findUnique({
            where: {
                email: user
            }
        })
        if (!current_user) return res.status(401).send()
        if (current_user.is_verified) {
            await prisma.order.create({
                data: {
                    user: current_user.id,
                    ...data,
                    remainder: data.amount,
                    paid: false,
                    status: "PENDING"
                }
            })
            await create_promocode_usage(data.promocodes, user)
            return res.status(200).send()
        }
        const order = await prisma.order.create({
            data: {
                user: current_user.id,
                remainder: data.amount,
                promocodes: data.promocodes,
                paid: false,
                status: "PENDING",
                cart: data.cart,
                amount: data.amount
            }
        })
        const response = await generate_payment_link(data.amount, current_user.id, order.id)
        console.log(response)
        return res.status(200).send({ data: response, message: "Order created" })
    } catch (err) {
        console.log(`Error while creating order ${err}`)
        return res.status(500).send()
    }
}

export async function get_all(_req: Request, res: Response) {
    try {
        const data = await prisma.order.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting all orders ${err}`)
        return res.status(500).send()
    }
}

export async function get_user_orders(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: string }
        const targetted_user = await prisma.user.findUnique({
            where: {
                email: user
            }
        })
        if (!targetted_user) return res.status(401).send()
        const data = await prisma.order.findMany({
            where: {
                user: targetted_user.id
            }
        })
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting user orders ${err}`)
        return res.status(500).send()
    }
}

export async function cancel_order(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send()
        const { id } = validation_result.data
        const { user } = req.body.user as { user: string }
        const current_user = await prisma.user.findUnique({
            where: {
                email: user
            }
        })
        if (!current_user) return res.status(401).send()
        const targetted_order = await prisma.order.findUnique({
            where: {
                id
            }
        })
        if (!targetted_order) return res.status(404).send()
        if (targetted_order.user !== current_user.id) return res.status(403).send()
        await prisma.order.update({
            where: {
                id
            },
            data: {
                status: "CANCELLED"
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send()
    }
}
