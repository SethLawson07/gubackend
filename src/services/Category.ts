import { Request, Response } from "express"
import { prisma } from "../server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { Item } from "@prisma/client"


export async function create_category(req: Request, res: Response) {
    try {
        const category_schema = z.object({
            name: z.string(),
            featured: z.boolean(),
            image: z.string(),
        })
        const validation_result = category_schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        await prisma.category.create({
            data
        })
        return res.status(201).send()
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") return res.status(409).send({ message: "Une categorie avec le meme nom existe deja" })
        }
        console.error(err)
        return res.status(500).send()
    }
}

export async function get_categories(_req: Request, res: Response) {
    try {
        const categories = await prisma.category.findMany()
        return res.status(200).send({ data: categories })
    } catch (err) {
        console.error(err)
        return res.status(500).send()
    }
}

export async function update_category(req: Request, res: Response) {
    try {
        const category_schema = z.object({
            id: z.string(),
            name: z.string().optional(),
            featured: z.boolean().optional(),
            image: z.string().optional()
        })
        const validation_result = category_schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        const targetted_category = await prisma.category.findUnique({
            where: {
                id: data.id
            }
        })
        if (!targetted_category) return res.status(404).send()
        await prisma.category.update({
            where: {
                id: data.id
            },
            data: {
                name: data.name,
                featured: data.featured,
                image: data.image
            }
        })
        return res.status(200).send()
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") return res.status(409).send()
        }
        console.error(err)
        return res.status(500).send()
    }
}

//TODO: Delete categories
export async function delete_(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: "id manquant ou de type incorrect" })
        const { id } = validation_result.data
        const targetted_category = await prisma.category.findUnique({
            where: { id }
        })
        if (!targetted_category) return res.status(404).send()
        const subcategories_to_delete = await prisma.subCategory.findMany({
            where: {
                category: id
            }
        })
        let items_to_delete: Item[] = []
        subcategories_to_delete.map(async (subcategory) => {
            const items_in_sub_cat = await prisma.item.findMany({
                where: {
                    subcategory: subcategory.id
                }
            })
            items_in_sub_cat.map((item) => {
                items_to_delete.push(item)
            })

        })
        //Actual delete happen here
        //Delete products related to items to delete
        items_to_delete.map(async (item) => {
            await prisma.product.deleteMany({
                where: {
                    item: item.id
                }
            })
        })
        //Delete items related to subcategories to delete
        items_to_delete.map(async (item) => {
            await prisma.item.delete({
                where: {
                    id: item.id
                }
            })
        })
        //Delete subcategories 
        await prisma.subCategory.deleteMany({
            where: {
                category: id
            }
        })
        //Delete category
        await prisma.category.delete({
            where: {
                id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting categories`)
        return res.status(500).send()
    }
}
