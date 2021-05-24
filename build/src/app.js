"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./services/database");
const login_1 = require("./services/login");
const key_1 = require("./services/key");
class App {
    constructor(appInit) {
        this.app = express_1.default();
        this.port = appInit.port;
        if (appInit.middlewares) {
            this.middlewares(appInit.middlewares);
        }
        if (appInit.controllers) {
            this.routes(appInit.controllers);
        }
    }
    middlewares(middleWares) {
        middleWares.forEach(middleWare => {
            this.app.use(middleWare);
        });
    }
    routes(controllers) {
        controllers.forEach(controller => {
            this.app.use("/", controller.router);
        });
    }
    listen() {
        this.app.listen(this.port, () => {
            // TODO: Remove this(?)
            this.app.use(cors_1.default());
            this.app.use(express_1.default.json());
            // Need to init the database here and skip the routes function of this
            // because we need to connect to the database before anything.
            let database = new database_1.Database();
            this.app.use("/", database.router);
            database.connect().then(() => {
                this.app.use("/", new login_1.Login(database).router);
                this.app.use("/", new key_1.Key("rsa", database).router);
                console.log(`App listening on the http://localhost:${this.port}`);
            });
        });
    }
}
exports.default = App;
