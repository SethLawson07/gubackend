import { Request, Response} from "express"
import { prisma } from "../server"
import { sign_token, hash_pwd, password_is_valid } from "../utils"
import { z } from "zod"


export async function register(req: Request, res: Response){
    try {
       const user_schema = z.object({
           email: z.string({ required_error:"email est un paramètre requis", invalid_type_error:"email doit être un email valid" }).email(),
           phone: z.string({ required_error:"phone est un paramètre requis", invalid_type_error:"phone doit être un string" }),
           password: z.string({ required_error:"password est un paramètre requis", invalid_type_error:"password doit être un string" }),
           profile_picture: z.string({ invalid_type_error:"profile_picture n'est pas requis mais si passé dans le body, doit être un string valide" })
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
        return res.status(500).send({ message:"Une erreur est survenue, veuillez réessayer ou contacter les développeurs" })
    }
}

export async function login(req: Request, res: Response){
    try {
       const login_schema = z.object({
           email: z.string({ required_error:"email est un paramètre requis", invalid_type_error:"email doit être un email valid" }).email(),
           password: z.string({ required_error:"email est un parametre requis", invalid_type_error:"email doit etre un string" }),
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
        return res.status(500).send({ message:"Une erreur est survenue, veuillez reesayer ou contacter les developpeurs" })
    }
}

export async function create_admin(_req: Request, res: Response){
    try {
       return res.status(200).send() 
    } catch (err) {
        console.error(`Error while creating admin ${err}`)
        return res.status(500).send({ message:"Une erreur est survenue, veuillez reesayer ou contacter les developpeurs" })
    }
}
