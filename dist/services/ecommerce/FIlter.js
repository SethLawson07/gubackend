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
exports.allByItem = exports.updateFilter = exports.addFilter = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addFilter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                title: zod_1.z.string(),
                name: zod_1.z.string(),
                options: zod_1.z.array(zod_1.z.object({
                    value: zod_1.z.string(),
                    label: zod_1.z.string(),
                    checked: zod_1.z.boolean()
                })).optional(),
                custom: zod_1.z.boolean(),
                itemId: zod_1.z.string()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedFilter = yield server_1.prisma.filters.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedFilter });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.addFilter = addFilter;
function updateFilter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                options: zod_1.z.array(zod_1.z.object({
                    value: zod_1.z.string(),
                    label: zod_1.z.string(),
                    checked: zod_1.z.boolean()
                })),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedFilter = yield server_1.prisma.filters.update({ where: { id: id }, data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedFilter });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.updateFilter = updateFilter;
function allByItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let slugitem = req.params.slugitem;
            const item = yield server_1.prisma.item.findUnique({ where: { slugitem: slugitem } });
            const all = yield server_1.prisma.filters.findMany({ where: { itemId: item === null || item === void 0 ? void 0 : item.id } });
            return res.status(200).send({ error: false, message: "ok", data: item !== null ? all : [] });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.allByItem = allByItem;
