"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const orderproduct_1 = require("../../services/ecommerce/orderproduct");
const router = (0, express_1.Router)();
router.route("/add").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, orderproduct_1.addOrderProduct);
router.route("/all").get(middlewares_1.Auth, middlewares_1.UserIsAdmin, orderproduct_1.all);
exports.default = router;
