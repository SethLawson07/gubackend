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
exports.deleteSlider = exports.updateSlider = exports.slider = exports.active = exports.all = exports.addSlider = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addSlider(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                file: zod_1.z.string(),
                type: zod_1.z.string(),
                link: zod_1.z.string(),
                position: zod_1.z.string(),
                featured: zod_1.z.boolean().optional()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedSlider = yield server_1.prisma.slider.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSlider });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.addSlider = addSlider;
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const all = yield server_1.prisma.slider.findMany();
            return res.status(200).send({ error: false, message: "ok", data: all });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.all = all;
function active(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const active = yield server_1.prisma.slider.findMany({ where: { featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: active });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.active = active;
function slider(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let position = req.params.position;
            const slider = yield server_1.prisma.slider.findFirst({ orderBy: { createdat: 'desc' }, where: { position: position, featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: slider });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.slider = slider;
function updateSlider(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                file: zod_1.z.string(),
                type: zod_1.z.string(),
                link: zod_1.z.string(),
                position: zod_1.z.string(),
                featured: zod_1.z.boolean().optional()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedSlider = yield server_1.prisma.slider.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedSlider });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.updateSlider = updateSlider;
function deleteSlider(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const slider = yield server_1.prisma.slider.delete({ where: { id: id } });
            return res.status(200).send({ error: false, message: "ok", data: slider });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.deleteSlider = deleteSlider;
