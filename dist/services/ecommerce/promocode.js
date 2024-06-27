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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePromoCode = exports.updatePromoCode = exports.active = exports.all = exports.applyPromoCode = exports.addPromoCode = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addPromoCode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                name: zod_1.z.string(),
                discountpercentage: zod_1.z.string(),
                expirationdate: zod_1.z.coerce.date(),
                featured: zod_1.z.boolean()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedPromoCode = yield server_1.prisma.promoCode.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedPromoCode });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite op " + err, data: {} });
        }
    });
}
exports.addPromoCode = addPromoCode;
function applyPromoCode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                code: zod_1.z.string(),
                userId: zod_1.z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const promocode = yield server_1.prisma.promoCode.findFirst({ where: { name: validation.data.code } });
            const verifyCodeId = yield server_1.prisma.verifyCode.findFirst({ where: { promoCodeId: promocode === null || promocode === void 0 ? void 0 : promocode.id, userId: validation.data.userId } });
            if (verifyCodeId) {
                return res.status(400).send({ status: 400, error: true, message: "Vous avez déjà utilisé le code promo " + validation.data.code + " !", data: [] });
            }
            else {
                const verifyData = {
                    userId: validation.data.userId,
                    promoCodeId: promocode.id
                };
                const savedVerifyCode = yield server_1.prisma.verifyCode.create({ data: verifyData });
                return res.status(200).send({ status: 200, error: false, message: "Vous venez d'appliquer le code promo " + validation.data.code + " !", data: promocode === null || promocode === void 0 ? void 0 : promocode.discountpercentage });
            }
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite op " + err, data: {} });
        }
    });
}
exports.applyPromoCode = applyPromoCode;
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const all = yield server_1.prisma.promoCode.findMany({ orderBy: { createdat: 'desc' } });
            return res.status(200).send({ error: false, message: "ok", data: all });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite os " + err, data: {} });
        }
    });
}
exports.all = all;
function active(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const active = yield server_1.prisma.promoCode.findMany({ where: { featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: active });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.active = active;
function updatePromoCode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                name: zod_1.z.string(),
                discountpercentage: zod_1.z.string(),
                expirationdate: zod_1.z.coerce.date(),
                featured: zod_1.z.boolean()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedPromoCode = yield server_1.prisma.promoCode.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedPromoCode });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.updatePromoCode = updatePromoCode;
function deletePromoCode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const category = yield server_1.prisma.promoCode.delete({ where: { id: id } });
            return res.status(200).send({ error: false, message: "ok", data: category });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.deletePromoCode = deletePromoCode;
