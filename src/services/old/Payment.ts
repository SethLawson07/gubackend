import { Request, Response } from "express";
import { prisma } from "../../server";
import { z } from "zod";
import { generate_payment_link } from "../../utils";
import { User } from "@prisma/client";

export async function pay(req: Request, res: Response) {
    try {
        const schema = z.object({
            order: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send()
        const { data } = validation_result
        const { user } = req.body.user as { user: User }
        const current_user = await prisma.user.findUnique({
            where: {
                email: user.email as string
            }
        })
        if (!current_user) return res.status(401).send({ message: "Utilisateur non trouve, veuillez vous reconnecter" })
        const targetted_order = await prisma.order.findUnique({
            where: {
                id: data.order
            }
        })
        if (!targetted_order) return res.status(404).send({ message: "commande non trouve" })
        if (targetted_order.userId !== current_user.id) return res.status(403).send()
        const payment_link_generation_result = await generate_payment_link(targetted_order.remainder, current_user.id, targetted_order.id)
        if (!payment_link_generation_result.status) return res.status(500).send()
        return res.status(200).send({ url: payment_link_generation_result.url })
    } catch (err) {
        console.error(`Error while generating payment url ${err}`)
        return res.status(500).send()
    }
}
