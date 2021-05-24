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
exports.Database = void 0;
const key_1 = require("./key");
const express_1 = require("express");
const orderProcessingDepartment_1 = require("./orderProcessingDepartment");
const mongodb_1 = require("mongodb");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const URI = process.env["MongoURI"] || "mongodb://localhost:27017/";
class Database {
    constructor(uri = "mongodb://localhost:27017/") {
        this.initRoutes = () => {
            this.router.get("/db/keys", this.getServerKeysHandler);
            this.router.get("/db/stock", this.getStockHandler);
            this.router.get("/db/users", this.getUsersHandler);
            this.router.get("/db/orders", this.getOrdersHandler);
            this.router.post("/db/order", this.createOrderHandler);
        };
        this.connect = () => __awaiter(this, void 0, void 0, function* () {
            if (this.client == null) {
                console.debug("Please instantiate the Mongo Client!");
                return;
            }
            let connect = yield this.client.connect();
            if (!connect) {
                console.debug("Could not connect to database.");
            }
        });
        this.disconnect = () => __awaiter(this, void 0, void 0, function* () {
            yield this.client.close();
        });
        this.getCollection = (collection) => __awaiter(this, void 0, void 0, function* () {
            return this.client.db("452Final").collection(collection);
        });
        this.getUsersHelper = () => __awaiter(this, void 0, void 0, function* () {
            let users = [];
            yield (yield this.getCollection("Users")).aggregate([
                {
                    $group: {
                        _id: "$_id",
                        username: { $first: "$username" },
                        password: { $first: "$password" },
                        email: { $first: "$email" },
                        key: { $first: "$key" }
                    }
                }
            ])
                .forEach((user) => {
                users.push(user);
            });
            return users;
        });
        this.getUsersHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let users = yield this.getUsersHelper();
            res.status(200);
            res.send(users);
        });
        this.getStockHelper = () => __awaiter(this, void 0, void 0, function* () {
            let stock = [];
            yield (yield this.getCollection("Stock")).aggregate([
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        img: { $first: "$img" },
                        qty: { $first: "$qty" },
                        price: { $first: "$price" }
                    }
                }
            ])
                .forEach((product) => {
                stock.push(product);
            });
            return stock;
        });
        this.getStockHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let stock = yield this.getStockHelper();
            res.status(200);
            res.send(stock);
        });
        this.getOrdersHelper = () => __awaiter(this, void 0, void 0, function* () {
            let orders = [];
            // TODO Need to define schema for Orders
            yield (yield this.getCollection("Orders")).aggregate([
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        img: { $first: "$img" },
                        qty: { $first: "$qty" },
                        price: { $first: "$price" }
                    }
                }
            ])
                .forEach((order) => {
                orders.push(order);
            });
            return orders;
        });
        this.getOrdersHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let orders = yield this.getOrdersHelper();
            res.status(200);
            res.send(orders);
        });
        this.getServerKeysHelper = () => __awaiter(this, void 0, void 0, function* () {
            let server_keys = [];
            // TODO Need to define schema for ServerKeys
            yield (yield this.getCollection("ServerKeys")).aggregate([
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        img: { $first: "$img" },
                        qty: { $first: "$qty" }
                    }
                }
            ])
                .forEach((server_key) => {
                server_keys.push(server_key);
            });
            return server_keys;
        });
        this.getServerKeysHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let server_keys = yield this.getServerKeysHelper();
            res.status(200);
            res.send(server_keys);
        });
        this.findById = (id, collection) => {
            collection.forEach(document => {
                if (document._id == id) {
                    return document;
                }
            });
        };
        // Does this need an endpoint?
        this.getDocument = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let collection = req.body.collection;
            let id = req.body.id;
            if (!collection || !id) {
                console.debug("Collection or ID was not provided");
                res.status(400);
                res.send();
            }
            let retrieved_collection;
            switch (collection) {
                case "Orders":
                    retrieved_collection = yield this.getOrdersHelper();
                    break;
                case "Users":
                    retrieved_collection = yield this.getUsersHelper();
                    break;
                case "Stock":
                    retrieved_collection = yield this.getStockHelper();
                    break;
                case "ServerKeys":
                    retrieved_collection = yield this.getServerKeysHelper();
            }
            return this.findById(id, retrieved_collection);
        });
        this.getUserHelper = (username) => __awaiter(this, void 0, void 0, function* () {
            let collection = yield this.getUsersHelper();
            for (var i = 0; i < collection.length; i++) {
                if (collection[i].username == username) {
                    return collection[i];
                }
            }
            return null;
        });
        // getItem = async(id : string) : Promise<any> =>
        // {
        //   return this.getDocument(id, "Stock");
        // }
        // getItemByName = async(name : string) : Promise<IProduct> =>
        // {
        //   let stock = await this.getStockHelper();
        // }
        // getOrder = async(id : string) : Promise<any> =>
        // {
        //   return this.getDocument(id, "Orders");
        // }
        // getKey = async(encryptType : EncryptType, privacy : Privacy) =>
        // {
        //   let keys = await this.getServerKeys();
        //   let key = keys.findOne({
        //     keyType: encryptType+privacy
        //   })
        //   return key.key;
        // }
        // TODO Link this to a POST(or PUT(?)) endpoint
        this.createUser = (username, password, email) => __awaiter(this, void 0, void 0, function* () {
            let user = yield this.client.db("452Final")
                .collection("Users")
                .insertOne({
                username: username,
                password: password,
                email: email,
            });
            if (!user) {
                console.debug("Could not insert user!");
                return "";
            }
            let id = user.insertedId;
            let rsa_key = new key_1.Key("rsa", this);
            // let dsa_key = new Key("dsa", this.database);
            yield rsa_key.createAndStoreKeys(id);
            // await dsa_key.createAndStoreKeys(id);
            return user.insertedId;
        });
        this.submitOrder = (order) => __awaiter(this, void 0, void 0, function* () {
            let addingOrder = yield this.client.db("452Final")
                .collection("Orders")
                .insertOne(order);
            if (!addingOrder) {
                console.debug("Could not add order!");
                return "";
            }
            return addingOrder.insertedId;
        });
        this.upsertItem = (query, update) => __awaiter(this, void 0, void 0, function* () {
            let addingItem = yield this.client.db("452Final")
                .collection("Stock")
                .updateOne(query, update, { upsert: true });
            if (!addingItem) {
                console.debug("Could not add item!");
                throw new Error("Could not add item");
            }
            return addingItem.upsertedId._id;
        });
        this.createServerKey = (item) => __awaiter(this, void 0, void 0, function* () {
            let addingItem = yield this.client.db("452Final")
                .collection("ServerKeys")
                .insertOne(item);
            if (!addingItem) {
                console.debug("Could not add item!");
                return "";
            }
            return addingItem.insertedId;
        });
        this.createOrderHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            let user = (_a = req.body) === null || _a === void 0 ? void 0 : _a.user;
            if (!user) {
                console.debug("User not found!");
                res.sendStatus(400);
                return;
            }
            let cart = (_b = req.body) === null || _b === void 0 ? void 0 : _b.cart;
            if (!cart) {
                console.debug("Cart not found!");
                res.sendStatus(400);
                return;
            }
            let encryptType = (_c = req.body) === null || _c === void 0 ? void 0 : _c.encryptType;
            if (!encryptType) {
                console.debug("Bad Encrypt Type!");
                res.sendStatus(400);
                return;
            }
            let processed = yield this.opd.processOrder(encryptType, cart, user);
            if (!processed) {
                res.sendStatus(400);
                return;
            }
            res.status(200);
            res.send(cart);
        });
        this.client = new mongodb_1.MongoClient(uri);
        this.path = '/db';
        this.router = express_1.Router();
        this.initRoutes();
        let email = process.env['OPD_EMAIL'];
        let password = process.env['OPD_PASS'];
        if (!email || !password) {
            console.error("Please set your OPD_EMAIL and/or OPD_PASS .env value");
            throw new Error("Invalid Email Credentials");
        }
        this.opd = new orderProcessingDepartment_1.OPD(this, email, password);
    }
}
exports.Database = Database;
