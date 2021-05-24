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
exports.Login = void 0;
const express = __importStar(require("express"));
const js_sha256_1 = require("js-sha256");
const express_1 = require("express");
const URI = process.env["MongoURI"] || "mongodb://localhost:27017/";
class Login {
    constructor(database) {
        this.initRoutes = () => {
            this.router.use(express.json());
            this.router.post("/user/login", this.validateLoginHandler);
        };
        this.validateLoginHandler = (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.body) {
                console.debug("No body included.");
                res.sendStatus(400);
                return;
            }
            if (!req.body.data) {
                console.debug("No data was passed in body.");
                res.sendStatus(400);
                return;
            }
            // TODO: Type user
            let user_data = JSON.parse(req.body.data);
            if (!user_data.username) {
                console.debug("No username included.");
                res.sendStatus(400);
                return;
            }
            if (!user_data.password) {
                console.debug("No password included.");
                res.sendStatus(400);
                return;
            }
            let user = yield this.database.getUserHelper(user_data.username);
            if (!user) {
                console.debug("User not in system yet!");
                res.sendStatus(401);
                return;
            }
            if ((user === null || user === void 0 ? void 0 : user.password) != js_sha256_1.sha256(user_data.password)) {
                res.sendStatus(401);
                return;
            }
            //Send 200!
            console.log("OK!");
            res.sendStatus(200);
        });
        this.path = '/user/login';
        this.router = express_1.Router();
        this.database = database;
        this.initRoutes();
    }
}
exports.Login = Login;
