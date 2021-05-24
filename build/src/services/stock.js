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
exports.Stock = void 0;
const bson_1 = require("bson");
class Stock {
    constructor(database) {
        //Check if an item exists, by default, it checks ID, can be changed with optional input variable
        this.itemExists = (id) => __awaiter(this, void 0, void 0, function* () {
            let stock = yield this.database.getStockHelper();
            return stock.length > 0;
        });
        this.itemExistsByName = (itemName) => __awaiter(this, void 0, void 0, function* () {
            let stock = yield this.database.getStockHelper();
            stock.forEach(item => {
                if (item.name == itemName) {
                    return true;
                }
            });
            return false;
        });
        this.getItemByName = (itemName) => __awaiter(this, void 0, void 0, function* () {
            let stock = yield this.database.getStockHelper();
            stock.forEach(item => {
                if (item.name == itemName) {
                    return item;
                }
            });
            return null;
        });
        this.addItem = (itemName, quantity, price) => __awaiter(this, void 0, void 0, function* () {
            // if(await this.itemExistsByName(itemName)){
            //     let item = await this.getItemByName(itemName);
            //     await this.increaseQuantity(itemName, quantity);
            //     return (await this.database.getItemByName(item))._id;
            // }
            // else if(quantity < 0 || price < 0){
            //     console.log("Cannot add an item with negative quality or price");
            //     return null;
            // }
            // let itemObject = {
            //     item: item,
            //     quantity: quantity,
            //     price: price
            // }
            // return await this.database.createItem(itemObject);
            return "";
        });
        this.getNumericalAttribute = (itemId, attribute) => __awaiter(this, void 0, void 0, function* () {
            // let item = await this.database.getItem(itemId);
            // return item[attribute];
            return -1;
        });
        this.getQuantity = (itemId) => __awaiter(this, void 0, void 0, function* () {
            let stock = yield this.database.getStockHelper();
            let quantity = 0;
            stock.forEach(item => {
                if (item._id == itemId) {
                    quantity += 1;
                }
            });
            return quantity;
        });
        this.getPrice = (itemId) => __awaiter(this, void 0, void 0, function* () {
            return yield this.getNumericalAttribute(itemId, "price");
        });
        this.enoughStock = (items) => __awaiter(this, void 0, void 0, function* () {
            items.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                let currentStock = yield this.getQuantity(item._id);
                if (false) {
                    return false;
                }
            }));
            return true;
        });
        this.modifyNumericalAttribute = (itemId, modification, attribute, set = false) => __awaiter(this, void 0, void 0, function* () {
            if (!this.itemExists(itemId)) {
                console.log("Cannot add to item that does not exist!");
                return false;
            }
            let filter = {
                _id: new bson_1.ObjectId(itemId)
            };
            let command = set ? "$set" : "$inc";
            let update = {
                [command]: {
                    [attribute]: modification
                }
            };
            let currentValue = yield this.getNumericalAttribute(itemId, attribute);
            if ((!set && currentValue + modification < 0) || (set && modification < 0)) //Can occur with the decrease function, or inputting negative numbers manually
             {
                console.log("This will cause a negative number!");
                return false;
            }
            yield this.database.upsertItem(filter, update);
            return true;
        });
        this.setNumericalAttribute = (itemId, quantity, attribute) => __awaiter(this, void 0, void 0, function* () {
            return yield this.modifyNumericalAttribute(itemId, quantity, attribute, true);
        });
        this.increaseNumericalAttribute = (itemId, quantity, attribute) => __awaiter(this, void 0, void 0, function* () {
            return yield this.modifyNumericalAttribute(itemId, quantity, attribute);
        });
        // increaseQuantity = async (itemId : ObjectId, increase : number) : Promise<boolean> =>
        // {
        //     return await this.modifyNumericalAttribute(itemId, increase);
        // }
        // decreaseQuantity = async (item : IProduct) : Promise<boolean> =>
        // {
        //     return await this.increaseQuantity(item._id, -1)
        // }
        // setQuantity = async(itemid : ObjectId, quantity : number) : Promise<boolean> =>
        // {
        //     return await this.setNumericalAttribute(itemId, quantity, "quantity");
        // }
        // increasePrice = async (itemid : ObjectId, increase :number) : Promise<boolean> =>
        // {
        //     return await this.modifyNumericalAttribute(itemId, increase, "price");
        // }
        // decreasePrice = async (itemid : ObjectId, decrease : number) : Promise<boolean> =>
        // {
        //     return await this.increasePrice(itemId, -decrease);
        // }
        // setPrice = async (itemid : ObjectId, price : number) : Promise<boolean> =>
        // {
        //     return await this.setNumericalAttribute(itemId, price, "price")
        // }
        this.updateStockBasedOnOrder = (order) => __awaiter(this, void 0, void 0, function* () {
            let validOrder = yield this.enoughStock(order.items);
            if (!validOrder) {
                console.debug("Invalid Order!");
                return false;
            }
            order.items.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                // await this.decreaseQuantity(item);
                console.debug("TODO: Decrease Quantity!");
            }));
            return true;
        });
        this.database = database;
    }
}
exports.Stock = Stock;
