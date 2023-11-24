import { Request, Response } from "express"
import { prisma } from "../server"
import { products_byids } from "../utils";

export async function clientHome1(_req: Request, res: Response) {
    try {
        const categories = await prisma.category.findMany({});
        const subcategories = await prisma.subCategory.findMany({});
        const items = await prisma.item.findMany({});
        const brands = await prisma.brand.findMany({});
        return res.status(200).send({ data: { categories, subcategories, items, brands } });
    } catch (err) {
        console.error(`Error while getting list of all items ${err}`)
        return res.status(500).send()
    }
}

export async function clientHome2(_req: Request, res: Response) {
    try {
        const products = await prisma.product.findMany({});
        const services = await prisma.service.findMany({});
        const cservices = await prisma.serviceCategory.findMany({});
        // let sections: Object[] = [];
        const sections = await prisma.section.findMany({ include: { content: true } });
        // if (!target_all) return res.status(401).send({ error: true, message: "Une erreur est survenue", data: {} });
        // for (let i = 0; i < target_all.length; i++) {
        //     const element = target_all[i];
        //     const products = (await products_byids(element.content)).data;
        //     sections.push({ ...element, products });
        // }
        return res.status(200).send({ data: { products, sections, services, cservices } });
    } catch (err) {
        console.error(`Error while getting list of all items ${err}`)
        return res.status(500).send()
    }
}