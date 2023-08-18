import { Request, Response } from "express";
import { sendPushNotification } from "../utils";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";


export async function sendNotification(req: Request, res: Response) {
    try {
        const schema = z.object({
            token: z.string(),
        });

        const v_data = schema.safeParse(req.body);
        if (!v_data.success) return res.status(400).send({ error: true, message: fromZodError(v_data.error).message })
        let result = await sendPushNotification(v_data.data.token);
        if (!result) return res.status(403).send
        return res.status(200).send();
    } catch (e) {
        throw e
    }

}