import { Request, Response} from "express"
import { z } from "zod"
import { prisma } from "../server"

export async function create(req: Request, res: Response){
    try {
       const schema = z.object({
            big_text: z.string({ required_error:"big_text est un parametre requis", invalid_type_error:"bif_text doit etre un string"}),
            alt_text: z.string({ required_error:"alt_text est un parametre requis", invalid_type_error:"alt_text doit etre un string" }),
            image: z.string({ required_error:"image est un parametre requis", invalid_type_error:"image doit etre un string"}),
            featured: z.boolean({ required_error:"featured est un parametre requis", invalid_type_error:"featured doit etre un string"})
       }) 
       const validation_result = schema.safeParse(req.body)
       if(!validation_result.success) return res.status(400).send({message:JSON.parse(validation_result.error.message)})
       const {data} = validation_result
       await prisma.slider.create({
           data
       })
       return res.status(201).send()
    } catch (error) {
       console.error(`Error while creating slider ${error}`) 
       return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response){
    try {
        const data = await prisma.slider.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting sliders ${err}`)
        return res.status(500).send()
    }
}

export async function update(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string" }),
            featured: z.boolean({ invalid_type_error:"featured doit etre un boolen"}).optional(),
            big_text: z.string({ invalid_type_error:"bif_text doit etre un string"}).optional(),
            alt_text: z.string({ invalid_type_error:"alt_text doit etre un string"}).optional()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        await prisma.slider.update({
            where:{
                id: data.id
            },
            data
        })
    } catch (err) {
        console.error(`Error while updating slider ${err}`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string"})
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { id } = validation_result.data
        await prisma.slider.delete({
            where:{
                id
            }
        })
        return res.status(200).send()  
    } catch (err) {
        console.error(`Error while deleting slider ${err}`)
        return res.status(500).send()
    }
}
