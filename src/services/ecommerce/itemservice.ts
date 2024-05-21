import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addItemService(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            image: z.array(z.string()),
            price:z.string(),
            description:z.string(),
            typeServiceId:z.string(),
            slugitemservice:z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedItemService = await prisma.itemService.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedItemService });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.itemService.findMany({orderBy:{createdat:'desc'}});
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}

export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.itemService.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function updateItemService(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.string().optional(),
            image: z.array(z.string()).optional(),
            price:z.string().optional(),
            description:z.string().optional(),
            typeServiceId:z.string().optional(),
            featured:z.boolean().optional(),
            sectionArea:z.number().optional()


        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedItemService = await prisma.itemService.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedItemService });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function deleteItemService(req: Request, res: Response) {
    try {
        let id = req.params.id
        const category = await prisma.itemService.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: category });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}