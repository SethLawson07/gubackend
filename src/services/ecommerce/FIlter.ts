import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addFilter(req: Request, res: Response) {
    try {        
        const schema = z.object({
            title: z.string(),
            name:z.string(),
            options: z.array(z.object({
                value:z.string(),
                label:z.string(),
                checked:z.boolean()
            }),).optional(),
            custom: z.boolean(),
            itemId: z.string()

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        
        const savedFilter = await prisma.filters.create({ data: validation.data  });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedFilter });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}


export async function updateFilter(req: Request, res: Response) {
    try {  
        let id = req.params.id    
        const schema = z.object({
            options: z.array(z.object({
                value:z.string(),
                label:z.string(),
                checked:z.boolean()
            }),),

        });
    
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        
      
            const savedFilter = await prisma.filters.update({where:{id:id},data:validation.data});
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedFilter });

 

    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function allByItem(req: Request, res: Response) {
    try {
        let slugitem = req.params.id
        const all = await prisma.filters.findMany({where:{itemId:slugitem}});
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " +err, data: {} });
    }
}


