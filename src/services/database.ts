import { Key } from "./key";
import { Request, Response, Router } from "express";
import  { IProduct, IOrder, IUser, IServerKey, CollectionName, PrettyCollection } from '../interfaces/database';
import IControllerBase from '../interfaces/IControllerBase';
import { EncryptType, Privacy } from "../interfaces/key/types";
import { MongoClient, InsertOneWriteOpResult, Collection, ObjectId } from "mongodb";

const URI = process.env["MongoURI"] || "mongodb://localhost:27017/";

export class Database implements IControllerBase
{
  public path : string;
  public router : any;

  client : MongoClient;

  constructor(uri : string = "mongodb://localhost:27017/") {
    this.client = new MongoClient(uri);
    this.path = '/db';
    this.router = Router();
    this.initRoutes();
  }

  public initRoutes = () : void =>
  {
    this.router.get("/db/stock", this.getStockHandler);
    this.router.get("/db/users", this.getUsersHandler);
    this.router.get("/db/orders", this.getOrdersHandler);
    this.router.get("/db/keys/server", this.getServerKeysHandler);
  }

  connect = async () : Promise<void> =>
	{
    if(this.client == null) { console.debug("Please instantiate the Mongo Client!"); return; }

    let connect = await this.client.connect();

    if(!connect) { console.debug("Could not connect to database."); }
  }

  disconnect = async () : Promise<void> =>
	{
    await this.client.close();
  }

  getCollection = async (collection : CollectionName) : Promise<Collection> =>
	{
    return this.client.db("452Final").collection(collection)
  }

  getUsersHelper = async () : Promise<IUser[]> =>
	{
    let users : IUser[] = [];
    await (await this.getCollection("Users")).aggregate(
      [
          {
              $group:
                  {
                    _id: "$_id",
                    username: {$first: "$username"},
                    password: {$first: "$password"},
                    email: {$first: "$email"},
                    key: {$first: "$key"}
                  }
          }
      ])
      .forEach((user) => {
          users.push(user)
      });

    return users;
  }

  public getUsersHandler = async (req : Request, res : Response ) : Promise<void> =>
  {
    let users = await this.getUsersHelper();
    res.status(200);
    res.send(users);
  }

  public getStockHelper = async () : Promise<IProduct[]> =>
	{
    let stock : IProduct[] = []
    await (await this.getCollection("Stock")).aggregate(
      [
          {
              $group:
                  {
                    _id: "$_id",
                    name: {$first: "$name"},
                    img: {$first: "$img"},
                    qty: {$first: "$qty"}
                  }
          }
      ])
      .forEach((product) => {
          stock.push(product)
      });

    return stock
  }

  public getStockHandler = async (req : Request, res : Response ) : Promise<void> =>
  {
    let stock = await this.getStockHelper();
    res.status(200);
    res.send(stock);
  }

  getOrdersHelper = async() : Promise<IOrder[]> =>
	{
    let orders : IOrder[] = []
    // TODO Need to define schema for Orders
    await (await this.getCollection("Orders")).aggregate(
      [
          {
              $group:
                  {
                    _id: "$_id",
                    name: {$first: "$name"},
                    img: {$first: "$img"},
                    qty: {$first: "$qty"}
                  }
          }
      ])
      .forEach((order) => {
          orders.push(order)
      });
 
    return orders;
  }

  public getOrdersHandler = async (req : Request, res : Response) : Promise<void> =>
  {
    let orders = await this.getOrdersHelper();
    res.status(200);
    res.send(orders);
  }

  getServerKeysHelper = async() : Promise<IServerKey[]> =>
	{
    let server_keys : IServerKey[ ] = []
    // TODO Need to define schema for ServerKeys
    await (await this.getCollection("ServerKeys")).aggregate(
      [
          {
              $group:
                  {
                    _id: "$_id",
                    name: {$first: "$name"},
                    img: {$first: "$img"},
                    qty: {$first: "$qty"}
                  }
          }
      ])
      .forEach((server_key) => {
          server_keys.push(server_key)
      });
    return server_keys;
  }

  public getServerKeysHandler = async (req : Request, res : Response) : Promise<void> =>
  {
    let server_keys = await this.getServerKeysHelper();
    res.status(200);
    res.send(server_keys);
  }

  findById = (id : string, collection : any[]) : any =>
  {
    collection.forEach(document => {
      if(document._id == id)
      {
        console.log("found!");
        return document
      }
    });
  }

  // Does this need an endpoint?
  getDocument = async (req : Request, res : Response) : Promise<any> =>
	{
    let collection : CollectionName = req.body.collection;
    let id : string = req.body.id;

    if(!collection || !id) { console.debug("Collection or ID was not provided"); res.status(400); res.send(); }

    let retrieved_collection : PrettyCollection;
    switch(collection){
      case "Orders":
        retrieved_collection = await this.getOrdersHelper();
        break;
      case "Users":
        retrieved_collection = await this.getUsersHelper();
        break;
      case "Stock":
        retrieved_collection = await this.getStockHelper();
        break;
      case "ServerKeys":
        retrieved_collection = await this.getServerKeysHelper();
    }
    
    return this.findById(id, retrieved_collection);
  }

  getUserHelper = async (id : string) : Promise<IUser | null> =>
  {
    let object_id = new ObjectId(id);
    let collection : PrettyCollection = await this.getUsersHelper();
    collection.forEach(document => {
      if(document._id == object_id)
      {
        console.log("found!");
        return document
      }
    });
    return null;
  }

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

  createUser = async (username : string, password : string, email : string) : Promise<string> =>
  {
    let user : InsertOneWriteOpResult<any> = 
    await this.client.db("452Final").
    collection("Users")
    .insertOne(
      {
        username: username,
        password: password,
        email: email,
      }
    );

    if(!user) { console.debug("Could not insert user!"); return ""; }

    let id = user.insertedId;
    
    let rsa_key = new Key("rsa", this);
    // let dsa_key = new Key("dsa", this.database);

    await rsa_key.createAndStoreKeys(id);
    // await dsa_key.createAndStoreKeys(id);

    return user.insertedId;
  }

  createOrder = async (order : Object) : Promise<string> =>
	{
    let addingOrder = await this.client.db("452Final").
    collection("Orders")
    .insertOne(
      order
    );

    if(!addingOrder) { console.debug("Could not add order!"); return ""; }
    return addingOrder.insertedId;
  }

  upsertItem = async (query : Object, update : Object) : Promise<ObjectId> =>
	{
    let addingItem = await this.client.db("452Final").
    collection("Stock")
    .updateOne(
      query, update, { upsert: true }
    );

    if(!addingItem) { console.debug("Could not add item!"); throw new Error("Could not add item"); }
    return addingItem.upsertedId._id;
  }

  createServerKey = async (item : Object) : Promise<string> =>{
    let addingItem = await this.client.db("452Final").
    collection("ServerKeys")
    .insertOne(
      item
    );

    if(!addingItem) { console.debug("Could not add item!"); return ""; }
    return addingItem.insertedId;
  }

}