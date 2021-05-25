import { Key } from "./key";
import { Stock } from "./stock";
import { EmailClient } from "./email";
import { Database } from "./database";
import { IOrder, IProduct, PrettyCollection } from "../interfaces/database";
import { EncryptType } from "../interfaces/key/types";
import { ObjectId } from "bson";
import IControllerBase from "../interfaces/IControllerBase";

export class OPD
{
    database : Database;
    stock : Stock;
    emailClient : EmailClient
    constructor(database : Database, emailUser : string, emailPass : string)
    {
        this.database = database;
        this.stock = new Stock(this.database);
        this.emailClient = new EmailClient(emailUser, emailPass, "gmail");
    }

    private calculateTotal = async (cart : IProduct[]) : Promise<number> =>
    {
        let total : number = 0;
        cart.forEach(product => {
            total += parseFloat(product.price);
        });

        console.log(total);
        return total;
    }

    private createOrder = async (cart : IProduct[]) : Promise<IOrder> =>
    {
        return {
            items: cart,
            total: await this.calculateTotal(cart)
        }
    }

    private storeOrder = async (order : IOrder) : Promise<boolean> =>
	{ 
        //Should not be called outside of processOrder
        if(await this.stock.updateStockBasedOnOrder(order)){
            let calculatedOrder = await this.createOrder(order.items);
            await this.database.submitOrder(calculatedOrder);
            return true;
        }
        return false;
    }

    itemInOrder = async (order : IOrder, itemId : ObjectId) : Promise<boolean> =>
    {
        order.items.forEach(item => {
            if(item._id == itemId)
            {
                return true;
            }
        });
        return false;
    }

    addToOrder = async (itemId : ObjectId, requestedQuantity : number) : Promise<boolean> =>
	{
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
    }


    updateItemQuantity = async (itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
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
        // this.updateTotal(itemId, -(this.order.items[itemId]));
        // delete this.order.items[itemId];
        return true;
    }

    updateTotal = async (order : IOrder, itemId : ObjectId, requestedQuantity : number) : Promise<boolean> =>
	{
        let price = await this.stock.getPrice(itemId);
        let update = price*requestedQuantity;
        if(order.total+update < 0){
            console.log("Cannot charge a negative amount");
            return false;
        }
        order.total += update;
        return true; 
    }

    processOrder = async (encryptType : EncryptType, cart : IProduct[], username : string) : Promise<boolean> =>
	{
        let key = new Key(encryptType, this.database);
        // let signature = await key.sign(JSON.stringify(cart));
        let order = await this.createOrder(cart)

        // TODO: Is it ok to use toHexString here?
        // let verify = await key.verify(order._id.toHexString(), JSON.stringify(order), signature);
        // if(!verify)
        // {
        //     console.log("Could not verify order");
        //     return false;
        // }
        await this.storeOrder(order);
        let body = "Your order has been processed!";
        let user = await this.database.getUserHelper(username);
        if(!user) { console.debug("User does not exist!"); return false; }


        if(!user.email) { console.debug("Couldn't send email!"); return true; /* throw new Error(`Couldn't send email to user ${user}`); */ }
        
        this.emailClient.sendEmail(user.email, "Order processed!", body)
        return true;
    }
}