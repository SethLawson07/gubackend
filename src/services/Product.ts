import { Request, Response} from "express"
import { date, z } from "zod"
import { prisma } from "../server"

export async function create(req: Request, res: Response){
    try {
        const schema = z.object({
            name: z.string({ required_error:"name est un parametre requis", invalid_type_error:"name doit etre un string"}),
            item: z.string({ required_error:"item est un parametre requis", invalid_type_error:"item doit etre un string"}),
            featured: z.boolean({ required_error:"featured est un parametre requis", invalid_type_error:"featured doit etre un booleen"}),
            in_stock: z.number({ required_error:"in_stock est un parametre requis", invalid_type_error:"in_stock doit etre un entier valide"}).int({ message:"in_stock doit etre un entier"}).positive({ message:"in_stock doit etre positif"}),
            price: z.number({ required_error:"price est un parametre requis", invalid_type_error:"price doit etre un nombre valide"}).positive({ message:"price doit etre positif"}),
            pay_at_delivery: z.boolean({ required_error:"pay_at_delivery est un parametre requis", invalid_type_error:"pay_at_delivery doit etre un boolen"}),
            is_in_discount: z.boolean({ required_error:"is_in_discount est un parametre requis", invalid_type_error:"is_in_discount doit etre un boolen"}),
            discount_price: z.number({ invalid_type_error:"discount_price doit etre un nombre valide"}).optional(),
            fields: z.string({ invalid_type_error:"fields doit etre un string"}).optional()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        let { data } = validation_result
        if(data.is_in_discount && !data.discount_price) return res.status(400).send({ message:"discount_price est requis si le produit est en reduction"})
        data.discount_price = data.discount_price? data.discount_price : 0
        let fields_data = {}
        if(data.fields){
            try {
                fields_data = JSON.parse(data.fields)
            } catch (err) {
                return res.status(400).send({ message:"fields invalide. Fields doit etre la forme stringifiee d'un json valide"})
            }
        }
        const targetted_item = await prisma.item.findUnique({
            where:{
                id:data.item
            }
        })
        if(!targetted_item) return res.status(404).send()
        await prisma.product.create({
            data:{
               ...data,
               fields: fields_data
            }
        })
        return res.status(201).send()
    } catch (err) {
        console.error(`Error while creating product ${err}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res:Response){
    try {
        const data = await prisma.product.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting list of products`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string({ required_error:"id est un parametre requis", invalid_type_error:"id doit etre un string"})
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message:"id manquant ou de type incorrect"})
        const { id } = validation_result.data
        await prisma.product.delete({
            where:{
                id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting product ${err}`)
        return res.status(500).send()
    }
}
