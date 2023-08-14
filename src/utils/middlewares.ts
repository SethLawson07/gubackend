import { Request, Response, NextFunction } from "express";
import { verify_token } from ".";

export function Auth(req: Request, res: Response, next: NextFunction) {
    try {
        const bearer = req.headers.authorization ?? ""
        if (bearer === "") return res.status(401).send({ message: "Utilisateur non authentifié" })
        const token_verification_result = verify_token(bearer)
        if (token_verification_result === "") return res.status(401).send({ message: "token invalide ou expiré" })

        req.body.user = token_verification_result
        next()
    } catch (err) {
        console.error(`Error while authenticating incomming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}

export function UserIsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const is_admin = req.body.user.is_admin ?? false
        if (!is_admin) return res.status(401).send({ message: "Seul un compte admin peut acceder a cette route" })
        next()
    } catch (err) {
        console.error(`Error while admin checking incoming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}

export function UserIsCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        let { user } = req.body.user
        const is_customer = user.role === "customer" ?? false
        if (!is_customer) return res.status(401).send({ message: "Seul un compte client peut acceder a cette route" })
        next()
    } catch (err) {
        console.error(`Error while customer checking incoming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}

export function UserIsAgent(req: Request, res: Response, next: NextFunction) {
    try {
        let { user } = req.body.user
        const is_agent = user.role === "agent" ?? false
        if (!is_agent) return res.status(401).send({ message: "Seul un compte agent peut acceder a cette route" })
        next()
    } catch (err) {
        console.error(`Error while agent checking incoming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}


export function UserIsDeliveryMan(req: Request, res: Response, next: NextFunction) {
    try {
        let { user } = req.body.user
        const is_delivery_man = user.role === "delivery_man" ?? false
        if (!is_delivery_man) return res.status(401).send({ message: "Seul un compte livreur peut acceder a cette route" })
        next()
    } catch (err) {
        console.error(`Error while  delivery Man checking incoming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}

export function UserIsCommandHandler(req: Request, res: Response, next: NextFunction) {
    try {
        let { user } = req.body.user
        const is_command_handler = user.role === "command_handler" ?? false
        if (!is_command_handler) return res.status(401).send({ message: "Seul un compte gestionaire de commande  peut acceder a cette route" })
        next()
    } catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`)
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" })
    }
}
