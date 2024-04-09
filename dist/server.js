"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agenda = exports.prisma = void 0;
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const agenda_1 = __importDefault(require("agenda"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
// Routes
const banner_1 = __importDefault(require("./routes/banner"));
const home_1 = __importDefault(require("./routes/home"));
const books_1 = __importDefault(require("./routes/books"));
const auth_1 = __importDefault(require("./routes/auth"));
const activity_1 = __importDefault(require("./routes/activity"));
const contribution_1 = __importDefault(require("./routes/contribution"));
const deposit_1 = __importDefault(require("./routes/deposit"));
const sheet_1 = __importDefault(require("./routes/sheet"));
const users_1 = __importDefault(require("./routes/users"));
const hook_1 = __importDefault(require("./routes/hook"));
const report_1 = __importDefault(require("./routes/report"));
const account_1 = __importDefault(require("./routes/account"));
const notification_1 = __importDefault(require("./routes/notification"));
//RoutesE-COMMERCE
const brand_1 = __importDefault(require("./routes/ecommerce/brand"));
const category_1 = __importDefault(require("./routes/ecommerce/category"));
const collection_1 = __importDefault(require("./routes/ecommerce/collection"));
const item_1 = __importDefault(require("./routes/ecommerce/item"));
const orderproduct_1 = __importDefault(require("./routes/ecommerce/orderproduct"));
const orderservice_1 = __importDefault(require("./routes/ecommerce/orderservice"));
const product_1 = __importDefault(require("./routes/ecommerce/product"));
const promocode_1 = __importDefault(require("./routes/ecommerce/promocode"));
const service_1 = __importDefault(require("./routes/ecommerce/service"));
const subcategory_1 = __importDefault(require("./routes/ecommerce/subcategory"));
const typeservice_1 = __importDefault(require("./routes/ecommerce/typeservice"));
const slider_1 = __importDefault(require("./routes/ecommerce/slider"));
const variant_1 = __importDefault(require("./routes/ecommerce/variant"));
// App PORT
const PORT = process.env.PORT || 5000;
// Server
const app = (0, express_1.default)();
//
exports.prisma = new client_1.PrismaClient();
// Agenda
exports.agenda = new agenda_1.default();
exports.agenda.database(process.env.DATABASE);
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    var _a;
    const content_type = (_a = req.get("content-type")) !== null && _a !== void 0 ? _a : "";
    if (content_type.startsWith("application/json")) {
        express_1.default.json()(req, res, next);
    }
    else if (content_type.startsWith("application/x-www-form-urlencoded")) {
        express_1.default.urlencoded({ extended: true })(req, res, next);
    }
    else {
        next();
    }
});
app.use((0, morgan_1.default)(utils_1.verboseFormat));
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
// routes
app.use("/auth", auth_1.default);
app.use("/home", home_1.default);
app.use('/account', account_1.default);
app.use("/activity", activity_1.default);
app.use("/book", books_1.default);
app.use("/banner", banner_1.default);
app.use("/contribution", contribution_1.default);
app.use("/deposit", deposit_1.default);
app.use("/report", report_1.default);
app.use("/sheet", sheet_1.default);
app.use("/hook", hook_1.default);
app.use("/users", users_1.default);
app.use('/push', notification_1.default);
//routes E-COMMERCE
app.use('/brand', brand_1.default);
app.use('/category', category_1.default);
app.use('/collection', collection_1.default);
app.use('/item', item_1.default);
app.use('/orderproduct', orderproduct_1.default);
app.use('/orderservice', orderservice_1.default);
app.use('/product', product_1.default);
app.use('/section', promocode_1.default);
app.use('/service', service_1.default);
app.use('/subcategory', subcategory_1.default);
app.use('/typeservice', typeservice_1.default);
app.use('/slider', slider_1.default);
app.use('/variant', variant_1.default);
// Health
app.get("/health", (_req, res) => {
    return res.status(200).send();
});
// App listen
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.prisma.$connect();
        exports.agenda.start();
        console.info("Connected to database");
        console.info(`App listening on ${PORT}`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}));
