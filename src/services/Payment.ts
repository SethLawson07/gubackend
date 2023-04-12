import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";

export async function pay(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number().int().positive().min(150),
            order: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message:"amount est un parametre requis, qui doit etre un entier superieur ou egal a 150"})
        const { data } = validation_result
        const { user } = req.body.user as { user: string }
        const targetted_order = await prisma.order.findUnique({
            where:{
                id:data.order
            }
        })
        if(!targetted_order) return res.status(404).send({ message:"order non trouve"})
        if(data.amount>targetted_order.amount) return res.status(400).send({ message:"montant a payer invalide"})

        const current_user_id = await prisma.user.findUnique({
            where:{
                email: user
            }
        })
        if(!current_user_id) return res.status(401).send({ message:"Utilisateur non trouve, veuillez vous reconnecter"})
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while generating payment url ${err}`)
        return res.status(500).send()
    }
}
