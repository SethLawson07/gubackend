"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semoaProHeader = exports.semoaCashPayHeader = void 0;
var hash = require('hash.js');
const utils_1 = require("../utils");
function semoaCashPayHeader() {
    const apiLogin = process.env.SEMOA_CASHPAY_LOGIN;
    const apiReference = process.env.SEMOA_API_REFERENCE;
    const salt = (0, utils_1.randomUniqueInteger)() + (Date.now());
    const apiKey = process.env.SEMOA_API_KEY;
    const concat = apiLogin + apiKey + salt;
    const apisecure = hash.sha256().update(concat).digest('hex');
    return {
        login: apiLogin,
        apireference: parseInt(apiReference),
        salt: salt,
        apisecure: apisecure,
        'Content-Type': 'application/json'
    };
}
exports.semoaCashPayHeader = semoaCashPayHeader;
function semoaProHeader() {
    const apiLogin = process.env.SEMOA_PRO_LOGIN;
    const apiReference = process.env.SEMOA_API_REFERENCE;
    const salt = (0, utils_1.randomUniqueInteger)() + (Date.now());
    const apiKey = process.env.SEMOA_API_KEY;
    const concat = apiLogin + apiKey + salt;
    const apisecure = hash.sha256().update(concat).digest('hex');
    return {
        login: apiLogin,
        apireference: parseInt(apiReference),
        salt: salt,
        apisecure: apisecure,
        'Content-Type': 'application/json'
    };
}
exports.semoaProHeader = semoaProHeader;
