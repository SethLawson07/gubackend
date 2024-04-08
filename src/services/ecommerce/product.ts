import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addProduct(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            price:z.string(),
            qte: z.number(),
            discount: z.boolean(),
            discountprice: z.string(),
            goodpay: z.boolean(),
            goodpayprice: z.string(),
            brand: z.string().optional(),
            description: z.string(),
            keywords: z.string(),
            image: z.array(z.string()),
            itemId: z.string(),
            slug:z.string(),
            featured:z.boolean().optional()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedProduct = await prisma.product.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.product.findMany();
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}

export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.product.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function updateProduct(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.string(),
            qte: z.number(),
            discount: z.boolean(),
            discountprice: z.string(),
            goodpay: z.boolean(),
            goodpayprice: z.string(),
            brand: z.string(),
            description: z.string(),
            keywords: z.string(),
            image: z.string(),
            itemId: z.string(),
           
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedProduct = await prisma.product.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deleteProduct(req: Request, res: Response) {
    try {
        let id = req.params.id
        const product = await prisma.product.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: product });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}