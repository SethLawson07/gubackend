import { Request, Response } from "express";
import { prisma } from "../server";

export async function get_all(_req: Request, res: Response){
    try {
        const data = await prisma.transaction.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.log(`Error while getting list of all transactions ${err}`)
        return res.status(500).send
    }
}

export async function get(req: Request, res: Response){
    try {
        const { user } = req.body.user as { user: string}
        const current_user = await prisma.user.findUnique({ where:{
            email: user
        }})
        if(!current_user) return res.status(401).send()
        const data = await prisma.transaction.findMany({
            where:{
                user: current_user.id
            }
        })
        return res.status(200).send({ data })
    } catch (err) {
        console.log(err)
        return res.status(500).send()
    }
}
