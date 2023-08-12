import { Request, Response } from "express"
import { prisma } from "../server"
import { sign_token, hash_pwd, password_is_valid } from "../utils"
import { z } from "zod"
import { fromZodError } from 'zod-validation-error';
import { User } from "@prisma/client";

export async function register(req: Request, res: Response) {
    try {
        const user_schema = z.object({
            user_name: z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
            email: z.string().email("L'adresse email est invalide"),
            phone: z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
            password: z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
            profile_picture: z.string(),
        })

        let user_schema_partial = user_schema.partial({
            email: true
        })
        const validation_result = user_schema_partial.safeParse(req.body)
        if (!validation_result.success) {
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }
        let user_data = { ...validation_result.data, is_admin: false, role: 'customer' }
        const hashed_password = hash_pwd(user_data.password)
        user_data.password = hashed_password
        user_data.profile_picture = user_data.profile_picture ?? ""
        const potential_duplicate = await prisma.user.findMany({
            where: {
                OR: [
                    { email: user_data.email },
                    { phone: user_data.phone }
                ]
            }
        })

        if (potential_duplicate.length) return res.status(409).send({ status: 409, error: true, message: "Un autre utilisateur possède les mêmes informations" })
        await prisma.user.create({
            data: user_data
        })

        const token = sign_token(user_data)
        return res.status(201).send({ status: 201, error: false, message: 'Votre compte a été créé', data: { token } })
    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export async function adduser(req: Request, res: Response) {
    try {
        const user_schema = z.object({
            user_name: z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
            email: z.string().email("L'adresse email est invalide"),
            phone: z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
            password: z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
            profile_picture: z.string(),
            role: z.string().default('customer')
        })

        let user_schema_partial = user_schema.partial({
            email: true
        })
        const validation_result = user_schema_partial.safeParse(req.body)
        if (!validation_result.success) {
            console.log(fromZodError(validation_result.error));
            return res.status(400).send({ status: 400, message: fromZodError(validation_result.error).details[0].message, error: true })
        }
        let user_data = { ...validation_result.data, is_admin: false }
        const hashed_password = hash_pwd(user_data.password)
        user_data.password = hashed_password
        user_data.profile_picture = user_data.profile_picture ?? ""
        const potential_duplicate = await prisma.user.findMany({
            where: {
                OR: [
                    { email: user_data.email },
                    { phone: user_data.phone }
                ]
            }
        })

        if (potential_duplicate.length) return res.status(409).send({ status: 409, error: true, message: "Un autre utilisateur possède les mêmes informations" })
        await prisma.user.create({
            data: user_data
        })

        const token = sign_token(user_data)
        return res.status(201).send({ status: 201, error: false, message: 'Votre compte a été créé', data: { token } })
    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export async function change_password(req: Request, res: Response) {
    try {
        const schema = z.object({
            old: z.string(),
            new: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error, { prefix: "erreur" }).message })
        const { data } = validation_result
        const { user: current_user } = req.body.user as { user: User }
        const targetted_user = await prisma.user.findUnique({
            where: {
                email: current_user.email as string
            }
        })
        if (!targetted_user) return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouve" })
        if (!password_is_valid(data.old, targetted_user.password)) return res.status(400).send({ status: 404, error: false, message: "Mot de passe invalide" })
        await prisma.user.update({
            where: {
                email: targetted_user.email as string
            },
            data: {
                password: hash_pwd(data.new)
            }
        })
        return res.status(200).send({ status: 200, error: false })
    } catch (err) {
        console.log(`Error while changing user password ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function set_financepro_id(req: Request, res: Response) {
    try {
        const schema = z.object({
            agentId: z.string(),
            user_id: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: JSON.parse(validation_result.error.message) })
        const { agentId, user_id } = validation_result.data
        const targetted_user = await prisma.user.findUnique({
            where: {
                id: user_id
            }
        })
        if (!targetted_user) return res.status(400).send({ status: 400, error: true, message: "Utilisateur non  trouve" })
        await prisma.user.update({
            where: {
                id: targetted_user.id
            },
            data: {
                is_verified: true,
                agentId: agentId
            }
        })
        return res.status(200).send({ status: 200, error: false, message: "sucess" })
    } catch (err) {
        console.error(`Error while setting user Financepro id ${err}`);
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function login(req: Request, res: Response) {
    try {
        const login_schema = z.object({
            email_or_phone: z.string(),
            password: z.string(),
        })
        const validation_result = login_schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message, data: {} })
        const login_data = validation_result.data
        const targetted_users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: login_data.email_or_phone, },
                    { phone: login_data.email_or_phone }
                ]
            }
        })
        if (!targetted_users.length || targetted_users.length > 1 || !password_is_valid(login_data.password, targetted_users[0].password)) return res.status(404).send({ status: 404, error: true, message: "Identifiants incorrects", data: {} })
        let targetted_user = targetted_users[0]


        // if (!password_is_valid(login_data.password, targetted_user.password)) return res.status(400).send({ status: 400, error: true, message: "Mot de passe incorrect", data: {} })
        let { password, finance_pro_id, is_verified, ...user_data } = targetted_user;
        // let { password, finance_pro_id, is_verified, ...user_data } = targetted_user;
        const token = sign_token({ ...user_data })
        return res.status(200).send({ status: 200, error: false, message: "Connecté avec succès", data: { ...user_data, token, } })
    } catch (err) {
        console.error(`Error while loging in ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} })
    }
}

export async function create_admin(req: Request, res: Response) {
    try {
        const data_schema = z.object({
            user_name: z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
            email: z.string().email("L'adresse email est invalide"),
            phone: z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
            password: z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
            profile_picture: z.string(),
        })
        const validation_result = data_schema.safeParse(req.body)
        if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message })
        const admin_data = { ...validation_result.data, password: hash_pwd(validation_result.data.password), role: 'admin', is_admin: true }
        const potential_duplicate = await prisma.user.findUnique({
            where: {
                email: admin_data.email
            }
        })
        if (potential_duplicate) return res.status(409).send({ status: 409, error: true, message: "Email deja en cours d'utilisation" })
        await prisma.user.create({
            data: admin_data
        })
        return res.status(201).send({ status: 201, error: false, message: "Nouveau compte admin crée" })
    } catch (err) {
        console.error(`Error while creating admin ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function get_orders(req: Request, res: Response) {
    try {
        const { user } = req.body.user as { user: User }
        const current_user = await prisma.user.findUnique({
            where: {
                email: user.email as string
            }
        })
        if (!current_user) return res.status(401).send({ status: 401, error: true, message: 'pas autorisé' })
        const data = await prisma.order.findMany({
            where: {
                user: current_user.id
            }
        })
        return res.status(200).send({ status: 200, error: false, data: { orders: data } })
    } catch (err) {
        console.error(`Error while getting list of user orders ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function get_all_users(_req: Request, res: Response) {
    try {
        const data = await prisma.user.findMany()
        return res.status(200).send({ status: 200, error: false, data: { users: data } })
    } catch (err) {
        console.log(`Error while getting list of all users ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}


export async function get_customers(_req: Request, res: Response) {
    try {
        const data = await prisma.user.findMany({ where: { role: "customer" } })
        return res.status(200).send({ status: 200, error: false, data: { customers: data } })
    } catch (err) {
        console.log(`Error while getting list of customers ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function get_agents(_req: Request, res: Response) {
    try {
        const data = await prisma.user.findMany({ where: { role: "agent" } })
        return res.status(200).send({ status: 200, error: false, data: { agents: data } })
    } catch (err) {
        console.log(`Error while getting list of agents ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}

export async function get_deliverypersons(_req: Request, res: Response) {
    try {
        const data = await prisma.user.findMany({ where: { role: "delivery_man" } })
        return res.status(200).send({ status: 200, error: false, data: { persons: data } })
    } catch (err) {
        console.log(`Error while getting list of deliverypersons ${err}`)
        return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} })
    }
}