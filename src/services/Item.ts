import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            name: z.string({ required_error:"name est un parametre requis", invalid_type_error:"name doit etre un string"}),
            sub_category: z.string({ required_error:"sub_category est un parametre requis", invalid_type_error:"sub_category doit etre un string"}),
            featured: z.boolean({ required_error:"featured est un parametre requis", invalid_type_error:"featured doit etre un booleen"}),
            schema: z.string({ required_error:"schema est un champ requis", invalid_type_error:"schema doit etre un string"})
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const schema_is_valid = (()=>{
            try {
               const parsed_schema = JSON.parse(validation_result.data.schema)
               return {
                   success: true,
                   data: parsed_schema
               }
            } catch (err) {
                return {
                    success: false,
                    data: null
                }
            }
        })()
        if(!schema_is_valid.success) return res.status(400).send({ message:"schema invalide. Impossible de parser le schema"})
        const targetted_subcategory = await prisma.subCategory.findUnique({
            where:{
                id: validation_result.data.sub_category
            }
        })
        if(!targetted_subcategory) return res.status(404).send()
        const potential_duplicate = await prisma.item.findFirst({
            where:{
                name: validation_result.data.name,
                sub_category: validation_result.data.sub_category
            }
        })
        if(potential_duplicate) return res.status(409).send()
        await prisma.item.create({
            data:{
                ...validation_result.data
            }
        })
        return res.status(201).send()
    } catch (err) {
        console.error(`Error while creating item ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response){
    try {
        const data = await prisma.item.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting list of all items ${err}`)
        return res.status(500).send()
    }
}

export async function update(req: Request, res:Response ){
    try {
       const schema = z.object({
           id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string"}),
           name: z.string({ invalid_type_error:"name doit etre un string"}).optional(),
           featured: z.boolean({ invalid_type_error:"featured doit etre un string"}).optional(),
       }) 
       const validation_result = schema.safeParse(req.body)
       if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
       const { data } = validation_result
       const targetted_item = await prisma.item.findUnique({
           where:{
               id: data.id
           }
       })
       if(!targetted_item) return res.status(404).send()
        const potential_duplicate = await prisma.item.findFirst({
            where:{
                name: data.name,
                sub_category: targetted_item.sub_category
            }
        })
        if(potential_duplicate) return res.status(409).send()
        await prisma.item.update({
            where:{
                id:data.id
            },
            data
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while updating item's info`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string"})
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message:"id manquand ou de type incorrect"})
        const { id } = validation_result.data
        return targetted_item = await prisma.item.findUnique({
            id
        })
        if(!targetted_item) return res.status(404).send()
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting item ${err}`)
        return res.status(500).send()
    }
}
