import { Request, Response} from "express"
import { prisma } from "../server"
import { Prisma } from "@prisma/client"
import { z } from "zod"


export async function create_category(req: Request, res: Response){
    try {
        const category_schema = z.object({
            name: z.string({ required_error:"name est un parametre requis", invalid_type_error:"name doit etre un string" }),
            featured: z.boolean({ required_error:"featured est un parametre requis", invalid_type_error:"featured doit etre un boolen" })
        })
        const validation_result = category_schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        await prisma.category.create({
            data
        })
        return res.status(201).send({ message:"Categorie cree" })
    } catch (err) {
        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code==="P2002") return res.status(409).send({ message:"Une categorie avec le meme nom existe deja" })
        }
        console.error(err)
        return res.status(500).send()
    }
}

export async function get_categories(req: Request, res: Response){
    try {
        
    } catch (err) {
        console.error(err)
        return res.status(500).send()
    }
}
