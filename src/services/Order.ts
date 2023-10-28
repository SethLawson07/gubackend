import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { create_promocode_usage, generate_payment_link } from "../utils"
import { User } from "@prisma/client";

export async function create(req: Request, res: Response) {
    try {
        const schema = z.object({
            amount: z.number().int().positive(),
            cart: z.array(z.object({
                id: z.string(),
                quantity: z.number().int().positive()
            })).nonempty(),
            promocodes: z.array(z.string()),
            delivery_type: z.string(),
            delivery_address: z.object({
                name: z.string(),
                email: z.string().email(),
                phone: z.string(),
                map_address: z.string()
            })
        });

        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) });
        const { data } = validation_result;
        const { user } = req.body.user as { user: User };
        if (!user) return res.status(401).send();
        if (user) {
            // const d_status = data.delivery_type == "livraison" ? "PENDING"
            const order = await prisma.order.create({
                data: {
                    user: user.id,
                    remainder: data.amount,
                    promocodes: data.promocodes,
                    paid: false,
                    status: "PENDING",
                    cart: data.cart,
                    amount: data.amount,
                    delivery_type: data.delivery_type,
                    delivery_address: data.delivery_address
                }
            });
            const response = await generate_payment_link(data.amount, user.id, order.id);
            await create_promocode_usage(data.promocodes, user.email as string);
            return res.status(201).send({ data: response, order: order.id, error: false, status: 201 });
        } else {
            return res.status(400).send({ error: true, message: "Utilisateur non authentifié", data: {} });
        }
    } catch (err) {
        console.log(`Error while creating order ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
    }
}

export async function get_all(_req: Request, res: Response) {
    try {
        const data = await prisma.order.findMany();
        return res.status(200).send({ error: false, message: "ok", data });
    } catch (err) {
        console.error(`Error while getting all orders ${err}`)
        return res.status(500).send();
    }
}

export async function get_user_orders(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User };

        const targetted_user = await prisma.user.findMany({
            where: { phone: user.phone }
        });
        if (!targetted_user) return res.status(404).send({ error: true, message: "User not found", data: {} });
        const data = await prisma.order.findMany({ where: { user: user.id } });
        return res.status(200).send({ data: data, error: false, message: "", status: 200, user: targetted_user[0].id })
    } catch (err) {
        console.error(`Error while getting user orders ${err}`)
        return res.status(500).send()
    }
}

export async function cancel_order(req: Request, res: Response) {
    try {
        const schema = z.object({
            id: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send()
        const { id } = validation_result.data
        const { user } = req.body.user as { user: User }
        const current_user = await prisma.user.findUnique({ where: { email: user.email as string } })
        if (!current_user) return res.status(401).send()
        const targetted_order = await prisma.order.findUnique({ where: { id } });
        if (!targetted_order) return res.status(404).send()
        if (targetted_order.user !== current_user.id) return res.status(403).send()
        await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
        return res.status(200).send({ error: false, message: "Commande annulé", data: targetted_order });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send()
    }
}

// Validate Order
export async function validate_order(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const targetted_order = await prisma.order.findUnique({ where: { id } });
        if (!targetted_order) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.order.update({
            where: { id },
            data: { status: "VALIDATED" }
        });
        return res.status(200).send({ error: false, data: targetted_order, message: "Commande validée avec succès" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}


// Choisir de livrer la commande
export async function gain_order(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const { user } = req.body.user as { user: User };
        const targetted_order = await prisma.order.findUnique({ where: { id } });
        if (!targetted_order) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.order.update({
            where: { id },
            data: { status: "GAINED", delivery_person: user }
        });
        return res.status(200).send({ error: false, data: targetted_order, message: "Ça y est vous être choisi pour livrer la commande" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// 
export async function order_delivered(req: Request, res: Response) {
    try {
        const schema = z.object({ id: z.string() });
        const validation_result = schema.safeParse(req.body);
        if (!validation_result.success) return res.status(400).send({ error: true, message: "Id requis", data: {} });
        const { id } = validation_result.data;
        const targetted_order = await prisma.order.findUnique({ where: { id } });
        if (!targetted_order) return res.status(404).send({ error: true, message: "Order not found", data: {} });
        await prisma.order.update({
            where: { id },
            data: { status: "DELIVERED" }
        });
        return res.status(200).send({ error: false, data: targetted_order, message: "Commande validée avec succès" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// Delivered orders
export async function delivered_orders(req: Request, res: Response) {
    try {
        const targetted_order = await prisma.order.findMany({ where: { status: "DELIVERED" }});
        return res.status(200).send({ error: false, data: targetted_order, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} });
    }
}

// Pending orders
export async function pending_orders(req: Request, res: Response) {
    try {
        const targetted_order = await prisma.order.findMany({ where: { status: "PENDING" }})
        return res.status(200).send({ error: false, data: targetted_order, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}

// validated orders
export async function validated_orders(req: Request, res: Response) {
    try {
        const targetted_order = await prisma.order.findMany({ where: { status: "VALIDATED" }})
        return res.status(200).send({ error: false, data: targetted_order, message: "ok" });
    } catch (err) {
        console.error(`Error while cancelling order ${err}`)
        return res.status(500).send({ error: true, message: "Une erreur s'es produite", data: {} })
    }
}