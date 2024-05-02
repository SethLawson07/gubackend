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
exports.deleteVariant = exports.updateVariant = exports.addProductVariant = exports.variantByItem = exports.addVariant = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                title: zod_1.z.array(zod_1.z.string()),
                itemId: zod_1.z.string(),
                featured: zod_1.z.boolean().optional()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedVariant = yield server_1.prisma.variant.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.addVariant = addVariant;
function variantByItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const variants = yield server_1.prisma.variant.findFirst({ where: { itemId: id } });
            return res.status(200).send({ error: false, message: "ok", data: variants });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.variantByItem = variantByItem;
function addProductVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                title: zod_1.z.array(zod_1.z.string()),
                value: zod_1.z.array(zod_1.z.string()),
                productId: zod_1.z.string(),
                featured: zod_1.z.boolean().optional()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedVariant = yield server_1.prisma.productVariant.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.addProductVariant = addProductVariant;
function updateVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                title: zod_1.z.array(zod_1.z.string()),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedVariant = yield server_1.prisma.variant.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.updateVariant = updateVariant;
function deleteVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const variant = yield server_1.prisma.variant.delete({ where: { id: id } });
            return res.status(200).send({ error: false, message: "ok", data: variant });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.deleteVariant = deleteVariant;
