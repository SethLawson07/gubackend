import { Request, Response} from "express"
import { prisma } from "../server"
import { sign_token, hash_pwd } from "../utils"
import { z } from "zod"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"


export async function register(req: Request, res: Response){
    try {
       const user_schema = z.object({
           email: z.string({ required_error:"email est un paramètre requis", invalid_type_error:"email doit être un email valid" }).email(),
           phone: z.string({ required_error:"phone est un paramètre requis", invalid_type_error:"phone doit être un string" }),
           password: z.string({ required_error:"password est un paramètre requis", invalid_type_error:"password doit être un string" }),
           profile_picture: z.union([ z.string({ invalid_type_error:"Si passé dans la requête, le profile_picture doit être un string valide" }), z.null() ])
       }) 
       const validation_result = user_schema.safeParse(req.body)
       if(!validation_result.success){
           return res.status(400).send({ message: JSON.parse(validation_result.error.message) })
       }
       let user_data = validation_result.data
       const hashed_password = hash_pwd(user_data.password)
       user_data.password = hashed_password
       await prisma.user.create({
           data: user_data
       })
        const token = sign_token(user_data.email)
        return res.status(201).send({ token })
    } catch (err) {
        if(err instanceof PrismaClientKnownRequestError){
            if(err.code==="P2002"){
                return res.status(409).send({ message:"Adresse email ou numéro de téléphone déjà en cours d'utilisation" })
            }
        }
        console.error(`Error while registering ${err}`)
        return res.status(500).send({ message:"Une erreur est survenue, veuillez réessayer ou contacter les développeurs" })
    }
}

export async function login(req: Request, res: Response){

}
