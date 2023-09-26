import { Request, Response } from "express";
import z from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../server";
import { products_byids } from "../utils";

export const all_sections = async (req: Request, res: Response) => {
    try {
        let sections: Object[] = [];
        const target_all = await prisma.section.findMany();
        if (!target_all) return res.status(401).send({ error: true, message: "Une erreur est survenue", data: {} });
        // console.log(target_all);
        for (let i = 0; i < target_all.length; i++) {
            const element = target_all[i];
            const products = (await products_byids(element.content)).data;
            sections.push({ ...element, products });
        }
        // for (l) {
        //     // const products = (await products_byids(section.content)).data;
        //     // sections.push({section, })
        //     console.log(section);
        // }
        // target_all.forEach(async (section) => {
        //     sections = ["{ ...sections, ...products }"];
        // });
        // console.log(sections);
        // if (sections.length <= 0) return res.status(401).send({ error: true, message: "Nothing found", data: {} });
        return res.status(200).send({ error: false, message: "Opération réussie", data: sections });
    } catch (err) {
        console.log(err);
        console.log("Error while ...");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export const section_byid = async (req: Request, res: Response) => {
    try {
        const sectionId = req.params.id;
        const target = await prisma.section.findUnique({ where: { id: sectionId } });
        if (!target) return res.status(401).send({ error: true, message: "Une erreur est survenue", data: {} });
        const section = { ...target, products: (await products_byids(target.content)).data };
        if (!section.products) return res.status(401).send({ error: true, message: "Nothing found", data: {} });
        return res.status(200).send({ error: false, message: "Opération réussie", data: section });
    } catch (err) {
        console.log(err);
        console.log("Error while ...");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export const create_section = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            title: z.string().min(5, "Donnez un titre à votre section"),
            description: z.string(),
            contenttype: z.string(),
            content: z.array(z.string()).max(5, "Vous n'avez que 5 choix de produits"),
            featured: z.boolean()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const created_section = await prisma.section.create({ data: validation.data });
        if (!created_section) return res.status(401).send({ error: true, message: "Une erreur est survenue", data: {} });
        return res.status(201).send({ status: 201, error: false, message: "Section créée", data: created_section });
    } catch (err) {
        console.log(err);
        console.log("Error while ...");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export const update_section = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            id: z.string(),
            title: z.string().min(5, "Donnez un titre à votre section"),
            description: z.string(),
            contenttype: z.string(),
            content: z.array(z.string()).max(5, "Vous n'avez que 5 choix de produits"),
            featured: z.boolean()
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).message, data: {} });
        const updated_section = await prisma.section.update({ where: { id: validation.data.id }, data: validation.data });
        if (!updated_section) return res.status(401).send({ error: true, message: "Une erreur est survenue", data: {} });
        return res.status(201).send({ error: false, message: "Section modifiée", data: updated_section });
    } catch (err) {
        console.log(err);
        console.log("Error while ...");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export const delete_section = async (req: Request, res: Response) => {
    try {
        const sectionId = req.params.id;
        const targeted = await prisma.section.findUnique({ where: { id: sectionId } });
        if (!targeted) res.status(401).send({ error: true, message: "Section not Found", data: {} });
        await prisma.section.delete({ where: { id: targeted?.id } });
        return res.status(200).send({ error: true, message: "Opération réussie" });
    } catch (err) {
        console.log(err);
        console.log("Error while ...");
        return res.status(500).send({ error: true, message: "Une erreur s'est produite", data: {} })
    }
}