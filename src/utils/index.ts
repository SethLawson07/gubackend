import bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"
import { prisma } from "../server"
import * as crypto from "crypto"
import axios from "axios"
import { User } from "@prisma/client"
import { ObjectId } from "bson";


const JWT_TOKEN = "goodnessunitsupertoken"
const salt_rounds = 10

export function hash_pwd( plain_text_password: string ){
    const hash = bcrypt.hashSync(plain_text_password, salt_rounds)
    return hash
}

export function password_is_valid( plain_text_password:string, db_hash:string ){
    return bcrypt.compareSync(plain_text_password, db_hash)
}

type user_data = {
    is_admin: boolean;
    role: string;
    user_name: string;
    email?: string|null;
    phone: string;
    profile_picture: string;
}

export function sign_token( user:user_data  ){
   const token = jwt.sign({ user }, JWT_TOKEN, { expiresIn:"31d" }) 
   return token
}

export function verify_token(token: string){
    try {
        const { user } = jwt.verify(token, JWT_TOKEN) as { user: User } 
        return { user, is_admin:user.is_admin }
    } catch (err) {
        console.error(`Error while verifying token ${err}`)
        return ""
    }
}

export async function generate_payment_link(amount: number, user:string, order_id: string){
    const transaction_id = crypto.randomUUID()
    const data = {
        "apikey":"25443723563ef760b99c2b5.76392442",
        "site_id":"636165",
        "transaction_id":transaction_id,
        "amount":amount,
        "currency":"XOF",
        "description":"Reglement de commande",
        "customer_id": user,
        "notify_url":`https://api-goodness.herokuapp.com/hook/payment_event/${order_id}`,
        "return_url":"https://google.com",
        "channels":"ALL",
        "lang":"FR"
    }
    const payment_request_response = await axios.post(
        "https://api-checkout.cinetpay.com/v2/payment",
            data
    ).then(res=>{
        if(res.status!==200){
            console.log(`Error while getting payment url`)
            return { status: false, url:"" }
        }
        const response = res.data as { data:{ payment_url: string}}
        return { status: true, url:response.data.payment_url}
    })
    return payment_request_response
}

export async function create_promocode_usage( promocodes: string[], user: string){
   promocodes.map(async (code)=>{
       await prisma.promoCodeUsage.create({
           data:{
               code,
               user
           }
       })
   })
}

export function geneObjectId(){
    const id = new ObjectId()
    return id.toString()
}

