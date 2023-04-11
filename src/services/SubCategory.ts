import { Request, Response} from "express"
import { prisma } from "../server"
import { z } from "zod"

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            name: z.string({ required_error:"name est un parametre requis", invalid_type_error:"name doit etre un string" }),
            featured: z.boolean({ required_error:"featured est un parametre requis", invalid_type_error:"featured doit etre un boolen" }),
            category: z.string({ required_error:"category est un parametre requis", invalid_type_error:"category doit etre un string"})
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
        const data = await prisma.subCategory.findMany()
        return res.status(200).send({ data })
    } catch (err){
        console.error(`Error while getting list of subcategories ${err}`)
        return res.status(500).send()
    }
}
