import bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

const JWT_TOKEN = "goodnessunitsupertoken"
const salt_rounds = 10

export function hash_pwd( plain_text_password: string ){
    const hash = bcrypt.hashSync(plain_text_password, salt_rounds)
    return hash
}

export function sign_token( user: string ){
   const token = jwt.sign({ user }, JWT_TOKEN, { expiresIn:"31d" }) 
   return token
}

export function verify_token(token: string){
    try {
        const { user } = jwt.verify(token, JWT_TOKEN) as { user: string }  
        return user
    } catch (err) {
        console.error(`Error while verifying token ${err}`)
        return ""
    }
}
