import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { store } from "../utils/store";


export async function momo_payment_event(req: Request, res: Response){
    try {
        const schema = z.object({
            user_id: z.string(),
            order_id: z.string(),
            amount_paid: z.number().int().positive()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send()
        const { data } = validation_result
        const targetted_user = await prisma.user.findFirst({
            where:{
                finance_pro_id: data.user_id
            }
        })
        if(!targetted_user) return res.status(404).send({ message :"Utilisateur non trouvé"})
        const targetted_order = await prisma.order.findUnique({
            where:{
                id: data.order_id
            }
        })
        if(!targetted_order) return res.status(404).send({ message:"Commande non trouvée"})
        const new_remainder = targetted_order.remainder - data.amount_paid
        await prisma.order.update({
            where:{
                id: targetted_order.id
            },
            data:{
                amount: new_remainder
            }
        })
        return res.status(200).send({ remainder: new_remainder })
    } catch (err) {
        console.error(`Error while processing momo payment event ${err}`)
        return res.status(500).send()
    }
}

export async function payment_event(req: Request, res: Response){
    try {
        const schema = z.object({
            cpm_trans_date: z.string(),
            cpm_amount: z.string(),
            cpm_trans_id: z.string(),
            payment_method: z.string(),
            cel_phone_num: z.string(),
            cpm_error_message: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success){
            console.log(`Error while parsing response from cinet pay ${req.body}`)
            return res.status(500).send()
        }
        const { data } = validation_result
        if(store.includes(data.cpm_trans_id)){
            console.log(`Found duplicate id in store ${data.cpm_trans_id} : Aborting processing`)
            return res.status(409).send()
        }
        console.log(data)
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}
