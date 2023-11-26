import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../server"
import { Caroussel, CarousselService } from "@prisma/client"

export async function create(req: Request, res: Response) {
    try {
        const schema = z.object({
            big_text: z.string({ required_error: "big_text est un parametre requis", invalid_type_error: "bif_text doit etre un string" }),
            alt_text: z.string({ required_error: "alt_text est un parametre requis", invalid_type_error: "alt_text doit etre un string" }),
            image: z.string({ required_error: "image est un parametre requis", invalid_type_error: "image doit etre un string" }),
            featured: z.boolean({ required_error: "featured est un parametre requis", invalid_type_error: "featured doit etre un string" })
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        await prisma.slider.create({
            data
        })
        return res.status(201).send()
    } catch (error) {
        console.error(`Error while creating slider ${error}`)
        return res.status(500).send()
    }
}

export async function get(_req: Request, res: Response) {
    try {
        const data = await prisma.slider.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.error(`Error while getting sliders ${err}`)
        return res.status(500).send()
    }
}

export async function update(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string({ required_error: "id est un parametre requis", invalid_type_error: "id doit etre un string" }),
            featured: z.boolean({ invalid_type_error: "featured doit etre un boolen" }).optional(),
            big_text: z.string({ invalid_type_error: "bif_text doit etre un string" }).optional(),
            alt_text: z.string({ invalid_type_error: "alt_text doit etre un string" }).optional(),
            image: z.string().optional()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { data } = validation_result
        await prisma.slider.update({
            where: {
                id: data.id
            },
            data
        })
    } catch (err) {
        console.error(`Error while updating slider ${err}`)
        return res.status(500).send()
    }
}

export async function delete_(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string({ required_error: "id est un parametre requis", invalid_type_error: "id doit etre un string" })
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const { id } = validation_result.data
        await prisma.slider.delete({
            where: {
                id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while deleting slider ${err}`)
        return res.status(500).send()
    }
}


/// Custom caroussel (Slider)

// Créé
export async function create_csl(req: Request, res: Response) {
    try {
        const schema = z.object({
            code: z.string(),
            image: z.string(),
            title: z.string(),
            description: z.string(),
            bottomtext: z.string(),
            link: z.string(),
            linkText: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ message: JSON.parse(validation.error.message) });
        const v_result = validation.data;
        const targeted = await prisma.caroussel.findFirst({ where: { code: v_result.code } });
        let created: Caroussel;
        if (!targeted) {
            created = await prisma.caroussel.create({
                data: {
                    code: v_result.code,
                    link: v_result.link,
                    image: v_result.image,
                    title: v_result.title,
                    linkText: v_result.linkText,
                    buttomText: v_result.bottomtext,
                    description: v_result.description,
                }
            });
        } else {
            created = await prisma.caroussel.update({
                where: { id: targeted.id },
                data: {
                    code: v_result.code,
                    link: v_result.link,
                    image: v_result.image,
                    title: v_result.title,
                    linkText: v_result.linkText,
                    buttomText: v_result.bottomtext,
                    description: v_result.description,
                }
            });
        }
        if (!created) return res.status(200).send({ error: true, message: "Slider non créé", data: {} })
        return res.status(201).send({ status: 201, error: false, message: "Slider crée", data: created });
    } catch (err) {
        console.error(`Error while creating slider ${err}`)
        return res.status(500).send({ error: true, message: "", data: {} })
    }
}


// Créé
export async function create_csl_srv(req: Request, res: Response) {
    try {
        const schema = z.object({
            code: z.string(),
            image: z.string(),
            description: z.string(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ message: JSON.parse(validation.error.message) });
        const v_result = validation.data;
        const targeted = await prisma.carousselService.findFirst({ where: { code: v_result.code } });
        let created: CarousselService;
        if (!targeted) {
            created = await prisma.carousselService.create({
                data: {
                    code: v_result.code,
                    image: v_result.image,
                    description: v_result.description,
                }
            });
        } else {
            created = await prisma.carousselService.update({
                where: { id: targeted.id },
                data: {
                    code: v_result.code,
                    image: v_result.image,
                    description: v_result.description,
                }
            });
        }
        if (!created) return res.status(200).send({ error: true, message: "Slider non créé", data: {} })
        return res.status(201).send({ status: 201, error: false, message: "Slider crée", data: created });
    } catch (err) {
        console.error(`Error while creating slider ${err}`)
        return res.status(500).send({ error: true, message: "", data: {} })
    }
}

// // Get all
export async function slider_csl_srv(req: Request, res: Response) {
    try {
        let sliders = await prisma.carousselService.findMany();
        if (!sliders) return res.status(404).send({ error: true, message: "", data: {} });
        return res.status(200).send({ error: false, message: {}, data: sliders });
    } catch (err) {
        console.error(`Error while getting slider ${err}`)
        return res.status(500).send({ error: true, message: "", data: {} })
    }
}


// // Get all
export async function slider_csl(req: Request, res: Response) {
    try {
        let sliders = await prisma.caroussel.findMany();
        if (!sliders) return res.status(404).send({ error: true, message: "", data: {} });
        return res.status(200).send({ error: false, message: {}, data: sliders });
    } catch (err) {
        console.error(`Error while getting slider ${err}`)
        return res.status(500).send({ error: true, message: "", data: {} })
    }
}
