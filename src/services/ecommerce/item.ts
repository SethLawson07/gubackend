import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";
import slugify from 'slugify';



export async function addItem(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            image: z.string(),
            slugitem: z.string(),
            subCategoryId: z.string(),
            featured: z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });

        // const slugitem = slugify(validation.data.title, { lower: true });

        // const dataWithSlug = { ...validation.data, slugitem };

        const savedItem = await prisma.item.create({ data: validation.data  });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedItem });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
    }
}




export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.item.findMany({orderBy:{createdat:'desc'}});
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.item.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function updateItem(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            image: z.string(),
            subCategoryId: z.string(),
            featured:z.boolean()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedItem = await prisma.item.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedItem });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deleteItem(req: Request, res: Response) {
    try {
        let id = req.params.id
        const item = await prisma.item.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: item });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}