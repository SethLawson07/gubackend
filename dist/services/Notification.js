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
exports.sendToTopic = exports.sendNotification = void 0;
const utils_1 = require("../utils");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
function sendNotification(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                token: zod_1.z.string(),
                title: zod_1.z.string(),
                message: zod_1.z.string(),
            });
            const v_data = schema.safeParse(req.body);
            if (!v_data.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(v_data.error).message });
            let result = yield (0, utils_1.sendPushNotification)(v_data.data.token, v_data.data.title, v_data.data.message);
            // let result = await sendPushNotification(v_data.data.token, "Demande de cotisation", "Le client Lonie er");
            if (!result)
                return res.status(403).send;
            return res.status(200).send();
        }
        catch (e) {
            throw e;
        }
    });
}
exports.sendNotification = sendNotification;
function sendToTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = zod_1.z.object({
                topic: zod_1.z.string(),
                title: zod_1.z.string(),
                message: zod_1.z.string(),
            });
            const v_data = schema.safeParse(req.body);
            if (!v_data.success)
                return res.status(400).send({ error: true, message: (0, zod_validation_error_1.fromZodError)(v_data.error).message });
            let result = yield (0, utils_1.sendNotificationToTopic)(v_data.data.topic, v_data.data.title, v_data.data.message);
            // let result = await sendPushNotification(v_data.data.token, "Demande de cotisation", "Le client Lonie vient de cotiser");
            if (!result)
                return res.status(403).send;
            return res.status(200).send();
        }
        catch (e) {
            throw e;
        }
    });
}
exports.sendToTopic = sendToTopic;
