import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { prisma } from "../../server";


export async function addProductVariant(req: Request, res: Response) {
    try {
        const schema = z.object({
            color: z.string(),
            image:z.string(),
            size: z.object({
                name:z.string(),
                stock:z.number()
            }),
            productId: z.string(),

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
     
        const savedVariant = await prisma.productVariant.create({ data: validation.data  });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}

export async function addItemVariant(req: Request, res: Response) {
    try {
        const schema = z.object({
            title: z.string(),
            itemId: z.string(),

        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });
     
        const savedVariant = await prisma.itemVariant.create({ data: validation.data  });
        return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite "+err, data: {} });
    }
}
export async function updateItemVariant(req: Request, res: Response) {
    try {
        const variantId = req.params.variantId;
        const newValue = req.body.value; // Nouvelle valeur à ajouter

        // Récupérer le variant existant depuis la base de données
        const existingVariant = await prisma.itemVariant.findUnique({ where: { id: variantId } });
        if (!existingVariant) return res.status(404).send({ status: 404, error: true, message: "Variant not found", data: {} });

        // Mettre à jour le tableau de valeurs avec la nouvelle valeur
        const updatedValues = [...existingVariant.value, newValue];

        // Valider les nouvelles valeurs
        const schema = z.object({
            value: z.array(z.string()),
        });
        const validation = schema.safeParse({ value: updatedValues });
        if (!validation.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation.error).message, data: {} });

        // Mettre à jour le variant avec la nouvelle valeur
        const updatedVariant = await prisma.itemVariant.update({
            where: { id: variantId },
            data: { value: updatedValues }
        });

        return res.status(200).send({ status: 200, error: false, message: "Variant updated successfully", data: updatedVariant });
    } catch (err) {
        return res.status(500).send({ status: 500, error: true, message: "An error occurred: " + err, data: {} });
    }
}
