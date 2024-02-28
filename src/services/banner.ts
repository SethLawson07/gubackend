import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../server";

// Add Banner
export async function addBanner(req: Request, res: Response) {
    try {
        const schema = z.object({
            image: z.string(),
            link: z.string(),
            createdat: z.coerce.date()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedBanner = await prisma.banner.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedBanner });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


// List Banners
export async function listBanner(req: Request, res: Response) {
    try {
        const list = await prisma.banner.findMany();
        return res.status(200).send({ error: false, message: "ok", data: list });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}

// Update Banner
export async function updateBanner(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            image: z.string(),
            link: z.string(),
            createdat: z.coerce.date()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedBanner = await prisma.banner.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedBanner });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}


// Delete Banner
export async function deleteBanner(req: Request, res: Response) {
    try {
        let id = req.params.id
        const banner = await prisma.banner.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: banner });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
    }
}