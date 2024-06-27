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
exports.deleteCollection = exports.updateCollection = exports.active = exports.all = exports.addCollection = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addCollection(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                place: zod_1.z.string(),
                address: zod_1.z.string(),
                lat: zod_1.z.string(),
                long: zod_1.z.string(),
                day: zod_1.z.string(),
                starttime: zod_1.z.string(),
                endtime: zod_1.z.string(),
                price: zod_1.z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedCollection = yield server_1.prisma.collection.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedCollection });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.addCollection = addCollection;
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const all = yield server_1.prisma.collection.findMany();
            return res.status(200).send({ error: false, message: "ok", data: all });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.all = all;
function active(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const active = yield server_1.prisma.collection.findMany({ where: { featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: active });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.active = active;
function updateCollection(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                place: zod_1.z.string(),
                address: zod_1.z.string().optional(),
                lat: zod_1.z.string().optional(),
                long: zod_1.z.string().optional(),
                day: zod_1.z.string(),
                starttime: zod_1.z.string(),
                endtime: zod_1.z.string(),
                price: zod_1.z.string(),
                featured: zod_1.z.boolean()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedCollection = yield server_1.prisma.collection.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedCollection });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.updateCollection = updateCollection;
function deleteCollection(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const collection = yield server_1.prisma.collection.delete({ where: { id: id } });
            return res.status(200).send({ error: false, message: "ok", data: collection });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.deleteCollection = deleteCollection;
