"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserIsAgentCustomerOrAdmin = exports.UserIsCustomerOrAdmin = exports.UserIsAgentOrCustomer = exports.UserIsAgentOrAdmin = exports.UserIsCommandHandler = exports.UserIsDeliveryMan = exports.UserIsAgent = exports.UserIsCustomer = exports.UserIsAdmin = exports.GoodAuth = exports.Auth = void 0;
const _1 = require(".");
function Auth(req, res, next) {
    var _a;
    try {
        const bearer = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : "";
        if (bearer === "")
            return res.status(401).send({ message: "Utilisateur non authentifié" });
        const token_verification_result = (0, _1.verify_token)(bearer);
        if (token_verification_result === "")
            return res.status(401).send({ message: "token invalide ou expiré" });
        req.body.user = token_verification_result;
        next();
    }
    catch (err) {
        console.error(`Error while authenticating incomming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.Auth = Auth;
function GoodAuth(req, res, next) {
    var _a;
    try {
        const bearer = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : "";
        if (bearer === "")
            return res.status(401).send({ message: "Utilisateur non authentifié" });
        const token_verification_result = (0, _1.verify_token)(bearer);
        if (token_verification_result === "")
            return res.status(401).send({ message: "token invalide ou expiré" });
        req.body.user = token_verification_result;
        next();
    }
    catch (err) {
        console.error(`Error while authenticating incomming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.GoodAuth = GoodAuth;
function UserIsAdmin(req, res, next) {
    var _a;
    try {
        const is_admin = (_a = req.body.user.is_admin) !== null && _a !== void 0 ? _a : false;
        if (!is_admin)
            return res.status(401).send({ message: "Seul un compte admin peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while admin checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsAdmin = UserIsAdmin;
function UserIsCustomer(req, res, next) {
    var _a;
    try {
        const { user } = req.body.user;
        // const is_customer = (user.role === "customer" || user.is_admin) ?? false
        const is_customer = (_a = user.role === "customer") !== null && _a !== void 0 ? _a : false;
        if (!is_customer)
            return res.status(401).send({ message: "Seul un compte client peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while customer checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsCustomer = UserIsCustomer;
function UserIsAgent(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_agent = (_a = user.role === "agent") !== null && _a !== void 0 ? _a : false;
        if (!is_agent)
            return res.status(401).send({ message: "Seul un compte agent peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while agent checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsAgent = UserIsAgent;
function UserIsDeliveryMan(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_delivery_man = (_a = user.role === "delivery_man") !== null && _a !== void 0 ? _a : false;
        if (!is_delivery_man)
            return res.status(401).send({ message: "Seul un compte livreur peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while  delivery Man checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsDeliveryMan = UserIsDeliveryMan;
function UserIsCommandHandler(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_command_handler = (_a = user.role === "command_handler") !== null && _a !== void 0 ? _a : false;
        if (!is_command_handler)
            return res.status(401).send({ message: "Seul un compte gestionaire de commande  peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsCommandHandler = UserIsCommandHandler;
function UserIsAgentOrAdmin(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_command_handler = (_a = (req.body.user.is_admin || user.role == "agent")) !== null && _a !== void 0 ? _a : false;
        if (!is_command_handler)
            return res.status(401).send({ message: "Seul un compte gestionaire de commande  peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsAgentOrAdmin = UserIsAgentOrAdmin;
function UserIsAgentOrCustomer(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_command_handler = (_a = (user.role == "agent" || user.role == "customer")) !== null && _a !== void 0 ? _a : false;
        if (!is_command_handler)
            return res.status(401).send({ message: "Seul un compte Agent ou Client  peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsAgentOrCustomer = UserIsAgentOrCustomer;
function UserIsCustomerOrAdmin(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_command_handler = (_a = (req.body.user.is_admin || user.role == "customer")) !== null && _a !== void 0 ? _a : false;
        if (!is_command_handler)
            return res.status(401).send({ message: "Seul un compte admin ou client peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsCustomerOrAdmin = UserIsCustomerOrAdmin;
function UserIsAgentCustomerOrAdmin(req, res, next) {
    var _a;
    try {
        let { user } = req.body.user;
        const is_command_handler = (_a = (req.body.user.is_admin || user.role == "agent" || user.role == "customer")) !== null && _a !== void 0 ? _a : false;
        if (!is_command_handler)
            return res.status(401).send({ message: "Seul un admin, client, agent  peut acceder a cette route" });
        next();
    }
    catch (err) {
        console.error(`Error while command handler checking incoming request ${err}`);
        return res.status(500).send({ message: "Une erreur est survenue, reesayez ou contactez les devs" });
    }
}
exports.UserIsAgentCustomerOrAdmin = UserIsAgentCustomerOrAdmin;
