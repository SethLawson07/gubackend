import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Product } from "@prisma/client";


export async function create(req: Request, res: Response) {
  try {
    const schema = z.object({
      name: z.string(),
      image: z.string(),
      featured: z.boolean()

    })
    const validation_result = schema.safeParse(req.body)
    if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
    const { data } = validation_result
    await prisma.brand.create({
      data
    })
    return res.status(201).send()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return res.status(409).send({ message: "Une marque avec ce nom existe deja" })
    }
    console.error(`Error while creating a brand ${err}`)
    return res.status(500).send()
  }
}

export async function get_all(_req: Request, res: Response) {
  try {
    const data = await prisma.brand.findMany()
    return res.status(200).send({ data })
  } catch (err) {
    console.error(`Error while getting list of brands ${err}`)
    return res.status(500).send()
  }
}

export async function delete_brand(req: Request, res: Response) {
  try {
    const schema = z.object({
      id: z.string()
    })
    const validation_result = schema.safeParse(req.body)
    if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
    const { data } = validation_result
    await prisma.product.deleteMany({
      where: {
        brand: data.id
      }
    })
    await prisma.brand.delete({
      where: {
        id: data.id
      }
    })
    return res.status(200).send()
  } catch (error) {
    console.error(`Error while deleting a brand ${error}`)
    return res.status(500)
  }
}

export async function update_brand(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string(),
            featured: z.boolean().optional(),
            image: z.string().optional()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { data } = validation_result
        await prisma.brand.update({
            where:{
                id: data.id
            },
            data:{
                featured: data.featured,
                image: data.image
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while updating brand ${err}`)
        return res.status(500)
    }
}
