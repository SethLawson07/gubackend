import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addSubCategory(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            image: z.string(),
            categoryId:z.string(),
            featured:z.boolean().optional()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedSubCategory = await prisma.subCategory.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSubCategory });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.subCategory.findMany();
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.subCategory.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function updateSubCategory(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            image: z.string(),
            link: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedSubCategory = await prisma.subCategory.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSubCategory });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deleteSubCategory(req: Request, res: Response) {
    try {
        let id = req.params.id
        const subcategory = await prisma.subCategory.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: subcategory });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}