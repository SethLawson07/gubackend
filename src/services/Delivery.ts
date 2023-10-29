import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { Order, User } from "@prisma/client";


export const createDelivery = async (data: Order, customer: User) => {
    try {
        const schema = z.object({
            status: z.string().default("AWAITING"),
            delivery_address: z.object({
                name: z.string(),
                email: z.string().email(),
                phone: z.string(),
                map_address: z.string()
            }),
            amount: z.number().int().positive(),
        });
        const validation = schema.safeParse(data);
        if (!validation.success) {
            console.log(validation.error);
            return;
        };
        return await prisma.delivery.create({ data: { ...validation.data, status: "AWAITING", customer: customer } });
    } catch (e) {
        console.log(e);
    }
}


// Delivries for all deliverypersoons
export async function all_delivery(req: Request, res: Response) {
    try {
        const data = await prisma.delivery.findMany();
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}


// Delivries for all deliverypersoons
export async function awaiting_deliveries(req: Request, res: Response) {
    try {
        const data = await prisma.delivery.findMany({ where: { status: "AWAITING" } });
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// Delivries for all deliverypersoons
export async function delivery_by_user(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };
        const data = await prisma.delivery.findMany({ where: { status: "GAINED", userId: user.id } });
        return res.status(200).send({ error: false, data, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// Gain delivery
// Choisir de livrer la commande
export async function gain_delivery(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const { user } = req.body.user as { user: User };
        const targetted_delivery = await prisma.delivery.findUnique({ where: { id } });
        if (!targetted_delivery) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.delivery.update({
            where: { id },
            data: { status: "GAINED", delivery_person: { connect: { id: user.id } } }
        });
        return res.status(200).send({ error: false, data: targetted_delivery, message: "Ça y est vous être choisi pour livrer la commande" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}


// Commencer la livraison
export async function start_delivery(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const targetted_delivery = await prisma.delivery.findUnique({ where: { id } });
        if (!targetted_delivery) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.delivery.update({ where: { id }, data: { status: "PENDING" } });
        return res.status(200).send({ error: false, data: targetted_delivery, message: "Ça y est vous être choisi pour livrer la commande" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// Marquer livré
export async function delivered(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const { user } = req.body.user as { user: User };
        const targetted_delivery = await prisma.delivery.findUnique({ where: { id } });
        if (!targetted_delivery) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.delivery.update({ where: { id }, data: { status: "DELIVERED" } });
        return res.status(200).send({ error: false, data: targetted_delivery, message: "Ça y est vous être choisi pour livrer la commande" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}