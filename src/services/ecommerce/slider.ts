import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addSlider(req: Request, res: Response) {
    try { 
        const schema = z.object({
            title: z.string(),
            type: z.string(),
            file: z.string(),
            link: z.string(),
            position: z.string(),
            description: z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const slider = await prisma.slider.findFirst({where:{position:validation.data.position,featured:true}})
        if(slider){
             await prisma.slider.update({where:{id:slider.id},data:{featured:false}})
        }       
        const savedSlider = await prisma.slider.create({ data: validation.data });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSlider });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function all(req: Request, res: Response) {
    try {
        const all = await prisma.slider.findMany({orderBy:{createdat:'desc'},where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: all });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function active(req: Request, res: Response) {
    try {
        const active = await prisma.slider.findMany({where:{featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: active });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function slider(req: Request, res: Response) {
    try {
        let position = req.params.position
        const slider = await prisma.slider.findFirst({orderBy:{createdat:'desc'},where:{position:position,featured:true}});
        return res.status(200).send({ error: false, message: "ok", data: slider });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}


export async function updateSlider(req: Request, res: Response) {
    try {
        let id = req.params.id
        const schema = z.object({
            title: z.string(),
            file: z.string(),
            link: z.string(),
            position: z.string(),
            description: z.string(),
            featured:z.boolean().optional()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
        const savedSlider = await prisma.slider.update({ where: { id: id, }, data: validation.data, })
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSlider });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}



export async function deleteSlider(req: Request, res: Response) {
    try {
        let id = req.params.id
        const slider = await prisma.slider.delete({ where: { id: id } });
        return res.status(200).send({ error: false, message: "ok", data: slider });
    } catch (err) {
        console.error(` ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}