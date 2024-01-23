import { Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as crypto from "crypto";
import axios from "axios";
import { prisma } from "../server";
import { store } from "../utils/store";


export async function cinet_pay_link(transactionId: string, amount: number, phone: string) {
    const data = {
        "apikey": "25443723563ef760b99c2b5.76392442",
        "site_id": "636165",
        "transaction_id": transactionId,
        "amount": amount,
        "currency": "XOF",
        "description": "Reglement de commande",
        "customer_id": phone,
        "notify_url": `https://goodness-1e5ee24644b9.herokuapp.com/porder/validate/${transactionId}`,
        "return_url": "https://google.com",
        "channels": "ALL",
        "lang": "FR"
    }
    const payment_request_response = await axios.post(
        "https://api-checkout.cinetpay.com/v2/payment", data
    ).then(res => {
        if (res.status !== 200) {
            console.log(`Error while getting payment url`); return { status: false, url: "" };
        }
        const response = res.data as { data: { payment_url: string } };
        return { status: true, url: response.data.payment_url };
    })
    console.log(payment_request_response);
    return payment_request_response;
}

export async function make_order(req: Request, res: Response) {
    try {
        const schema = z.object({
            username: z.string().nonempty("Indiquez votre nom complet"),
            usermail: z.string().nonempty("Indiquez votre adresse mail"),
            userphone: z.string().nonempty("Indiquez votre numéro de téléphone"),
            quantity: z.number(),
            amount: z.number(),
            status: z.string().default("unpaid"),
            createdat: z.coerce.date(),
        });
        const validation = schema.safeParse(req.body);
        if (!validation.success) return res.status(400).send({ error: true, message: fromZodError(validation.error).details[0].message, data: {} });
        const transactionId = crypto.randomUUID();
        const result = await prisma.packageOrder.create({ data: { ...validation.data, transaction: transactionId } });
        if (!result) return res.status(400).send({ error: true, message: "Une erreur s'est produite", data: {} })
        const data = await cinet_pay_link(transactionId, validation.data.amount, validation.data.userphone);
        return res.status(200).send({ error: false, message: "", data });
    } catch (err) {
        console.error(`Error while creating order ${err}`)
        return res.status(500).send({ error: true, message: "error !!", data: {} });
    }
}

export async function package_payment_event(req: Request, res: Response) {
    try {
        const order_id = req.params.tid
        const schema = z.object({
            cpm_amount: z.string(),
            cpm_trans_id: z.string(),
            payment_method: z.string(),
            cel_phone_num: z.string(),
            cpm_error_message: z.string(),
            cpm_trans_date: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) {
            console.log(`Error while parsing response from cinet pay ${req.body}`)
            return res.status(500).send()
        }
        const { data } = validation_result
        if (store.includes(data.cpm_trans_id)) {
            console.log(`Found duplicate id in store ${data.cpm_trans_id} : Aborting processing`)
            return res.status(409).send()
        }
        store.push(data.cpm_trans_id)
        if (data.cpm_error_message != "SUCCES") {
            const order = await prisma.packageOrder.findFirst({ where: { transaction: order_id } });
            if (!order) return false;
            await prisma.packageOrder.update({ where: { id: order.id }, data: { status: "paid" } });
            return res.status(200).send()
        }
        console.log(`A payment failed`)
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while handling payment event ${err}`)
        return res.status(500).send()
    }
}