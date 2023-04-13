import { z } from "zod";
import { Request, Response } from "express";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";

export async function create(req: Request, res: Response) {
    try {
        const schema = z.object({
            code: z.string(),
            valid: z.boolean(),
            discount: z.number().int().positive(),
            conditions: z.array(z.string()),
            featured: z.boolean(),
            expiration_date: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        if (isNaN(Date.parse(data.expiration_date))) return res.status(400).send({ message: "date invalide" })
        const current_conditions = ["0", "1"]
        const code_conditions = data.conditions.map((c)=>c.split(":")[0])
        for(const condition of code_conditions){
            if(!current_conditions.includes(condition)) return res.status(400).send({ message:"condition invalide"})
        }
        await prisma.promoCode.create({
            data
        })
        return res.status(201).send()
    } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code==="P2002") return res.status(409).send()
        }
        console.error(`Error while creating promocode ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response) {
    try {
        const data = await prisma.promoCode.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting list of promo codes ${err}`)
        return res.status(500).send()
    }
}

export async function verify(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number().positive(),
            products: z.array(z.object({
                id: z.string(),
                quantity: z.number().int().positive()
            })),
            code: z.string()
        })
        const { user } = req.body.user as { user: string }
        const current_user = await prisma.user.findUnique({
            where: {
                email: user
            }
        })
        if (!current_user) return res.status(401).send()
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send()
        const { data } = validation_result
        //check if user did not already use promo code
        //check if order is elligible for promo code or if promo code is still valid
        return res.status(200).send({ new_amount: 100 })
    } catch (err) {
        console.error(`Error while verifying promo code ${err}`)
        return res.status(500).send()
    }
}
