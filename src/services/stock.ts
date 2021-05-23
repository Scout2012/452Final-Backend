import { ObjectId } from "bson";
import { Database } from "./database";
import { IProduct } from "../interfaces/database";

type NumericalAttribute = 'quantity' | 'price';

export class Stock{

    database : Database
    
    constructor (database : Database) {
        this.database = database;
    }

    //Check if an item exists, by default, it checks ID, can be changed with optional input variable
    itemExists = async (id : ObjectId) : Promise<boolean> =>
	{
        let stock = await this.database.getStockHelper();
        return stock.length > 0;
    }

    itemExistsByName = async (itemName : string) : Promise<boolean> =>
	{
        let stock = await this.database.getStockHelper();

        stock.forEach(item => {
            if(item.name == itemName)
            {
                return true;
            }
        });

        return false;
    }

    getItemByName = async (itemName : string) : Promise<IProduct | null> =>
	{
        let stock = await this.database.getStockHelper();

        stock.forEach(item => {
            if(item.name == itemName)
            {
                return item;
            }
        });

        return null;
    }


    addItem = async (itemName : string, quantity : number, price : number) : Promise<string> => {
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
    }

    getNumericalAttribute = async(itemId : string, attribute : NumericalAttribute) : Promise<number> =>
	{
        // let item = await this.database.getItem(itemId);
        // return item[attribute];
        return -1;
    }

    getQuantity = async(itemId : string) : Promise<number> => {
        return await this.getNumericalAttribute(itemId, "quantity");
    }

    getPrice = async(itemId : string) : Promise<number> => {
        return await this.getNumericalAttribute(itemId, "price");
    }

    enoughStock = async(itemId : string, requestedQuantity : number) : Promise<boolean> =>
	{
        let currentStock = await this.getQuantity(itemId);
        return requestedQuantity <= currentStock && requestedQuantity >= 0;
    }

    modifyNumericalAttribute = async (itemId : string, modification : number, attribute : NumericalAttribute, set : boolean = false) =>
	{
        // if(!this.itemExists(itemId))
        // {
        //     console.log("Cannot add to item that does not exist!");
        //     return false;
        // }
        // let filter = {
        //     _id: new ObjectId(itemId)
        // }

        // let command = set ? "$set" : "$inc";
        // let update = {
        //     [command]: {
        //         [attribute]: modification
        //     }
        // }
        // let currentValue = await this.getNumericalAttribute(itemId, attribute);
        // if((!set && currentValue+modification < 0) || (set && modification < 0))  //Can occur with the decrease function, or inputting negative numbers manually
        // {
        //     console.log("This will cause a negative number!")
        //     return false;
        // }
        // let stock = await this.database.getStock();
        // await stock.updateOne(filter, update);
        return true;
    }

    setNumericalAttribute = async (itemId : string, quantity : number, attribute : NumericalAttribute) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, quantity, attribute, true);
    }

    increaseNumericalAttribute = async (itemId : string, quantity : number, attribute : NumericalAttribute) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, quantity, attribute);
    }

    increaseQuantity = async (itemId : string, increase : number) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, increase, "quantity");
    }
    
    decreaseQuantity = async (itemId : string, decrease: number) : Promise<boolean> =>
	{
        return await this.increaseQuantity(itemId, -decrease)
    }

    setQuantity = async(itemId : string, quantity : number) : Promise<boolean> =>
	{
        return await this.setNumericalAttribute(itemId, quantity, "quantity");
    }

    increasePrice = async (itemId : string, increase :number) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, increase, "price");
    }

    decreasePrice = async (itemId : string, decrease : number) : Promise<boolean> =>
	{
        return await this.increasePrice(itemId, -decrease);
    }

    setPrice = async (itemId : string, price : number) : Promise<boolean> =>
	{
        return await this.setNumericalAttribute(itemId, price, "price")
    }

    updateStockBasedOnOrder = async (order : Object) : Promise<boolean> =>
	{
        // let items = Object.keys(order.items);
        // let validOrder = true;
        // items.forEach( async (item) =>
	    // {
        //     let requestedQuantity = order.items[item];
        //     let enoughStock = await this.enoughStock(item, requestedQuantity)
        //     if(!enoughStock)
        //     {
        //         console.log("There is not enough stock to fulfill this order!");
        //         validOrder = false;
        //     }
        // })
        // if(!validOrder)
        // {
        //     console.log("This is not a valid order!");
        //     return false;
        // }

        // items.forEach ( async (item) =>
	    // {
        //     await this.decreaseQuantity(item, order.items[item])
        // })

        return true;
    }
}
