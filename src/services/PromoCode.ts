import { z } from "zod";
import { Request, Response } from "express";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";
import { apply_conditions } from "../utils/conditions";

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

export async function delete_(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send()
        const { id } = validation_result.data
        await prisma.promoCode.delete({
            where:{
                id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.log(`Error while deleting promo code ${err}`)
        return res.status(500).send()
    }
}


export async function verify(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number().positive(),
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
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { data } = validation_result
        const targetted_code = await prisma.promoCode.findUnique({
            where:{
                code: data.code
            }
        })
        if(!targetted_code) return res.status(404).send()
        const user_code_usage = await prisma.promoCodeUsage.findFirst({
            where:{
                user: current_user.id,
                code: targetted_code.code
            }
        })
        if(user_code_usage) return res.status(400).send()
        const valid = await apply_conditions(targetted_code.conditions, data.amount, current_user.email)
        if(!valid) return res.status(400).send({ message:"Utilisateur ne remplit pas les conditions pour utiliser ce code promo"})
        const new_amount = (data.amount * targetted_code.discount)/100
        return res.status(200).send({ new_amount })
    } catch (err) {
        console.error(`Error while verifying promo code ${err}`)
        return res.status(500).send()
    }
}
