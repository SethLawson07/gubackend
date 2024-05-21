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
exports.all = exports.addOrderProduct = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addOrderProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                userId: zod_1.z.string(),
                productId: zod_1.z.string(),
                qte: zod_1.z.number(),
                amount: zod_1.z.string(),
                paymentstatus: zod_1.z.boolean(),
                delivery: zod_1.z.boolean(),
                brand: zod_1.z.string(),
                description: zod_1.z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedOrderProduct = yield server_1.prisma.orderProduct.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedOrderProduct });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.addOrderProduct = addOrderProduct;
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const all = yield server_1.prisma.orderProduct.findMany({ orderBy: { createdat: 'desc' } });
            return res.status(200).send({ error: false, message: "ok", data: all });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.all = all;
