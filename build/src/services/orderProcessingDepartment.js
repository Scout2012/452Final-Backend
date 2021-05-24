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
exports.OPD = void 0;
const key_1 = require("./key");
const stock_1 = require("./stock");
const email_1 = require("./email");
class OPD {
    constructor(database, emailUser, emailPass) {
        this.calculateTotal = (cart) => __awaiter(this, void 0, void 0, function* () {
            let total = 0;
            cart.forEach(product => {
                total += parseFloat(product.price);
            });
            console.log(total);
            return total;
        });
        this.createOrder = (cart) => __awaiter(this, void 0, void 0, function* () {
            return {
                items: cart,
                total: yield this.calculateTotal(cart)
            };
        });
        this.storeOrder = (order) => __awaiter(this, void 0, void 0, function* () {
            //Should not be called outside of processOrder
            if (yield this.stock.updateStockBasedOnOrder(order)) {
                let calculatedOrder = yield this.createOrder(order.items);
                yield this.database.submitOrder(calculatedOrder);
                return true;
            }
            return false;
        });
        this.itemInOrder = (order, itemId) => __awaiter(this, void 0, void 0, function* () {
            order.items.forEach(item => {
                if (item._id == itemId) {
                    return true;
                }
            });
            return false;
        });
        this.addToOrder = (itemId, requestedQuantity) => __awaiter(this, void 0, void 0, function* () {
            // let itemExists = await this.stock.itemExists(itemId)
            // let enoughStock = await this.stock.enoughStock(itemId, requestedQuantity);
            // if(!itemExists){
            //     console.log("Cannot add non-existant item to order!");
            //     return false;
            // }
            // if(!enoughStock){
            //     console.log("Cannot add requested item. Not enough stock for requested amount!")
            //     return false;
            // }
            // if(await this.itemInOrder(itemId)){
            //     return await this.increaseItemQuantity(itemId, requestedQuantity)
            // }
            // this.updateTotal(itemId, requestedQuantity);
            // this.order.items[itemId] = requestedQuantity
            return true;
        });
        this.updateItemQuantity = (itemId, requestedQuantity) => __awaiter(this, void 0, void 0, function* () {
            // let currentOrderQuantity = this.order.items[itemId];
            // let newQuantity = currentOrderQuantity + requestedQuantity;
            // let currentStockQuantity = this.stock.getQuantity(itemId);
            // if(newQuantity <= 0){
            //     this.removeItem(itemId);
            //     return true;
            // }
            // if(newQuantity > currentStockQuantity){
            //     console.log("Cannot request more then current stock!");
            //     return false;
            // }
            // this.updateTotal(itemId, requestedQuantity);
            // this.order.items[itemId]+= requestedQuantity;
            return true;
        });
        this.increaseItemQuantity = (itemId, requestedQuantity) => __awaiter(this, void 0, void 0, function* () {
            return this.updateItemQuantity(itemId, requestedQuantity);
        });
        this.decreaseItemQuantity = (itemId, requestedQuantity) => __awaiter(this, void 0, void 0, function* () {
            return this.updateItemQuantity(itemId, -requestedQuantity);
        });
        this.removeItem = (itemId) => __awaiter(this, void 0, void 0, function* () {
            // this.updateTotal(itemId, -(this.order.items[itemId]));
            // delete this.order.items[itemId];
            return true;
        });
        this.updateTotal = (order, itemId, requestedQuantity) => __awaiter(this, void 0, void 0, function* () {
            let price = yield this.stock.getPrice(itemId);
            let update = price * requestedQuantity;
            if (order.total + update < 0) {
                console.log("Cannot charge a negative amount");
                return false;
            }
            order.total += update;
            return true;
        });
        this.processOrder = (encryptType, cart, username) => __awaiter(this, void 0, void 0, function* () {
            let key = new key_1.Key(encryptType, this.database);
            // let signature = await key.sign(JSON.stringify(cart));
            let order = yield this.createOrder(cart);
            // TODO: Is it ok to use toHexString here?
            // let verify = await key.verify(order._id.toHexString(), JSON.stringify(order), signature);
            // if(!verify)
            // {
            //     console.log("Could not verify order");
            //     return false;
            // }
            yield this.storeOrder(order);
            let body = "Your order has been processed!";
            let user = yield this.database.getUserHelper(username);
            if (!user) {
                console.debug("User does not exist!");
                return false;
            }
            if (!user.email) {
                console.debug("Couldn't send email!");
                return true; /* throw new Error(`Couldn't send email to user ${user}`); */
            }
            this.emailClient.sendEmail(user.email, "Order processed!", body);
            return true;
        });
        this.database = database;
        this.stock = new stock_1.Stock(this.database);
        this.emailClient = new email_1.EmailClient(emailUser, emailPass, "gmail");
    }
}
exports.OPD = OPD;
