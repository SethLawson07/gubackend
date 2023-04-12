import { z } from "zod";
import { Request, Response } from "express";
import { prisma } from "../server";

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            code: z.string(),
            valid: z.boolean(),
            discount: z.number().int().positive(),
            conditions: z.array(z.number().int().positive()),
            featured: z.boolean(),
            expiration_date: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { data } = validation_result
        if(isNaN(Date.parse(data.expiration_date))) return res.status(400).send({ message:"date invalide"})
        
    } catch (err) {
        console.error(`Error while creating promocode ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response){
    try {
        const data = await prisma.promoCode.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting list of promo codes ${err}`)
        return res.status(500).send()
    }
}
