"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disable_user = exports.get_agent_customers_locations = exports.get_agent_customers = exports.get_deliverypersons = exports.get_agents = exports.get_customers = exports.get_customer = exports.get_all_users = exports.create_admin = exports.updateUserDeviceToken = exports.logout = exports.login = exports.set_financepro_id = exports.update_password = exports.updateuser = exports._update = exports.adduser = exports.register = void 0;
const server_1 = require("../server");
const utils_1 = require("../utils");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user_schema = zod_1.z.object({
                user_name: zod_1.z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
                email: zod_1.z.string().email("L'adresse email est invalide"),
                phone: zod_1.z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
                password: zod_1.z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
                profile_picture: zod_1.z.string().optional().default("")
            });
            let user_schema_partial = user_schema.partial({
                email: true
            });
            const validation_result = user_schema_partial.safeParse(req.body);
            if (!validation_result.success) {
                return res.status(400).send({ status: 400, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, error: true });
            }
            let user_data = Object.assign(Object.assign({}, validation_result.data), { is_admin: false, role: 'customer', first_login: false });
            const hashed_password = (0, utils_1.hash_pwd)(user_data.password);
            user_data.password = hashed_password;
            const potential_duplicate = yield server_1.prisma.user.findMany({ where: { OR: [{ email: user_data.email }, { phone: user_data.phone }] } });
            if (potential_duplicate.length)
                return res.status(409).send({ status: 409, error: true, message: "Un autre utilisateur possède les mêmes informations" });
            yield server_1.prisma.user.create({ data: user_data });
            const token = (0, utils_1.sign_token)(user_data);
            return res.status(201).send({ status: 201, error: false, message: 'Votre compte a été créé', data: { token } });
        }
        catch (err) {
            console.error(`Error while registering ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.register = register;
function adduser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user_schema = zod_1.z.object({
                user_name: zod_1.z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
                email: zod_1.z.string().email("L'adresse email est invalide").nullable(),
                phone: zod_1.z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
                password: zod_1.z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
                profile_picture: zod_1.z.string().optional().default(""),
                role: zod_1.z.string().default('customer'),
                agentId: zod_1.z.string().optional(),
                location: zod_1.z.string().optional(),
            });
            let user_schema_partial = user_schema.partial({ email: true });
            const validation_result = user_schema_partial.safeParse(req.body);
            if (!validation_result.success) {
                console.log((0, zod_validation_error_1.fromZodError)(validation_result.error));
                return res.status(400).send({ status: 400, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, error: true });
            }
            let user_data = Object.assign(Object.assign({}, validation_result.data), { is_admin: false });
            const hashed_password = (0, utils_1.hash_pwd)(user_data.password);
            user_data.password = hashed_password;
            const potential_duplicate = yield server_1.prisma.user.findMany({
                where: { OR: [{ email: user_data.email }, { phone: user_data.phone }] }
            });
            if (potential_duplicate.length)
                return res.status(409).send({ status: 409, error: true, message: "Un autre utilisateur possède les mêmes informations" });
            const createdUser = yield server_1.prisma.user.create({ data: Object.assign(Object.assign({}, user_data), { agentId: user_data.agentId == "" ? null : user_data.agentId }) });
            const token = (0, utils_1.sign_token)(user_data);
            return res.status(201).send({ status: 201, error: false, message: 'Utilisateur créé', data: { token: token, id: createdUser.id } });
        }
        catch (err) {
            console.error(`Error while registering ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.adduser = adduser;
// Update user
function _update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user_schema = zod_1.z.object({
                user_name: zod_1.z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
                email: zod_1.z.string().email("L'adresse email est invalide"),
                phone: zod_1.z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
                password: zod_1.z.string().optional(),
                id: zod_1.z.string().nonempty(),
                agent: zod_1.z.string().optional(),
            });
            let user_schema_partial = user_schema.partial({ password: true });
            const validation_result = user_schema_partial.safeParse(req.body);
            if (!validation_result.success) {
                console.log((0, zod_validation_error_1.fromZodError)(validation_result.error));
                return res.status(400).send({ status: 400, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, error: true });
            }
            let user_data = Object.assign({}, validation_result.data);
            const updatedUser = yield server_1.prisma.user.update({
                data: user_data.password ? {
                    user_name: user_data.user_name, phone: user_data.phone, email: user_data.email, password: (0, utils_1.hash_pwd)(user_data.password), agentId: user_data.agent == "" ? null : user_data.agent
                } : {
                    user_name: user_data.user_name, phone: user_data.phone, email: user_data.email, agentId: user_data.agent == "" ? null : user_data.agent
                }, where: { id: user_data.id },
            });
            return res.status(201).send({ status: 201, error: false, message: 'Infos utilisateur modifiés', data: { id: updatedUser.id } });
        }
        catch (err) {
            console.error(`Error while registering ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports._update = _update;
function updateuser(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user_schema = zod_1.z.object({
                user_name: zod_1.z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
                phone: zod_1.z.string(),
                profile_picture: zod_1.z.string(),
                role: zod_1.z.string().default('customer')
            });
            const validation_result = user_schema.safeParse(req.body);
            if (!validation_result.success) {
                console.log((0, zod_validation_error_1.fromZodError)(validation_result.error));
                return res.status(400).send({ status: 400, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, error: true });
            }
            let user_data = Object.assign(Object.assign({}, validation_result.data), { is_admin: false });
            user_data.profile_picture = (_a = user_data.profile_picture) !== null && _a !== void 0 ? _a : "";
            yield server_1.prisma.user.update({
                data: {
                    user_name: user_data.user_name,
                    profile_picture: user_data.profile_picture,
                    role: user_data.role
                },
                where: { phone: user_data.phone, },
                include: { agent: true }
            });
            return res.status(201).send({ status: 201, error: false, message: 'Modification réussie', data: {} });
        }
        catch (err) {
            console.error(`Error while registering ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.updateuser = updateuser;
function update_password(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                old: zod_1.z.string(),
                new: zod_1.z.string().nonempty("Veuillez renseigner un mot de passe").min(6, "Votre mot de passe est court"),
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message });
            const { data } = validation_result;
            const { user: current_user } = req.body.user;
            const targetted_user = yield server_1.prisma.user.findUnique({ where: { phone: current_user.phone }, include: { agent: current_user.role == "customer" ? true : false } });
            if (!targetted_user)
                return res.status(404).send({ status: 404, error: true, message: "Utilisateur non trouve" });
            if (!(0, utils_1.password_is_valid)(data.old, targetted_user.password))
                return res.status(400).send({ status: 404, error: false, message: "Mot de passe invalide" });
            yield server_1.prisma.user.update({ where: { phone: targetted_user.phone }, data: { password: (0, utils_1.hash_pwd)(data.new), first_login: false, } });
            let { password, finance_pro_id, is_verified } = targetted_user, user_data = __rest(targetted_user, ["password", "finance_pro_id", "is_verified"]);
            const token = (0, utils_1.sign_token)(Object.assign({}, user_data));
            return res.status(200).send({ status: 200, error: false, message: "Mot de passe modifié", data: Object.assign(Object.assign({}, targetted_user), { token }) });
        }
        catch (err) {
            console.log(`Error while changing user password ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.update_password = update_password;
function set_financepro_id(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                agentId: zod_1.z.string(),
                user_id: zod_1.z.string(),
            });
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ status: 400, error: true, message: JSON.parse(validation_result.error.message) });
            const { agentId, user_id } = validation_result.data;
            const targetted_user = yield server_1.prisma.user.findUnique({ where: { id: user_id } });
            if (!targetted_user)
                return res.status(400).send({ status: 400, error: true, message: "Utilisateur non  trouve", data: {} });
            yield server_1.prisma.user.update({ where: { id: targetted_user.id }, data: { is_verified: true, agentId: agentId } });
            return res.status(200).send({ status: 200, error: false, message: "sucess", data: {} });
        }
        catch (err) {
            console.error(`Error while setting user Financepro id ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.set_financepro_id = set_financepro_id;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const login_schema = zod_1.z.object({
                email_or_phone: zod_1.z.string(),
                password: zod_1.z.string(),
            });
            const validation_result = login_schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, data: {} });
            const login_data = validation_result.data;
            const targetted_users = yield server_1.prisma.user.findMany({
                where: { OR: [{ email: login_data.email_or_phone, }, { phone: login_data.email_or_phone }], }, include: { agent: true }
            });
            if (!targetted_users.length || targetted_users.length > 1 || !(0, utils_1.password_is_valid)(login_data.password, targetted_users[0].password))
                return res.status(404).send({ status: 404, error: true, message: "Identifiants incorrects", data: {} });
            let targetted_user = targetted_users[0];
            if (!(0, utils_1.password_is_valid)(login_data.password, targetted_user.password))
                return res.status(400).send({ status: 400, error: true, message: "Mot de passe incorrect", data: {} });
            let { password, finance_pro_id, is_verified } = targetted_user, user_data = __rest(targetted_user, ["password", "finance_pro_id", "is_verified"]);
            const token = (0, utils_1.sign_token)(Object.assign({}, user_data));
            return res.status(200).send({ status: 200, error: false, message: "Connecté avec succès", data: Object.assign(Object.assign({}, targetted_user), { token }) });
        }
        catch (err) {
            console.error(`Error while loging in ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.login = login;
// Déconnexion suppression de device token
function logout(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body.user;
            let targettedUser = yield server_1.prisma.user.findUnique({ where: { id: user.id } });
            if (!targettedUser)
                return res.status(404).send({ error: true, message: "User not found" });
            let updatedUser = yield server_1.prisma.user.update({ where: { id: targettedUser.id }, data: { device_token: "" } });
            return res.status(200).send({ data: updatedUser, error: false, status: 200 });
        }
        catch (err) {
            throw err;
        }
    });
}
exports.logout = logout;
function updateUserDeviceToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ device_token: zod_1.z.string() });
            const { user } = req.body.user;
            const validation_result = schema.safeParse(req.body);
            if (!validation_result.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).details[0].message, data: {} });
            let targettedUser = yield server_1.prisma.user.findUnique({ where: { id: user.id }, include: { agent: true } });
            if (!targettedUser)
                return res.status(404).send({ error: true, message: "User not found" });
            let updatedUser = yield server_1.prisma.user.update({ where: { id: targettedUser.id }, data: { device_token: validation_result.data.device_token }, include: { agent: true } });
            const token = (0, utils_1.sign_token)(Object.assign({}, updatedUser));
            return res.status(200).send({ error: false, message: "Device token modifié", data: Object.assign(Object.assign({}, updatedUser), { token: token }) });
        }
        catch (e) {
            console.log(e);
        }
    });
}
exports.updateUserDeviceToken = updateUserDeviceToken;
function create_admin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data_schema = zod_1.z.object({
                user_name: zod_1.z.string().min(5, "Veuillez indiquez un nom complet").nonempty("Veuillez renseigner votre nom complet"),
                email: zod_1.z.string().email("L'adresse email est invalide"),
                phone: zod_1.z.string().min(8, "Numéro de téléphone invalide").max(8, "Numéro de téléphone invalide").startsWith('9' || '7', "Numéro de téléphone invalide").nonempty("Veuillez renseigner un numéro de téléphone"),
                password: zod_1.z.string().min(6, "Votre mot de passe est court").nonempty("Veuillez renseigner un mot de passe"),
                profile_picture: zod_1.z.string(),
            });
            const validation_result = data_schema.safeParse(req.body);
            // if (!validation_result.success) return res.status(400).send({ status: 400, error: true, message: fromZodError(validation_result.error).details[0].message })
            if (!validation_result.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation_result.error).message });
            const admin_data = Object.assign(Object.assign({}, validation_result.data), { password: (0, utils_1.hash_pwd)(validation_result.data.password), role: 'admin', is_admin: true });
            const potential_duplicate = yield server_1.prisma.user.findUnique({ where: { email: admin_data.email } });
            if (potential_duplicate)
                return res.status(409).send({ status: 409, error: true, message: "Email deja en cours d'utilisation" });
            yield server_1.prisma.user.create({ data: admin_data });
            return res.status(201).send({ status: 201, error: false, message: "Nouveau compte admin crée" });
        }
        catch (err) {
            console.error(`Error while creating admin ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.create_admin = create_admin;
function get_all_users(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield server_1.prisma.user.findMany();
            return res.status(200).send({ status: 200, error: false, data: { users: data } });
        }
        catch (err) {
            console.log(`Error while getting list of all users ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_all_users = get_all_users;
function get_customer(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = _req.params.userid;
            if (!userId)
                return res.status(400).send({ error: true, message: "User Id is needed", data: {} });
            const data = yield server_1.prisma.user.findUnique({ where: { id: userId } });
            return res.status(200).send({ status: 200, error: false, data });
        }
        catch (err) {
            console.log(`Error while getting list of customers ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_customer = get_customer;
function get_customers(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ status: zod_1.z.string().default("activated") });
            const validation = schema.safeParse(_req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const schemaData = validation.data;
            const status = schemaData.status == "activated" ? true : false;
            const data = yield server_1.prisma.user.findMany({ where: { role: "customer", is_verified: status } });
            return res.status(200).send({ status: 200, error: false, data: { customers: data } });
        }
        catch (err) {
            console.log(`Error while getting list of customers ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_customers = get_customers;
function get_agents(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield server_1.prisma.user.findMany({ where: { role: "agent" } });
            return res.status(200).send({ status: 200, error: false, data: { agents: data } });
        }
        catch (err) {
            console.log(`Error while getting list of agents ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_agents = get_agents;
function get_deliverypersons(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield server_1.prisma.user.findMany({ where: { role: "delivery_man" } });
            return res.status(200).send({ status: 200, error: false, data: { persons: data } });
        }
        catch (err) {
            console.log(`Error while getting list of deliverypersons ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_deliverypersons = get_deliverypersons;
function get_agent_customers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ agent: zod_1.z.string() });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const data = yield server_1.prisma.user.findMany({
                where: { role: "customer", agentId: validation.data.agent, is_verified: true },
                include: { Book: { where: { status: "opened", sheets: { some: { status: "opened", } } } } }
            });
            return res.status(200).send({ error: false, message: "ok", data: { customers: data } });
        }
        catch (err) {
            console.log(`Error while getting list of customers ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_agent_customers = get_agent_customers;
function get_agent_customers_locations(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ agent: zod_1.z.string(), lat: zod_1.z.number(), lng: zod_1.z.number() });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const data = yield server_1.prisma.user.findMany({
                where: { role: "customer", agentId: validation.data.agent, is_verified: true, location: { not: null } }
            });
            let users = yield (0, utils_1.userWithDistanceFilter)(data, validation.data.lng, validation.data.lat);
            return res.status(200).send({ status: 200, error: false, data: { customers: users } });
        }
        catch (err) {
            console.log(`Error while getting list of customers ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.get_agent_customers_locations = get_agent_customers_locations;
function disable_user(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({ userid: zod_1.z.string() });
            const validation = schema.safeParse(req.params);
            if (!validation.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const user = yield server_1.prisma.user.findUnique({ where: { id: validation.data.userid } });
            if (!user)
                return res.status(404).send({ error: true, message: "User not found", data: {} });
            const data = yield server_1.prisma.user.update({
                where: { id: user.id }, data: { is_verified: false, agentId: null }
            });
            return res.status(200).send({ status: 200, error: false, data });
        }
        catch (err) {
            console.log(`Error while getting list of customers ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "erreur s'est produite", data: {} });
        }
    });
}
exports.disable_user = disable_user;
