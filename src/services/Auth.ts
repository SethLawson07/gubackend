import { Request, Response} from "express"
import { prisma } from "../server"
import { sign_token, hash_pwd, password_is_valid } from "../utils"
import { z } from "zod"

export async function register(req: Request, res: Response){
    try {
       const user_schema = z.object({
           email: z.string().email(),
           phone: z.string(),
           password: z.string(),
           profile_picture: z.string()
       }) 
       const validation_result = user_schema.safeParse(req.body)
       if(!validation_result.success){
           return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
       }
       let user_data = {...validation_result.data, is_admin:false} 
       const hashed_password = hash_pwd(user_data.password)
       user_data.password = hashed_password
       user_data.profile_picture = user_data.profile_picture ?? ""
       const potential_duplicate  = await prisma.user.findUnique({
           where:{
               email: user_data.email
           }
       })
       if(potential_duplicate) return res.status(409).send({ message:"cet email est deja en cours d'utilisation" })
       await prisma.user.create({
           data: user_data
       })
        const token = sign_token(user_data.email, false)
        return res.status(201).send({ token })
    } catch (err) {
        console.error(`Error while registering ${err}`)
        return res.status(500).send()
    }
}

export async function change_password(req: Request, res: Response){
    try {
        const schema = z.object({
            old: z.string(),
            new: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({message: validation_result.error.message})
        const { data } = validation_result
        const current_user = req.body.user as string
        const targetted_user = await prisma.user.findUnique({
            where:{
                email: current_user
            }
        })
        if(!targetted_user) return res.status(404).send({ message:"Utilisateur non trouve"})
        if(!password_is_valid(data.old, targetted_user.password)) return res.status(400).send({ message:"Mot de passe invalide"})
        await prisma.user.update({
            where:{
                email: targetted_user.email
            },
            data:{
                password: hash_pwd(data.new)
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.log(`Error while changing user password ${err}`);
        return res.status(500).send()
    }
}

export async function set_financepro_id(req: Request, res: Response){
    try {
        const schema = z.object({
            id: z.string(),
            user: z.string()
        })
        const validation_result = schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message)})
        const { id, user } = validation_result.data
        const targetted_user = await prisma.user.findUnique({
            where:{
                email: user
            }
        })
        if(!targetted_user) return res.status(400).send({ message:"Utilisateur non  trouve"})
        await prisma.user.update({
            where:{
                email: user
            },
            data:{
                is_verified: true,
                finance_pro_id: id
            }
        })
        return res.status(200).send()
    } catch (err) {
        console.error(`Error while setting user Financepro id ${err}`);
        return res.status(500).send()
    }
}

export async function login(req: Request, res: Response){
    try {
       const login_schema = z.object({
           email: z.string().email(),
           password: z.string(),
       })
        const validation_result = login_schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const login_data = validation_result.data
        const targetted_user = await prisma.user.findUnique({
            where:{
                email: login_data.email
            }
        })
        if(!targetted_user) return res.status(404).send({ message:"Aucun utilisateur trouve pour cette adresse email" })
        if(!password_is_valid(login_data.password, targetted_user.password)) return res.status(400).send({ message:"mot de passe incorrect" })
        const token = sign_token(login_data.email, targetted_user.is_admin)
        return res.status(200).send({ token })
    } catch (err) {
        console.error(`Error while loging in ${err}`)
        return res.status(500).send()
    }
}

export async function create_admin(req: Request, res: Response){
    try {
        const data_schema = z.object({
            email: z.string().email(),
            password: z.string()
        })
        const validation_result = data_schema.safeParse(req.body)
        if(!validation_result.success) return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
        const admin_data = { ...validation_result.data, password: hash_pwd(validation_result.data.password), profile_picture:"", is_admin:true, phone:"" }
        const potential_duplicate = await prisma.user.findUnique({
            where:{
                email : admin_data.email
            }
        })
        if(potential_duplicate) return res.status(409).send({ message:"email deja en cours d'utilisation" })
        await prisma.user.create({
            data:admin_data
        })
        return res.status(201).send({ message:"Nouveau compte admin cree" })
    } catch (err) {
        console.error(`Error while creating admin ${err}`)
        return res.status(500).send()
    }
}

export async function get_orders(req: Request, res: Response){
    try {
        const { user } = req.body.user as { user: string }
        const current_user = await prisma.user.findUnique({
            where:{
                email:user
            }
        })
        if(!current_user) return res.status(401).send()
        const data = await prisma.order.findMany({
            where:{
                user: current_user.id
            }
        })
        return res.status(200).send({ data})
    } catch (err) {
        console.error(`Error while getting list of user orders ${err}`)
        return res.status(500).send()
    }
}

export async function get_all_users(req: Request, res: Response){
    try {
        const data = await prisma.user.findMany()
        return res.status(200).send({ data })
    } catch (err) {
        console.log(`Error while getting list of all users ${err}`)
        return res.status(500).send()
    }
}
