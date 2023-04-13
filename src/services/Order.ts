import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            amount : z.number().int().positive()
        })
    } catch (err) {
        console.log(`Error while creating order ${err}`)
        return res.status(500).send()
    }
}
