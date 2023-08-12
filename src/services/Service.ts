import { z } from "zod"
import { prisma } from "../server"
import { Request, Response } from "express"
import { Prisma } from "@prisma/client"
import { fromZodError } from "zod-validation-error"

export async function create(req: Request, res: Response) {
  try {
    const schema = z.object({
      name: z.string().min(5, "Donnez un nom de service"),
      description: z.string().min(10, "Donnez une description de service"),
      pictures: z.array(z.string()).nonempty("Sélectionner des images"),
      seller_number: z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
    })
    const validation_result = schema.safeParse(req.body);
    if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message, data: {} })
    const { data } = validation_result
    await prisma.services.create({
      data
    })
    return res.status(201).send({ status: 201, error: false, message: 'sucess', data: {} })
  } catch (err) {
    console.error(`Error while creating a brand ${err}`)
    return res.status(500).send({ status: 400, error: true, message: "Une erreur s'est produite", data: {} })
  }
}


export async function get(_req: Request, res: Response) {
  try {
    const data = await prisma.services.findMany()
    return res.status(200).send({ error: false, message: "", data: data })
  } catch (err) {
    console.error(`Error while getting services ${err}`)
    return res.status(500).send()
  }
}

