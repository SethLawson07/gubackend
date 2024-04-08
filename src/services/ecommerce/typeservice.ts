import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addTypeService(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            image: z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedTypeService = await prisma.typeService.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedTypeService });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.typeService.findMany();
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}

export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.typeService.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function updateTypeService(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            image: z.string(),
            link: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedTypeService = await prisma.typeService.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedTypeService });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deleteTypeService(req: Request, res: Response) {
    try {
        let id = req.params.id
        const category = await prisma.typeService.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: category });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}