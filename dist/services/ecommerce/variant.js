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
exports.updateItemVariant = exports.addItemVariant = exports.addProductVariant = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addProductVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                color: zod_1.z.string(),
                image: zod_1.z.string(),
                size: zod_1.z.object({
                    name: zod_1.z.string(),
                    stock: zod_1.z.number()
                }),
                productId: zod_1.z.string(),
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
function addItemVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                title: zod_1.z.string(),
                itemId: zod_1.z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedVariant = yield server_1.prisma.itemVariant.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedVariant });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.addItemVariant = addItemVariant;
function updateItemVariant(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const variantId = req.params.variantId;
            const newValue = req.body.value; // Nouvelle valeur à ajouter
            // Récupérer le variant existant depuis la base de données
            const existingVariant = yield server_1.prisma.itemVariant.findUnique({ where: { id: variantId } });
            if (!existingVariant)
                return res.status(404).send({ status: 404, error: true, message: "Variant not found", data: {} });
            // Mettre à jour le tableau de valeurs avec la nouvelle valeur
            const updatedValues = [...existingVariant.value, newValue];
            // Valider les nouvelles valeurs
            const schema = zod_1.z.object({
                value: zod_1.z.array(zod_1.z.string()),
            });
            const validation = schema.safeParse({ value: updatedValues });
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            // Mettre à jour le variant avec la nouvelle valeur
            const updatedVariant = yield server_1.prisma.itemVariant.update({
                where: { id: variantId },
                data: { value: updatedValues }
            });
            return res.status(200).send({ status: 200, error: false, message: "Variant updated successfully", data: updatedVariant });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "An error occurred: " + err, data: {} });
        }
    });
}
exports.updateItemVariant = updateItemVariant;
