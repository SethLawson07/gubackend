import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addVariant(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.array(z.string()),
            itemId: z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedVariant = await prisma.variant.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function variantByItem(req: Request, res: Response) {
    try {
        let id = req.params.id
        const variants = await prisma.variant.findFirst({where:{itemId:id}});
        return res.status(200).send({ error: false, message: "ok", data: variants });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function addProductVariant(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.array(z.string()),
            value: z.array(z.string()),
            productId: z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedVariant = await prisma.productVariant.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function updateVariant(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.array(z.string()),
             });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedVariant = await prisma.variant.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deleteVariant(req: Request, res: Response) {
    try {
        let id = req.params.id
        const variant = await prisma.variant.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: variant });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}