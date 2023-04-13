import bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

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

export async function generate_payment_link(amount: number, user:string){
    const transaction_id = Math.floor(Math.random() * 100000000).toString()
    const data = {
        "apikey":"25443723563ef760b99c2b5.76392442",
        "site_id":"636165",
        "transaction_id":transaction_id,
        "amount":amount,
        "currency":"XOF",
        "description":"Reglement de commande",
        "customer_id": user,
        "notify_url":"",
        "return_url":"",
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
    if(payment_request_response.status!==201) return { status: false, data: null }
    const { payment_url } = await payment_request_response.json() as { payment_url:string }
    return {
        status: true,
        data: payment_url
    }
}

