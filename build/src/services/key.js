"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Key = void 0;
const fs_1 = require("fs");
const express = __importStar(require("express"));
const crypto_1 = require("crypto");
const mongodb_1 = require("mongodb");
const express_1 = require("express");
class Key {
    constructor(encryptType, database) {
        this.initRoutes = () => {
            this.router.use(express.json());
            this.router.post(this.path + "/publicKey", this.getServerPublicKey);
            this.router.post(this.path + "/verify", this.verifyResponse);
        };
        this.getServerPublicKey = (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.body || !req.body.encryptType) {
                console.debug("Bad Request");
                res.sendStatus(400);
                return;
            }
            let keyType = "public" + req.body.encryptType;
            let serverKeys = yield (yield this.database.getCollection("ServerKeys")).findOne({
                keyType: keyType
            });
            res.status(200);
            res.send(serverKeys[keyType]);
        });
        this.getServerPrivateKey = () => __awaiter(this, void 0, void 0, function* () {
            let keyType = "private";
            let serverKeys = yield (yield this.database.getCollection("ServerKeys")).findOne({
                keyType: keyType
            });
            return serverKeys[keyType];
        });
        this.getUserPublicKey = (userId, encryptType) => __awaiter(this, void 0, void 0, function* () {
            let user = yield (yield this.database.getCollection("Users")).findOne({
                "_id": new mongodb_1.ObjectId(userId)
            });
            return user[encryptType + "Key"];
        });
        this.verifyResponse = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let serverPrivateKey = yield this.getServerPrivateKey();
            let verifiedAndConfidentialOrder = req.body.verifiedAndConfidentialOrder;
            let signature = crypto_1.privateDecrypt(serverPrivateKey, Buffer.from(verifiedAndConfidentialOrder, "utf-8"));
            let confidentialOrder = req.body.confidentialOrder;
            let plainTextOrder = crypto_1.privateDecrypt(serverPrivateKey, Buffer.from(confidentialOrder));
            let userId = req.body.id;
            if (this.verify(userId, plainTextOrder, signature)) {
                res.status(200);
                res.send("order verified");
                return;
            }
            res.status(406);
            res.send("order denied");
        });
        this.isOrder = (plainText) => __awaiter(this, void 0, void 0, function* () {
            let keys = ["_id", "userId", "items", "total", "date"];
            let order = JSON.parse(plainText);
            let verified = true;
            Object.keys(order).forEach(function (key) {
                if (!keys.includes(key)) {
                    verified = false;
                }
            });
            return verified;
        });
        this.createAndStoreKeys = (id) => __awaiter(this, void 0, void 0, function* () {
            let keys = yield this.createKeys();
            yield this.savePrivateKey(keys.privateKey);
            yield this.savePublicKey(id, keys.publicKey);
        });
        this.createServerKeys = () => __awaiter(this, void 0, void 0, function* () {
            let keys = yield this.createKeys();
            let publicKey = {
                keyType: "public",
                key: keys.publicKey
            };
            let privateKey = {
                keyType: "private",
                key: keys.privateKey
            };
            yield this.database.createServerKey(publicKey);
            yield this.database.createServerKey(privateKey);
        });
        this.createKeys = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                crypto_1.generateKeyPair("rsa", {
                    modulusLength: 2048,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem',
                        cipher: 'aes-256-cbc',
                        passphrase: 'top secret'
                    }
                }, (err, pub, priv) => {
                    if (err) {
                        rej(err);
                    }
                    res({ publicKey: pub, privateKey: priv });
                });
            });
        });
        this.savePrivateKey = (privateKey) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                fs_1.writeFile(this.encryptType + 'Key.pem', privateKey, (err) => {
                    if (err) {
                        rej(err);
                    }
                    res();
                });
            });
        });
        this.savePublicKey = (id, publicKey) => __awaiter(this, void 0, void 0, function* () {
            let filter = { _id: new mongodb_1.ObjectId(id) };
            let updateDoc = {
                $set: {
                    "key": publicKey
                }
            };
            yield this.database.upsertItem(filter, updateDoc);
        });
        this.sign = (order) => __awaiter(this, void 0, void 0, function* () {
            let privateKey = fs_1.readFileSync("./" + this.encryptType + "Key.pem");
            return crypto_1.createSign(this.encryptType.toUpperCase() + "-SHA1").update(order).sign({
                key: privateKey,
                passphrase: 'top secret'
            });
        });
        this.verify = (id, order, signature) => __awaiter(this, void 0, void 0, function* () {
            let user = yield this.database.getUserHelper(id);
            if (!user) {
                console.debug(`User with ID ${id} does not exist.`);
                return false;
            }
            let publicKey = user.key;
            let verify = crypto_1.createVerify(this.encryptType.toUpperCase() + "-SHA1");
            verify.update(order);
            verify.end();
            return verify.verify(publicKey, signature);
        });
        this.signAndVerify = (id, order) => __awaiter(this, void 0, void 0, function* () {
            let signature = yield this.sign(order);
            return yield this.verify(id, order, signature);
        });
        this.path = '/key';
        this.encryptType = encryptType;
        this.router = express_1.Router();
        this.database = database;
        this.initRoutes();
    }
}
exports.Key = Key;
