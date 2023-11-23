import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../server"
import { all_category_brands, all_category_products } from "../utils";
import { fromZodError } from "zod-validation-error";

export async function create(req: Request, res: Response) {
    try {
        const schema = z.object({
            name: z.string({ required_error: "name est un parametre requis", invalid_type_error: "name doit etre un string" }),
            item: z.string({ required_error: "item est un parametre requis", invalid_type_error: "item doit etre un string" }),
            featured: z.boolean({ required_error: "featured est un parametre requis", invalid_type_error: "featured doit etre un booleen" }),
            in_stock: z.number({ required_error: "in_stock est un parametre requis", invalid_type_error: "in_stock doit etre un entier valide" }).int({ message: "in_stock doit etre un entier" }).positive({ message: "in_stock doit etre positif" }),
            price: z.number({ required_error: "price est un parametre requis", invalid_type_error: "price doit etre un nombre valide" }).positive({ message: "price doit etre positif" }),
            pay_at_delivery: z.boolean({ required_error: "pay_at_delivery est un parametre requis", invalid_type_error: "pay_at_delivery doit etre un boolen" }),
            is_in_discount: z.boolean({ required_error: "is_in_discount est un parametre requis", invalid_type_error: "is_in_discount doit etre un boolen" }),
            discount_price: z.number({ invalid_type_error: "discount_price doit etre un nombre valide" }).optional(),
            fields: z.string({ invalid_type_error: "fields doit etre un string" }),
            images: z.array(z.string()),
            brand: z.string(),
            description: z.string(),
            pay_goodpay: z.boolean().default(false)
        })
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) });
        let { data } = validation_result
        if (data.is_in_discount && !data.discount_price) return res.status(400).send({ message: "discount_price est requis si le produit est en reduction" })
        data.discount_price = data.discount_price ? data.discount_price : 0
        const fields_is_valid = (() => {
            try {
                JSON.parse(data.fields)
                return true
            } catch (_) {
                return false
            }
        })()
        if (!fields_is_valid) return res.status(400).send({ message: "fields invalide. fields doit contenir un string provenant d'un json valide" })
        const targetted_item = await prisma.item.findUnique({
            where: {
                id: data.item
            }
        })
        if (!targetted_item) return res.status(404).send({ error: true, message: "" })
        await prisma.product.create({
            data
        })
        return res.status(201).send()
    } catch (err) {
        console.error(`Error while creating product ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response) {
    try {
        const data = await prisma.product.findMany({
            include: {
                item_data: {
                    select: {
                        id: true,
                        name: true,
                        schema: true
                    }
                },
                brand_data: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting list of products ${err}`)
        return res.status(500).send()
    }
}

export async function update(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string({ required_error: "id est un parametre requis" }),
            name: z.string().optional(),
            featured: z.boolean().optional(),
            in_stock: z.number().int().positive().optional(),
            price: z.number().positive().optional(),
            pay_at_delivery: z.boolean().optional(),
            is_in_discount: z.boolean().optional(),
            discount_price: z.number().optional(),
            fields: z.string().optional(),
            images: z.array(z.string()).optional(),
            description: z.string(),
            pay_goodpay: z.boolean().default(false)
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        const fields_is_valid = (() => {
            try {
                JSON.parse(data.fields as string)
                return true
            } catch (_) {
                return false
            }
        })();
        if (!fields_is_valid) return res.status(400).send({ message: "fields invalide. fields doit provenir d'un json valide" })
        await prisma.product.update({
            where: {
                id: data.id
            },
            data: {
                name: data.name,
                featured: data.featured,
                in_stock: data.in_stock,
                price: data.price,
                pay_at_delivery: data.pay_at_delivery,
                is_in_discount: data.is_in_discount,
                discount_price: data.discount_price,
                fields: data.fields,
                images: data.images,
                description: data.description,
                pay_goodpay: data.pay_goodpay
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while updating product ${err}`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string({ required_error: "id est un parametre requis", invalid_type_error: "id doit etre un string" })
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: "id manquant ou de type incorrect" })
        const { id } = validation_result.data
        await prisma.product.delete({
            where: {
                id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting product ${err}`)
        return res.status(500).send()
    }
}

export async function products_from_category(req: Request, res: Response) {
    const schema = z.object({
        catid: z.string()
    });
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error) });
    let products = await all_category_products(validation_result.data.catid);
    return res.status(200).send({ error: false, message: "Requête aboutie", length: products.length, data: products });
}

export async function brands_from_category(req: Request, res: Response) {
    console.log("first")
    const schema = z.object({
        catid: z.string()
    });
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ error: true, message: fromZodError(validation_result.error) });
    let brands = await all_category_brands(validation_result.data.catid);
    return res.status(200).send({ error: false, message: "Requête aboutie", length: brands.length, data: brands });
}