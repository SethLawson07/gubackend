import { Request, Response } from "express"
import { prisma } from "../../server"

export async function clientHome1(_req: Request, res: Response) {
    try {
        const categories = await prisma.category.findMany();
        const subcategories = await prisma.subCategory.findMany({
            include: { category_data: { select: { name: true, id: true } } }
        });
        const items = await prisma.item.findMany();
        const brands = await prisma.brand.findMany();
        return res.status(200).send({ data: { categories, subcategories, items, brands } });
    } catch (err) {
        console.error(`Error while getting list of all items ${err}`)
        return res.status(500).send()
    }
}

export async function clientHome2(_req: Request, res: Response) {
    try {
        const products = await prisma.product.findMany();
        const services = await prisma.service.findMany();
        const cservices = await prisma.serviceCategory.findMany();
        const sections = await prisma.section.findMany({ include: { content: true } });
        return res.status(200).send({ data: { products, sections, services, cservices } });
    } catch (err) {
        console.error(`Error while getting list of all items ${err}`)
        return res.status(500).send()
    }
}