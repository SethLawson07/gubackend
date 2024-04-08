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
exports.semoaCashPayGateway = exports.operatorChecker = exports.gateways = exports.sendNotificationToTopic = exports.sendPushNotification = exports.allContributions = exports.userAgentContributions = exports.customerContributions = exports.todateTime = exports.todate = exports.update_case = exports.close_sheets = exports.sheet_contribute_mobile = exports.sheet_reject = exports.sheet_validate = exports.sheet_cases_validate = exports.sheet_case_reference = exports.sheet_validation = exports.sheet_contribute = exports.update_sheets = exports.sheet_to_close = exports.sheet_to_open = exports.empty_case = exports.opened_sheet = exports.opened_book = exports.create_cases = exports.create_sheets = exports.geneObjectId = exports.utilsIsFloat = exports.utilisIsInt = exports.checkDriverBalance = exports.userWithDistanceFilter = exports.verify_token = exports.sign_token = exports.firsttwonumbersmoovafricaArray = exports.firsttwonumberstogocomArray = exports.randomUniqueInteger = exports.password_is_valid = exports.hash_pwd = exports.verboseFormat = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const server_1 = require("../server");
const bson_1 = require("bson");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const goodpay_86d48_c5c79b945b8f_json_1 = __importDefault(require("../token/goodpay-86d48-c5c79b945b8f.json"));
const dayjs_1 = __importDefault(require("dayjs"));
exports.verboseFormat = ':remote-addr :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';
const firebaseServiceAccountParams = {
    type: goodpay_86d48_c5c79b945b8f_json_1.default.type,
    projectId: goodpay_86d48_c5c79b945b8f_json_1.default.project_id,
    privateKeyId: goodpay_86d48_c5c79b945b8f_json_1.default.private_key_id,
    privateKey: goodpay_86d48_c5c79b945b8f_json_1.default.private_key,
    clientEmail: goodpay_86d48_c5c79b945b8f_json_1.default.client_email,
    clientId: goodpay_86d48_c5c79b945b8f_json_1.default.client_id,
    authUri: goodpay_86d48_c5c79b945b8f_json_1.default.auth_uri,
    tokenUri: goodpay_86d48_c5c79b945b8f_json_1.default.token_uri,
    authProviderX509CertUrl: goodpay_86d48_c5c79b945b8f_json_1.default.auth_provider_x509_cert_url,
    clientC509CertUrl: goodpay_86d48_c5c79b945b8f_json_1.default.client_x509_cert_url,
    universeDomain: goodpay_86d48_c5c79b945b8f_json_1.default.universe_domain
};
firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(firebaseServiceAccountParams) });
const JWT_TOKEN = "goodnessunitsupertoken";
const salt_rounds = 10;
function hash_pwd(plain_text_password) {
    return bcrypt_1.default.hashSync(plain_text_password, salt_rounds);
}
exports.hash_pwd = hash_pwd;
function password_is_valid(plain_text_password, db_hash) {
    return bcrypt_1.default.compareSync(plain_text_password, db_hash);
}
exports.password_is_valid = password_is_valid;
const randomUniqueInteger = () => {
    return Math.floor(Math.random() * Math.floor(Math.random() * Date.now())) + (Date.now() * 3);
};
exports.randomUniqueInteger = randomUniqueInteger;
exports.firsttwonumberstogocomArray = ["90", "91", "92", "93", "70"];
exports.firsttwonumbersmoovafricaArray = ["96", "97", "98", "99"];
function sign_token(user) {
    return jwt.sign({ user }, JWT_TOKEN);
}
exports.sign_token = sign_token;
function verify_token(token) {
    try {
        const { user } = jwt.verify(token, JWT_TOKEN);
        return { user, is_admin: user.is_admin };
    }
    catch (err) {
        console.error(`Error while verifying token ${err}`);
        return "";
    }
}
exports.verify_token = verify_token;
// export async function generate_payment_link(amount: number, user: string, order_id: string) {
//     const transaction_id = crypto.randomUUID()
//     const data = {
//         "apikey": "25443723563ef760b99c2b5.76392442",
//         "site_id": "636165",
//         "transaction_id": transaction_id,
//         "amount": amount,
//         "currency": "XOF",
//         "description": "Reglement de commande",
//         "customer_id": user,
//         "notify_url": `https://goodness-1e5ee24644b9.herokuapp.com/hook/payment_event/${order_id}`,
//         "return_url": "https://google.com",
//         "channels": "ALL",
//         "lang": "FR"
//     }
//     const payment_request_response = await axios.post(
//         "https://api-checkout.cinetpay.com/v2/payment",
//         data
//     ).then(res => {
//         if (res.status !== 200) {
//             console.log(`Error while getting payment url`);
//             return { status: false, url: "" };
//         }
//         const response = res.data as { data: { payment_url: string } };
//         return { status: true, url: response.data.payment_url };
//     })
//     return payment_request_response;
// }
// Calculate distance between points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(3);
};
const userWithDistanceFilter = (users, aLng, aLat) => __awaiter(void 0, void 0, void 0, function* () {
    const userWithDistances = users.map((user) => (Object.assign(Object.assign({}, user), { distance: calculateDistance(aLat, aLng, parseFloat(user.location.split("|")[0]), parseFloat(user.location.split("|")[1])) })));
    return userWithDistances.sort((a, b) => a.distance - b.distance);
});
exports.userWithDistanceFilter = userWithDistanceFilter;
const checkDriverBalance = (driver) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield server_1.prisma.account.findFirst({ where: { userId: driver.id } });
    return !!(account && account.balance > 3000);
});
exports.checkDriverBalance = checkDriverBalance;
function utilisIsInt(n) {
    return Number(n) === n && n % 1 === 0;
}
exports.utilisIsInt = utilisIsInt;
function utilsIsFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}
exports.utilsIsFloat = utilsIsFloat;
function geneObjectId() { return (new bson_1.ObjectId()).toString(); }
exports.geneObjectId = geneObjectId;
const create_sheets = (book, bet, date) => {
    return Array.from({ length: 12 }, (_, index) => {
        const sheetId = geneObjectId();
        const sheet = {
            id: sheetId, createdAt: date, cases: create_cases(sheetId), bet: bet, book: book.id, status: "notopened", index: index,
        };
        return sheet;
    });
};
exports.create_sheets = create_sheets;
function create_cases(sheet) {
    return Array.from({ length: 31 }, (_, index) => {
        const _case = {
            id: geneObjectId(), contributionStatus: "unpaid", sheet: sheet, index: index,
        };
        return _case;
    });
}
exports.create_cases = create_cases;
// Carnet ouvert
function opened_book(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const book = yield server_1.prisma.book.findFirst({ where: { userId: userId, status: "opened" } });
        if (!book)
            return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
        return { error: false, message: "ok", book: true, data: book };
    });
}
exports.opened_book = opened_book;
// Feuille ouverte
function opened_sheet(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null };
        var sheetOpened = book.data.sheets.find((st) => st.status === "opened");
        if (!sheetOpened)
            return { error: true, message: "Aucune feuille ouverte", book: true };
        return { error: false, message: "", data: sheetOpened, book: true };
    });
}
exports.opened_sheet = opened_sheet;
// Case remplie
function empty_case(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null };
        var lastContributedCase;
        var sheetOpened = book.data.sheets.find((st) => st.status === "opened");
        if (!sheetOpened)
            return { error: true, message: "Aucune feuille ouverte" };
        // const lctCase = sheetOpened.cases.findLast(cse => cse.contributionStatus == ("paid" || "awaiting")); // lct for LastContributedCase
        const lctCase = sheetOpened.cases.find(cse => cse.contributionStatus == "unpaid"); // lct for LastContributedCase || First unpaid case
        if (!lctCase || lctCase == undefined) {
            if (sheetOpened.cases[30].contributionStatus == "paid" || "awaiting") {
                sheetOpened.cases[30].index = 31; // Fake case Index (Just for bypass verification ...)
                lastContributedCase = sheetOpened.cases[30];
            }
            else
                lastContributedCase = sheetOpened.cases[0];
        }
        else
            lastContributedCase = sheetOpened.cases[lctCase.index];
        return { error: false, data: lastContributedCase };
    });
}
exports.empty_case = empty_case;
// Feuille à ouvrir
function sheet_to_open(user) {
    return __awaiter(this, void 0, void 0, function* () {
        var book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null };
        if (!book)
            return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
        var sheetToOpen;
        const findLastClosedSheet = book.data.sheets.findLast((st) => st.status === "closed");
        if (!findLastClosedSheet) {
            sheetToOpen = book.data.sheets[0];
        }
        else {
            if (findLastClosedSheet.index == 11) {
                yield server_1.prisma.book.update({ where: { id: book.data.id }, data: { status: "closed" } });
                return { error: false, message: "Fin de feuille", book: null };
            }
            else {
                sheetToOpen = book.data.sheets[findLastClosedSheet.index + 1];
            }
        }
        return { error: false, message: "ok", data: sheetToOpen, book: true };
    });
}
exports.sheet_to_open = sheet_to_open;
function sheet_to_close(user) {
    return __awaiter(this, void 0, void 0, function* () {
        var book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, data: null };
        const sheetToClose = book.data.sheets.find((st) => st.status === "opened");
        if (!sheetToClose)
            return { error: true, message: "Aucune feuille ouverte", book: null, data: null };
        return { error: false, message: "ok", book: null, data: sheetToClose };
    });
}
exports.sheet_to_close = sheet_to_close;
// Open sheet
function update_sheets(user, openedat, bet) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = false;
        let message = "";
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const sheetToOpen = yield sheet_to_open(user);
        if (sheetToOpen.error || sheetToOpen.data == null)
            return { error: true, message: sheetToOpen.message, book: true, update_sheets: null };
        const sheet = sheetToOpen.data;
        let updated_sheets = sheets;
        let sheetToOpenIndex = sheets.findIndex(e => e.id === sheet.id);
        if (sheet) {
            if (sheetToOpenIndex == 0) {
                if (sheet.status == "opened")
                    return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
                sheet.status = "opened";
                sheet.openedAt = new Date(openedat);
                sheet.bet = bet;
            }
            else {
                switch (sheets[sheetToOpenIndex - 1].status) {
                    case "notopened": return { error: true, message: "Feuille actuelle non ouverte | Erreur fatale", book: true, update_sheets: null, data: {} };
                    case "opened": return { error: true, message: "Feuille actuelle non bloquée", book: true, update_sheets: null, data: {} };
                    case "closed": if (sheetToOpenIndex > 11) {
                        return { error: true, message: "Vous êtes sur la dernière feuille", book: true, update_sheets: null, data: {} };
                    }
                    else {
                        sheet.status = "opened";
                        sheet.openedAt = new Date(openedat);
                        sheet.bet = bet;
                    }
                    default: break;
                }
            }
        }
        else {
            return { error: true, message: "Ouverture de feuille impossible", book: true, update_sheets: null, data: {} };
        }
        updated_sheets[sheetToOpenIndex] = sheet;
        return { error, message, updated_sheets, book: true, sheet };
    });
}
exports.update_sheets = update_sheets;
// Update sheet for contribution (Method: agent)
function sheet_contribute(userid, amount, pmethod) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = (yield server_1.prisma.user.findUnique({ where: { id: userid } }));
        const status = pmethod === "agent" ? "awaiting" : "paid";
        let error = false;
        let message = "";
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const openedSheet = yield sheet_to_open(user);
        if (openedSheet.error || openedSheet.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null, sheet: null };
        const sheet = openedSheet.data;
        let updated_sheets = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        const emptycase = (yield empty_case(user)).data;
        var nbCases = amount / sheet.bet;
        if (!utilisIsInt(nbCases))
            return { error: true, message: "Montant saisie invalide", };
        const awCases = sheet.cases.filter((cse) => cse.contributionStatus == "awaiting");
        if (emptycase.index == 31 && awCases.length > 0)
            return { error: true, message: "Feuille remplie, Cotisations en cours de validation." };
        if (sheet.index == 11 && emptycase.index == 31)
            return { error: true, message: "Le carnet est remplie", isBookFull: true };
        if (emptycase.index == 31)
            return { error: true, message: "La feuille est remplie", isSheetFull: true };
        if (emptycase.index + nbCases > 31)
            return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)` };
        let cases = [];
        for (let i = 0; i < nbCases; i++) {
            sheet.cases[i + emptycase.index].contributionStatus = status;
            cases.push((emptycase.index + i));
        }
        ;
        updated_sheets[sheetIndex] = sheet;
        return { error, message, updated_sheets, cases, sheet, sheetId: sheet.id, book };
    });
}
exports.sheet_contribute = sheet_contribute;
// Check for empty cases
function sheet_validation(userid, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = (yield server_1.prisma.user.findUnique({ where: { id: userid } }));
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const openedSheet = yield sheet_to_open(user);
        if (openedSheet.error || openedSheet.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
        const sheet = openedSheet.data;
        let updated_sheets = sheets;
        const emptycase = (yield empty_case(user)).data;
        var nbCases = amount / sheet.bet;
        if (!utilisIsInt(nbCases))
            return { error: true, message: "Montant saisie invalide", data: {} };
        if (sheet.index == 11 && emptycase.index == 31)
            return { error: true, message: "Le carnet est remplie", isBookFull: true, data: {} };
        if (emptycase.index == 31)
            return { error: true, message: "La feuille est remplie", isSheetFull: true, data: {} };
        if (emptycase.index + nbCases > 31)
            return { error: true, message: `Il ne reste plus que ${31 - emptycase.index} case(s)`, data: {} };
        return { error: false, message: "ok", updated_sheets, cases: [], sheet };
    });
}
exports.sheet_validation = sheet_validation;
function sheet_case_reference(status, sheet) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        let referenceBox = undefined;
        switch (status) {
            case "paid":
                referenceBox = (_a = sheet.cases.find((cs) => cs.contributionStatus == "awaiting")) === null || _a === void 0 ? void 0 : _a.index;
                break;
            case "unpaid":
                referenceBox = (_b = sheet.cases.findLast((cs) => cs.contributionStatus == "awaiting")) === null || _b === void 0 ? void 0 : _b.index;
                break;
            case "awaiting":
                referenceBox = (_c = sheet.cases.find((cs) => cs.contributionStatus == "unpaid")) === null || _c === void 0 ? void 0 : _c.index;
                break;
            default: referenceBox = 0;
        }
        return referenceBox;
    });
}
exports.sheet_case_reference = sheet_case_reference;
function sheet_cases_validate(status, reference, sheet, size) {
    return __awaiter(this, void 0, void 0, function* () {
        let update_sheet = sheet;
        switch (status) {
            case "paid":
                {
                    for (let i = 0; i < size; i++)
                        update_sheet.cases[reference + i].contributionStatus = "paid";
                    break;
                }
                ;
            case "unpaid":
                {
                    const lg = reference - size + 1;
                    console.log(reference);
                    console.log(size);
                    console.log(lg);
                    // if (lg > 0) 
                    // else { update_sheet.cases[0].contributionStatus = "unpaid"; }
                    for (let i = 0; i < size; i++) {
                        update_sheet.cases[lg + i].contributionStatus = "unpaid";
                    }
                    ;
                    break;
                }
                ;
            // case "awaiting": referenceBox = sheet.cases.findIndex((cs) => cs.contributionStatus == "unpaid"); break;
            default: update_sheet = sheet;
        }
        return update_sheet;
    });
}
exports.sheet_cases_validate = sheet_cases_validate;
// Update sheet for contribution (Method: agent)
function sheet_validate(user, cases, status) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = false;
        let message = "";
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const openedSheet = yield sheet_to_open(user);
        if (openedSheet.error || openedSheet.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
        let sheet = openedSheet.data;
        let updated_sheets = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        if (status == "awaiting") {
            ;
        }
        else {
            const reference = yield sheet_case_reference(status, sheet);
            sheet = yield sheet_cases_validate(status, reference, sheet, cases.length);
            // for (let i = 0; i < cases.length; i++) sheet.cases[cases[i] - 1].contributionStatus = status;
        }
        updated_sheets[sheetIndex] = sheet;
        return { error, message, updated_sheets, cases, sheet, book };
    });
}
exports.sheet_validate = sheet_validate;
// Update sheet for contribution (Method: agent)
function sheet_reject(user, cases) {
    return __awaiter(this, void 0, void 0, function* () {
        const book = yield opened_book(user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const openedSheet = yield sheet_to_open(user);
        if (openedSheet.error || openedSheet.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
        let sheet = openedSheet.data;
        let updated_sheets = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        const reference = yield sheet_case_reference("unpaid", sheet);
        sheet = yield sheet_cases_validate("unpaid", reference, sheet, cases.length);
        // for (let i = 0; i < cases.length; i++) sheet.cases[cases[i] - 1].contributionStatus = "rejected";
        updated_sheets[sheetIndex] = sheet;
        return { error: false, message: "Rejeté", updated_sheets, cases, sheet, book };
    });
}
exports.sheet_reject = sheet_reject;
// Method: Mobile money
// Update sheet for contribution (Agent)
function sheet_contribute_mobile(user, amount, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const targeted_user = yield server_1.prisma.user.findUnique({ where: { id: user } });
        let error = false;
        let message = "";
        const book = yield opened_book(targeted_user.id);
        if (book.error || !book.book || !book.data)
            return { error: true, message: "Pas de carnet ouvert", book: null, update_sheets: null };
        const sheets = book.data.sheets;
        const openedSheet = yield sheet_to_open(targeted_user);
        if (openedSheet.error || openedSheet.data == null)
            return { error: true, message: "Aucune feuille ouverte", book: null, update_sheets: null };
        const sheet = openedSheet.data;
        let updated_sheets = sheets;
        let sheetIndex = sheets.findIndex(e => e.id === sheet.id);
        const emptycase = (yield empty_case(targeted_user)).data;
        var nbCases = amount / sheet.bet;
        if (!utilisIsInt(nbCases))
            return { error: true, message: "Montant saisie invalide" };
        var targetdIndex = emptycase.index == 0 ? emptycase.index : emptycase.index + 1;
        // for (let i = 0; i < nbCases; i++) sheet.cases[i + targetdIndex].contributionStatus = status;
        for (let i = 0; i < nbCases; i++)
            sheet.cases[i + emptycase.index].contributionStatus = status;
        updated_sheets[sheetIndex] = sheet;
        return { error, message, updated_sheets };
    });
}
exports.sheet_contribute_mobile = sheet_contribute_mobile;
function close_sheets(sheets, sheetid, closeat, reason) {
    let error = false;
    let message = "";
    let updated_sheets = sheets;
    let sheet = sheets.find(st => st.id === sheetid);
    let sheetIndex = sheets.findIndex(e => e.id === sheetid);
    if (sheet && sheet.status == "opened") {
        sheet.status = "opened";
        sheet.closeAt = new Date(closeat);
        sheet.closeReason = reason;
    }
    else {
        error = true, message = "La feuille ne peut pas être bloquée";
    }
    updated_sheets[sheetIndex] = sheet;
    return { error, message, updated_sheets };
}
exports.close_sheets = close_sheets;
function update_case(sheets, sheetid, caseid, status) {
    let error = false;
    let message = "";
    let updated_sheets = sheets;
    let sheet = sheets.find(st => st.id === sheetid);
    let sheetIndex = sheets.findIndex(e => e.id === sheetid);
    if (sheet && sheet.status == "opened") {
        let _case = sheet.cases.find(c_s => c_s.id === caseid);
        let _caseIndex = sheet.cases.findIndex(e => e.id === caseid);
        if (_case && _case.contributionStatus == "unpaid") {
            _case.contributionStatus = status;
            sheet.cases[_caseIndex] = _case;
        }
        else {
            error = true, message = "Already updated";
        }
    }
    else {
        error = true, message = "Vous ne pouvez pas cotiser pour cette feuille";
    }
    updated_sheets[sheetIndex] = sheet;
    return { error, message, updated_sheets };
}
exports.update_case = update_case;
// Timestamp from string || Date
function todate(date) {
    return (0, dayjs_1.default)(date).format("YYYY-MM-DD");
}
exports.todate = todate;
function todateTime(date) {
    return (0, dayjs_1.default)(date).format();
}
exports.todateTime = todateTime;
// Customer contributions
function customerContributions(user) {
    return __awaiter(this, void 0, void 0, function* () {
        return server_1.prisma.contribution.findMany({ where: { userId: user.id }, include: { customer: true }, orderBy: { createdAt: "desc" } });
    });
}
exports.customerContributions = customerContributions;
// Agent contributions
function userAgentContributions(user) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield server_1.prisma.contribution.findMany({ where: { agent: user.id }, include: { customer: true }, orderBy: { createdAt: "desc" } });
    });
}
exports.userAgentContributions = userAgentContributions;
// all
function allContributions(data) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(data);
        return yield server_1.prisma.contribution.findMany({
            where: data.userId == "all" ? { status: data.status, createdAt: { gte: data.startDate, lte: data.endDate, } } :
                { userId: data.userId, status: data.status, createdAt: { gte: data.startDate, lte: data.endDate, } }, include: { customer: true }, orderBy: { createdAt: "desc" }
        });
    });
}
exports.allContributions = allContributions;
const notificationdata = {
    "apns": {
        "payload": { "aps": { "contentAvailable": true, }, },
        "headers": {
            "apns-push-type": "background",
            "apns-priority": "5",
            "apns-topic": "io.flutter.plugins.firebase.messaging", // bundle identifier
        },
    },
};
function sendPushNotification(token, title, body) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = false;
        try {
            const payload = Object.assign(Object.assign({}, notificationdata), { notification: { title, body, }, android: { priority: 'high' }, token });
            let message = yield firebase_admin_1.default.messaging().send(payload);
            if (message) {
                result = true;
            }
            ;
        }
        catch (e) {
            console.log(e);
            console.log("Une erreur s'est produite");
            return false;
        }
        return result;
    });
}
exports.sendPushNotification = sendPushNotification;
function sendNotificationToTopic(topic, title, body) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = false;
        try {
            const payload = Object.assign(Object.assign({}, notificationdata), { notification: { title, body }, data: {} });
            let message = yield firebase_admin_1.default.messaging().sendToTopic(topic, payload);
            if (message) {
                result = true;
            }
            ;
        }
        catch (e) {
            console.log(e);
            console.log("Une erreur s'est produite");
            return false;
        }
        return result;
    });
}
exports.sendNotificationToTopic = sendNotificationToTopic;
exports.gateways = {
    "moovmoney": 47,
    "tmoney": 2,
};
const operatorChecker = (phone) => {
    let operator = "moovmoney";
    console.log(phone);
    if (phone.startsWith("+228") || phone.startsWith("228")) {
        const first = phone.replace('228', "").trim().slice(0, 2);
        if (exports.firsttwonumberstogocomArray.includes(first)) {
            operator = "tmoney";
        }
    }
    else if (exports.firsttwonumberstogocomArray.includes(phone.trim().slice(0, 2))) {
        operator = "tmoney";
    }
    return operator;
};
exports.operatorChecker = operatorChecker;
//Check TG Phone Opérator with first Two number
const semoaCashPayGateway = (gateway) => {
    return exports.gateways[gateway];
};
exports.semoaCashPayGateway = semoaCashPayGateway;
