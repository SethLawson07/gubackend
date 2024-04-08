"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../../utils/middlewares");
const orderservice_1 = require("../../services/ecommerce/orderservice");
const router = (0, express_1.Router)();
router.route("/add").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, orderservice_1.addOrderService);
router.route("/all").get(middlewares_1.Auth, middlewares_1.UserIsAdmin, orderservice_1.all);
exports.default = router;
