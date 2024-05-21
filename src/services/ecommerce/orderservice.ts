import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addOrderService(req: Request, res: Response) {
    try {

        const schema = z.object({
            userId: z.string(),
            serviceId: z.string(),
            paymentstatus: z.boolean(),
            delivery: z.boolean(),
            description: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedOrderService = await prisma.orderService.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedOrderService });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.orderService.findMany({orderBy:{createdat:'desc'}});
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}
