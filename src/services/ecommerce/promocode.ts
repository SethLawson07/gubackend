import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addPromoCode(req: Request, res: Response) {
    try {
        const schema = z.object({
            name: z.string(),
            discountpercentage: z.string(),
            expirationdate:z.coerce.date(),
            featured:z.boolean()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedPromoCode = await prisma.promoCode.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedPromoCode });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.promoCode.findMany();
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}

export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.promoCode.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


export async function updatePromoCode(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            name: z.string(),
            discountpercentage: z.string(),
            expirationdate:z.coerce.date(),
            featured:z.boolean()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedPromoCode = await prisma.promoCode.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedPromoCode });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}



export async function deletePromoCode(req: Request, res: Response) {
    try {
        let id = req.params.id
        const category = await prisma.promoCode.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: category });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}