import bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"
import { prisma } from "../server"
import * as crypto from "crypto"

const JWT_TOKEN = "goodnessunitsupertoken"
const salt_rounds = 10

export function hash_pwd( plain_text_password: string ){
    const hash = bcrypt.hashSync(plain_text_password, salt_rounds)
    return hash
}

export function password_is_valid( plain_text_password:string, db_hash:string ){
    return bcrypt.compareSync(plain_text_password, db_hash)
}

export function sign_token( user: string, is_admin: boolean ){
   const token = jwt.sign({ user, is_admin }, JWT_TOKEN, { expiresIn:"31d" }) 
   return token
}

export function verify_token(token: string){
    try {
        const { user, is_admin } = jwt.verify(token, JWT_TOKEN) as { user: string, is_admin: boolean }  
        return { user, is_admin }
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
        "notify_url":`https://goodness-api.onrender.com/hook/payment_event/${order_id}`,
        "return_url":"https://google.com",
        "channels":"ALL",
        "lang":"FR"
    }
    const payment_request_response = await fetch(
        "https://api-checkout.cinetpay.com/v2/payment",
            {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        }
    )
    if(payment_request_response.status!==200) {
        console.log(`Error while getting payment url `)
        return { status: false, url: "" }
    }
    const response = await payment_request_response.json() as { data:{ payment_url: string } }     
    return {
        status: true,
        url: response.data.payment_url
    }
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

