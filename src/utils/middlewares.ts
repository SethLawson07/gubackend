import { Request, Response, NextFunction } from "express";
import { verify_token } from ".";

export function Auth(req: Request, res: Response, next: NextFunction){
    try {
        const bearer = req.headers.authorization ?? ""        
        if(bearer==="") return res.status(401).send({ message:"Utilisateur non authentifié" })
        const token = bearer.split(" ")[1] ?? ""
        if(token==="") return res.status(401).send({ message:"Token invalide" })
        const token_verification_result = verify_token(token)
        if(token_verification_result==="") return res.status(401).send({ message: "token invalide ou expiré" })
        req.body.user = token_verification_result
        next()
    } catch (err) {
        console.error(`Error while authenticating incomming request ${err}`)
        return res.status(500).send({ message:"Une erreur est survenue, reesayez ou contactez les devs" })
    }
}
