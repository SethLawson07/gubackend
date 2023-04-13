import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { generate_payment_link } from "../utils";

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
        const current_user = await prisma.user.findUnique({
            where:{
                email: user
            }
        })
        if(!current_user) return res.status(401).send({ message:"Utilisateur non trouve, veuillez vous reconnecter"})
        const targetted_order = await prisma.order.findUnique({
            where:{
                id:data.order
            }
        })
        if(!targetted_order) return res.status(404).send({ message:"order non trouve"})
        if(targetted_order.user!==current_user.id) return res.status(403).send()
        if(data.amount>targetted_order.amount) return res.status(400).send({ message:"montant a payer invalide"})
        const payment_link_generation_result = await generate_payment_link(data.amount, current_user.id)
        if(!payment_link_generation_result.status) return res.status(500).send({ message:"Erreur lors de la generation du lien de payement, reessayer ou contacter les devs"})
        return res.status(200).send({ url: payment_link_generation_result.data })
    } catch (err) {
        console.error(`Error while generating payment url ${err}`)
        return res.status(500).send()
    }
}
