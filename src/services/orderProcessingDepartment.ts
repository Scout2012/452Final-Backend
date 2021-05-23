import { Database } from "./database";
import { EmailClient } from "./email";
import { EncryptType } from "./interfaces/key/types";
import { Key } from "./key";
import { Stock } from "./stock";

export class OPD{
    order: Object;
    database : Database;
    stock : Stock;
    emailClient : EmailClient
    constructor(userId : String, database : Database, emailUser : string, emailPass : string){
        this.order = {
            userId : userId,
            items : {

            },
            
            total : 0
        }
        this.database = database;
        this.stock = new Stock(this.database);
        this.emailClient = new EmailClient(emailUser, emailPass, "gmail");
    }

    private storeOrder = async (order : Object = this.order) : Promise<boolean> =>
	{ //Should not be called outside of processOrder
        if(await this.stock.updateStockBasedOnOrder(order)){
            await this.database.createOrder(order);
            return true;
        }
        return false;
    }

    itemInOrder = async (itemId : string) : Promise<boolean> =>
	{
        return this.order.items.hasOwnProperty(itemId)
    }

    addToOrder = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        let itemExists = await this.stock.itemExists(itemId)
        let enoughStock = await this.stock.enoughStock(itemId, requestedQuantity);
        if(!itemExists){
            console.log("Cannot add non-existant item to order!");
            return false;
        }
        if(!enoughStock){
            console.log("Cannot add requested item. Not enough stock for requested amount!")
            return false;
        }
        if(await this.itemInOrder(itemId)){
            return await this.increaseItemQuantity(itemId, requestedQuantity)
        }
        this.updateTotal(itemId, requestedQuantity);
        this.order.items[itemId] = requestedQuantity
        return true;
    }


    updateItemQuantity = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        let currentOrderQuantity = this.order.items[itemId];
        let newQuantity = currentOrderQuantity + requestedQuantity;
        let currentStockQuantity = this.stock.getQuantity(itemId);
        if(newQuantity <= 0){
            this.removeItem(itemId);
            return true;
        }
        if(newQuantity > currentStockQuantity){
            console.log("Cannot request more then current stock!");
            return false;
        }
        this.updateTotal(itemId, requestedQuantity);
        this.order.items[itemId]+= requestedQuantity;
        return true;
    }

    increaseItemQuantity = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        return this.updateItemQuantity(itemId, requestedQuantity);
    }

    decreaseItemQuantity = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        return this.updateItemQuantity(itemId, -requestedQuantity);
    }

    removeItem = async (itemId : string) : Promise<boolean> =>
	{
        this.updateTotal(itemId, -(this.order.items[itemId]));
        delete this.order.items[itemId];
        return true;
    }

    updateTotal = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        let price = await this.stock.getPrice(itemId);
        let update = price*requestedQuantity;
        if(this.order.total+update < 0){
            console.log("Cannot charge a negative amount");
            return false;
        }
        this.order.total += update;
        return true; 
    }

    processOrder = async (encryptType : EncryptType, order : Object = this.order) : Promise<boolean> =>
	{
        let key = new Key(encryptType, this.database);
        let signature = await key.sign(JSON.stringify(this.order));
        let verify = await key.verify(this.order.userId, JSON.stringify(this.order), signature);
        if(!verify){
            console.log("Could not verify order");
            return false;
        }
        this.storeOrder(order);
        let body = "Your order has been processed!";
        let email = (await this.database.getUser(order["userId"])).email;
        this.emailClient.sendEmail(email, "Order processed!", body)
        return true;
    }
}