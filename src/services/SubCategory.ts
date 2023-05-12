import { Request, Response} from "express"
import { prisma } from "../server"
import { z } from "zod"

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            name: z.string(),
            featured: z.boolean(),
            category: z.string(),
            image: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        const targetted_category = await prisma.category.findUnique({
            where:{
                id:data.category
            }
        })
        if(!targetted_category) return res.status(404).send()
        const potential_duplicate = await prisma.subCategory.findFirst({
            where:{
                name: data.name,
                category: data.category
            }
        })
        if(potential_duplicate) return res.status(409).send()
        await prisma.subCategory.create({
            data
        })
        return res.status(201).send()
    } catch (err) {
        console.error(`Error while creating subcategory ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response){
    try {
        const data = await prisma.subCategory.findMany({
            include:{
                category_data:{
                    select:{
                        name: true,
                        id: true
                    }
                }
            }
        })
        return res.status(200).send({ data })
    } catch (err){
        console.error(`Error while getting list of subcategories ${err}`)
        return res.status(500).send()
    }
}

export async function update(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string(),
            name: z.string().optional(),
            featured: z.boolean().optional(),
            image: z.string().optional()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { data } = validation_result
        const targetted_subcategory = await prisma.subCategory.findUnique({
            where:{
                id:data.id
            }
        })
        if(!targetted_subcategory) return res.status(404).send()
        if(data.name){
            const potential_duplicate = await prisma.subCategory.findFirst({
                where:{
                    AND: [
                        { category: targetted_subcategory.category },
                        { name: data.name}
                    ]
                }
            })
            if(potential_duplicate && potential_duplicate.id!==targetted_subcategory.id) return res.status(409).send()
        }
        await prisma.subCategory.update({
            where:{
                id: data.id
            },
            data:{
                name:data.name,
                featured:data.featured,
                image:data.image
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while updating subcategory ${err}`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string"})
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.errors.toString())})
        const { id } = validation_result.data
        const targetted_subcategory = await prisma.subCategory.findUnique({
            where:{id}
        })
        if(!targetted_subcategory) return res.status(404).send()
        const items_to_delete = await prisma.item.findMany({
            where:{
                sub_category:id
            }
        })
        //Delete products in items 
        items_to_delete.map(async (item)=>{
            await prisma.product.deleteMany({
                where:{
                    item: item.id
                }
            })
        })
        //Delete items in subcategory
        await prisma.item.deleteMany({
            where:{
                sub_category: id
            }
        })
        //Delete subcategory
        await prisma.subCategory.delete({
            where:{id}
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting subCategory ${err}`)
        return res.status(500).send()
        
    }
}
