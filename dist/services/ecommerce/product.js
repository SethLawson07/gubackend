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
exports.deleteProduct = exports.updateProduct = exports.oklm = exports.product = exports.allproductsbyitem = exports.active = exports.all = exports.addProduct = void 0;
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const server_1 = require("../../server");
function addProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                title: zod_1.z.string(),
                price: zod_1.z.string(),
                qte: zod_1.z.number(),
                discount: zod_1.z.boolean().optional(),
                discountprice: zod_1.z.string().optional().default(""),
                goodpay: zod_1.z.boolean(),
                goodpayprice: zod_1.z.string(),
                brand: zod_1.z.string().optional(),
                description: zod_1.z.string(),
                spec: zod_1.z.string(),
                keywords: zod_1.z.string(),
                images: zod_1.z.array(zod_1.z.string()),
                itemId: zod_1.z.string(),
                featured: zod_1.z.boolean().optional(),
                slugproduct: zod_1.z.string()
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedProduct = yield server_1.prisma.product.create({ data: validation.data });
            // const savedProduct = await prisma.product.create({ data: validation.data });
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
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.all = all;
function active(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const active = yield server_1.prisma.product.findMany({ where: { featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: active });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.active = active;
function allproductsbyitem(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let slugitem = req.params.slugitem;
            const item = yield server_1.prisma.item.findUnique({ where: { slugitem: slugitem } });
            const all = yield server_1.prisma.product.findMany({ where: { itemId: item === null || item === void 0 ? void 0 : item.id, featured: true } });
            return res.status(200).send({ error: false, message: "ok", data: all });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.allproductsbyitem = allproductsbyitem;
function product(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let slugproduct = req.params.slugproduct;
            const product = yield server_1.prisma.product.findUnique({ where: { slugproduct: slugproduct } });
            return res.status(200).send({ error: false, message: "ok", data: product });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.product = product;
function oklm(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const products = [
                {
                    "id": "1",
                    "sku": "asdf123",
                    "name": "Lorem ipsum jacket",
                    "price": 12.45,
                    "discount": 10,
                    "offerEnd": "October 5, 2024 12:11:00",
                    "new": false,
                    "rating": 4,
                    "saleCount": 54,
                    "category": ["fashion", "men"],
                    "tag": ["fashion", "men", "jacket", "full sleeve"],
                    "variation": [
                        {
                            "color": "white",
                            "image": "/assets/img/product/fashion/1.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 3
                                },
                                {
                                    "name": "m",
                                    "stock": 2
                                },
                                {
                                    "name": "xl",
                                    "stock": 5
                                }
                            ]
                        },
                        {
                            "color": "black",
                            "image": "/assets/img/product/fashion/8.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 4
                                },
                                {
                                    "name": "m",
                                    "stock": 7
                                },
                                {
                                    "name": "xl",
                                    "stock": 9
                                },
                                {
                                    "name": "xxl",
                                    "stock": 1
                                }
                            ]
                        },
                        {
                            "color": "brown",
                            "image": "/assets/img/product/fashion/3.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 1
                                },
                                {
                                    "name": "m",
                                    "stock": 2
                                },
                                {
                                    "name": "xl",
                                    "stock": 4
                                },
                                {
                                    "name": "xxl",
                                    "stock": 0
                                }
                            ]
                        }
                    ],
                    "image": [
                        "/assets/img/product/fashion/1.jpg",
                        "/assets/img/product/fashion/3.jpg",
                        "/assets/img/product/fashion/6.jpg",
                        "/assets/img/product/fashion/8.jpg",
                        "/assets/img/product/fashion/9.jpg"
                    ],
                    "shortDescription": "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
                    "fullDescription": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
                },
                {
                    "id": "2",
                    "sku": "asdf124",
                    "name": "Lorem ipsum coat",
                    "price": 18.5,
                    "discount": 15,
                    "new": false,
                    "rating": 3,
                    "saleCount": 12,
                    "category": ["fashion", "women"],
                    "tag": ["fashion", "women", "coat", "full sleeve"],
                    "variation": [
                        {
                            "color": "blue",
                            "image": "/assets/img/product/fashion/2.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 3
                                },
                                {
                                    "name": "m",
                                    "stock": 6
                                },
                                {
                                    "name": "xl",
                                    "stock": 7
                                }
                            ]
                        },
                        {
                            "color": "brown",
                            "image": "/assets/img/product/fashion/4.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 4
                                },
                                {
                                    "name": "m",
                                    "stock": 8
                                },
                                {
                                    "name": "xl",
                                    "stock": 3
                                },
                                {
                                    "name": "xxl",
                                    "stock": 7
                                }
                            ]
                        },
                        {
                            "color": "black",
                            "image": "/assets/img/product/fashion/5.jpg",
                            "size": [
                                {
                                    "name": "x",
                                    "stock": 3
                                },
                                {
                                    "name": "m",
                                    "stock": 7
                                },
                                {
                                    "name": "xl",
                                    "stock": 0
                                },
                                {
                                    "name": "xxl",
                                    "stock": 7
                                }
                            ]
                        }
                    ],
                    "image": [
                        "/assets/img/product/fashion/2.jpg",
                        "/assets/img/product/fashion/4.jpg",
                        "/assets/img/product/fashion/5.jpg",
                        "/assets/img/product/fashion/7.jpg",
                        "/assets/img/product/fashion/9.jpg"
                    ],
                    "shortDescription": "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
                    "fullDescription": "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
                },
            ];
            return res.status(200).send({ error: false, message: "okokok", data: products });
        }
        catch (err) {
            console.error(` ${err}`);
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.oklm = oklm;
function updateProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let id = req.params.id;
            const schema = zod_1.z.object({
                title: zod_1.z.string(),
                qte: zod_1.z.number(),
                discount: zod_1.z.boolean(),
                discountprice: zod_1.z.string(),
                goodpay: zod_1.z.boolean(),
                goodpayprice: zod_1.z.string(),
                brand: zod_1.z.string(),
                description: zod_1.z.string(),
                keywords: zod_1.z.string(),
                image: zod_1.z.string(),
                itemId: zod_1.z.string(),
            });
            const validation = schema.safeParse(req.body);
            if (!validation.success)
                return res.status(400).send({ status: 400, error: true, message: (0, zod_validation_error_1.fromZodError)(validation.error).message, data: {} });
            const savedProduct = yield server_1.prisma.product.update({ where: { id: id, }, data: validation.data, });
            return res.status(200).send({ status: 200, error: false, message: "ok", data: savedProduct });
        }
        catch (err) {
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
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
            return res.status(500).send({ status: 500, error: true, message: "Une erreur s'est produite", data: {} });
        }
    });
}
exports.deleteProduct = deleteProduct;
