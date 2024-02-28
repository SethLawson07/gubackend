var hash = require('hash.js');
import { randomUniqueInteger } from "../utils";

type SemoaApiHeader = {
    login: string,
    apireference: number,
    salt: number,
    apisecure: string,
    'Content-Type': string,
};

export function semoaCashPayHeader(): SemoaApiHeader {
    const apiLogin = process.env.SEMOA_CASHPAY_LOGIN;
    const apiReference = process.env.SEMOA_API_REFERENCE;
    const salt = randomUniqueInteger() + (Date.now());
    const apiKey = process.env.SEMOA_API_KEY;
    const concat = apiLogin! + apiKey + salt;
    const apisecure = hash.sha256().update(concat).digest('hex');
    return {
        login: apiLogin!,
        apireference: parseInt(apiReference!),
        salt: salt,
        apisecure: apisecure,
        'Content-Type': 'application/json'
    };
}

export function semoaProHeader(): SemoaApiHeader {
    const apiLogin = process.env.SEMOA_PRO_LOGIN;
    const apiReference = process.env.SEMOA_API_REFERENCE;
    const salt = randomUniqueInteger() + (Date.now());
    const apiKey = process.env.SEMOA_API_KEY;
    const concat = apiLogin! + apiKey + salt;
    const apisecure = hash.sha256().update(concat).digest('hex');
    return {
        login: apiLogin!,
        apireference: parseInt(apiReference!),
        salt: salt,
        apisecure: apisecure,
        'Content-Type': 'application/json'
    };
}