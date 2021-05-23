import { ObjectId } from "bson";
import { Database } from "./database";
import { IOrder, IProduct } from "../interfaces/database";

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

    getNumericalAttribute = async(itemId : ObjectId, attribute : NumericalAttribute) : Promise<number> =>
	{
        // let item = await this.database.getItem(itemId);
        // return item[attribute];
        return -1;
    }

    getQuantity = async(itemId : ObjectId) : Promise<number> => {
        let stock : IProduct[] = await this.database.getStockHelper();
        let quantity : number = 0;

        stock.forEach(item => {
            if(item._id == itemId)
            {
                quantity += 1;
            }
        });

        return quantity;
    }

    getPrice = async(itemId : ObjectId) : Promise<number> => {
        return await this.getNumericalAttribute(itemId, "price");
    }

    enoughStock = async(items : IProduct[]) : Promise<boolean> =>
	{
        items.forEach(async item =>{
            let currentStock = await this.getQuantity(item._id);
            if(false) { return false; }
        });
        return true;
    }

    modifyNumericalAttribute = async (itemId : ObjectId, modification : number, attribute : NumericalAttribute, set : boolean = false) =>
	{
        if(!this.itemExists(itemId))
        {
            console.log("Cannot add to item that does not exist!");
            return false;
        }
        let filter = {
            _id: new ObjectId(itemId)
        }

        let command = set ? "$set" : "$inc";
        let update = {
            [command]: {
                [attribute]: modification
            }
        }
        let currentValue = await this.getNumericalAttribute(itemId, attribute);
        if((!set && currentValue+modification < 0) || (set && modification < 0))  //Can occur with the decrease function, or inputting negative numbers manually
        {
            console.log("This will cause a negative number!")
            return false;
        }
        await this.database.upsertItem(filter, update)
        return true;
    }

    setNumericalAttribute = async (itemId : ObjectId, quantity : number, attribute : NumericalAttribute) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, quantity, attribute, true);
    }

    increaseNumericalAttribute = async (itemId : ObjectId, quantity : number, attribute : NumericalAttribute) : Promise<boolean> =>
	{
        return await this.modifyNumericalAttribute(itemId, quantity, attribute);
    }

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

    updateStockBasedOnOrder = async (order : IOrder) : Promise<boolean> =>
	{
        let validOrder = await this.enoughStock(order.items);

        if(!validOrder) { console.debug("Invalid Order!"); return false; }

        order.items.forEach (async (item) =>
	    {
            // await this.decreaseQuantity(item);
            console.debug("TODO: Decrease Quantity!");
        })

        return true;
    }
}
