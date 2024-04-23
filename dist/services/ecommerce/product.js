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
exports.deleteProduct = exports.updateProduct = exports.products = exports.topProducts = exports.latest = exports.product = exports.productsByItem = exports.all = exports.addProduct = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                name: zod_1.z.string(),
                qte: zod_1.z.number(),
                price: zod_1.z.string(),
                oldPrice: zod_1.z.string().optional(),
                discount: zod_1.z.string().optional(),
                goodpay: zod_1.z.string().optional(),
                color: zod_1.z.array(zod_1.z.string()).optional(),
                size: zod_1.z.array(zod_1.z.string()).optional(),
                prices: zod_1.z.array(zod_1.z.string()).optional(),
                brand: zod_1.z.string().optional(),
                description: zod_1.z.string(),
                spec: zod_1.z.string(),
                tag: zod_1.z.array(zod_1.z.string()),
                images: zod_1.z.array(zod_1.z.string()),
                itemId: zod_1.z.string(),
                featured: zod_1.z.boolean().optional(),
                slugproduct: zod_1.z.string()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedProduct = yield server_1.prisma.product.create({ data: validation.data });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.addProduct = addProduct;
function all(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const products = yield server_1.prisma.product.findMany();
            return res.status(200).send({ error: false, message: "ok", data: products });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.all = all;
function productsByItem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let slugitem = req.params.slugitem;
            const item = yield server_1.prisma.item.findUnique({ where: { slugitem: slugitem } });
            const all = yield server_1.prisma.product.findMany({ where: { itemId: item === null || item === void 0 ? void 0 : item.id, featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: item !== null ? all : [] });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.productsByItem = productsByItem;
function product(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let slugproduct = req.params.slugproduct;
            const product = yield server_1.prisma.product.findUnique({ where: { slugproduct: slugproduct } });
            return res.status(200).send({ error: false, message: "ok", data: product });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.product = product;
function latest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const products = yield server_1.prisma.product.findMany({
                orderBy: { createdat: 'desc' },
                take: 15, // Limiter les résultats à 15 produits
            });
            return res.status(200).send({ error: false, message: "ok", data: products });
        }
        catch (err) {
            console.error(`${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.latest = latest;
function topProducts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const products = yield server_1.prisma.product.findMany();
            // Mélanger les produits de manière aléatoire
            products.sort(() => Math.random() - 0.5);
            // Sélectionner les trois premiers produits mélangés
            const top = products.slice(0, 12);
            return res.status(200).send({ error: false, message: "ok", data: top });
        }
        catch (err) {
            console.error(`${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.topProducts = topProducts;
function products(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const categories = yield server_1.prisma.category.findMany({ include: { SubCategory: { include: { Item: { include: { Product: true } } } } } });
            // const categories = await prisma.subCategory.findMany({include:{Item:{include:{Product:true}}}})
            return res.status(200).send({ error: false, message: "ok", data: categories });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.products = products;
function updateProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                title: zod_1.z.string().optional(),
                qte: zod_1.z.number().optional(),
                discount: zod_1.z.string().optional(),
                sectionArea: zod_1.z.number().min(1).max(2).optional()
                // discountprice: z.string(),
                // goodpay: z.boolean(),
                // goodpayprice: z.string(),
                // brand: z.string(),
                // description: z.string(),
                // keywords: z.string(),
                // image: z.string(),
                // itemId: z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedProduct = yield server_1.prisma.product.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.updateProduct = updateProduct;
function deleteProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const product = yield server_1.prisma.product.delete({ where: { id: id } });
            return res.status(200).send({ error: false, message: "ok", data: product });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite " + err, data: {} });
        }
    });
}
exports.deleteProduct = deleteProduct;
