import { z } from "zod"
import { prisma } from "../server"
import { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import { fromZodError } from "zod-validation-error"

export async function create(req:Request,res:Response){
    try {
        const schema = z.object({
          name: z.string(),
          description: z.string(),
          pictures: z.array(z.string()),
          seller_number:z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ status:400 ,error: true , message: fromZodError(validation_result.error, { prefix: "erreur" }).message})
        const { data } = validation_result
        await prisma.services.create({
          data
        })
        return res.status(201).send({status:201,error: false, message:'sucess'})
      } catch (err) {
        console.error(`Error while creating a brand ${err}`)
        return res.status(500).send({ status:400 ,error: true , message:"erreur s'est produite"})
      }
}