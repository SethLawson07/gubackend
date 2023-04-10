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
