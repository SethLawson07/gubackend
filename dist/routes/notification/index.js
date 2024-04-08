"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Notification_1 = require("../../services/Notification");
const middlewares_1 = require("../../utils/middlewares");
const router = (0, express_1.Router)();
router.route("/send").post(Notification_1.sendNotification);
router.route("/sendtopic").post(middlewares_1.Auth, middlewares_1.UserIsAdmin, Notification_1.sendToTopic);
exports.default = router;
