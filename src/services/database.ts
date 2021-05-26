import { Key } from "./key";
import { Request, Response, Router } from "express";
import IControllerBase from '../interfaces/IControllerBase';
import { OPD } from './orderProcessingDepartment';
import { MongoClient, InsertOneWriteOpResult, Collection, ObjectId } from "mongodb";
import  { IProduct, IOrder, IUser, IServerKey, CollectionName, PrettyCollection, IUserKeyPair } from '../interfaces/database';
import { EncryptType, IKeyPair } from "../interfaces/key/types";
import * as dotenv from 'dotenv';
import { createHash } from 'crypto'

dotenv.config();

const URI = process.env["MongoURI"] || "mongodb://localhost:27017/";

export class Database implements IControllerBase
{
  public path : string;
  public router : any;
  public opd : OPD;
  public key : Key;

  client : MongoClient;

  constructor(uri : string = "mongodb://localhost:27017/") {
    this.client = new MongoClient(uri);
    this.key = new Key('rsa', this);
    this.path = '/db';
    this.router = Router();
    this.initRoutes();
    
    let email = process.env['OPD_EMAIL'];
    let password = process.env['OPD_PASS'];

    if(!email || !password) { console.error("Please set your OPD_EMAIL and/or OPD_PASS .env value"); throw new Error("Invalid Email Credentials"); }
    this.opd = new OPD(this, email, password);
  }

  public initRoutes = () : void =>
  {
    this.router.get("/db/keys", this.getServerKeysHandler);
    this.router.get("/db/stock", this.getStockHandler);
    this.router.get("/db/users", this.getUsersHandler);
    this.router.get("/db/orders", this.getOrdersHandler);
    this.router.post("/db/addUser", this.addUserHandler) //Called when adding a user, request a "username", "password", and "email"
    this.router.post("/db/order", this.createOrderHandler);
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
              dsaKey: {$first: "$dsaKey"},
              rsaKey: {$first: "$rsaKey"}
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

  getStockHelper = async () : Promise<IProduct[]> =>
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
              qty: {$first: "$qty"},
              price: {$first: "$price"}
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
              qty: {$first: "$qty"},
              price: {$first: "$price"}
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

  userExists = async (user : IUser) : Promise<boolean> =>
  {
    let collection : PrettyCollection = await this.getUsersHelper();
    for(var i = 0; i < collection.length; i++)
    {
      if(collection[i].email == user.email || collection[i].username == user.username)
      {
        return true;
      }

    }
    return false;
  }

  getUserHelper = async (username : string) : Promise<IUser | null> =>
  {
    let collection : PrettyCollection = await this.getUsersHelper();
    for(var i = 0; i < collection.length; i++)
    {
      if(collection[i].username == username)
      {
        return collection[i];
      }

    }
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

  addUserHandler = async(req : Request, res : Response) : Promise<any> =>
  {
    if(!req.body || !req.body.data) { console.debug("Bad or missing body"); res.sendStatus(400); return; }
    
    let user : IUser = JSON.parse(req.body.data);
    
    if(!user.username || !user.password || !user.email) { console.debug("Insufficient user information"); res.sendStatus(400); return; }
    
    let userExists = await this.userExists(user);

    if(userExists) { console.debug("User already exisits"); res.sendStatus(409); return; }
    
    // Generate keypair for user
    let rsa_key = new Key("rsa", this);
    let dsa_key = new Key("dsa", this);

    let rsaKeyPair : IKeyPair | null = await rsa_key.createKeys();
    let dsaKeyPair : IKeyPair | null = await dsa_key.createKeys();

    let password = createHash('SHA-256').update(user.password).digest('hex')

    if(!rsaKeyPair || !dsaKeyPair) { console.debug("Could not generate one of the keypairs!"); res.sendStatus(0); return; }

    if(await this.createUser(user.username, password, user.email, {rsa: rsaKeyPair, dsa: dsaKeyPair}) != "")
    {
      res.status(200);
      res.send({ dsa: dsaKeyPair.privateKey, rsa: rsaKeyPair.privateKey });
      return;
    }

    // Most likely conflict, do more checking when we're not on a time constraint lmao
    res.status(409);
    res.send("Account Creation Failed");
  }
  
  createUser = async (username : string, password : string, email : string, userKeyPairs : IUserKeyPair) : Promise<string> =>
  {
    console.log(username, password, email, userKeyPairs)
    let user : InsertOneWriteOpResult<any> = 
    await this.client.db("452Final")
    .collection("Users")
    .insertOne(
      {
        username: username,
        password: password,
        email: email,
        rsaKey: userKeyPairs.rsa.publicKey,
        dsaKey: userKeyPairs.dsa.publicKey
      }
    );

    if(!user) { console.debug("Could not insert user!"); return ""; }

    return user.insertedId;
  }

  submitOrder = async (order : Object) : Promise<string> =>
	{
    let addingOrder = await this.client.db("452Final")
    .collection("Orders")
    .insertOne(
      order
    );

    if(!addingOrder) { console.debug("Could not add order!"); return ""; }
    return addingOrder.insertedId;
  }

  upsertItem = async (query : Object, update : Object) : Promise<ObjectId> =>
	{
    let addingItem = await this.client.db("452Final")
    .collection("Stock")
    .updateOne(
      query, update, { upsert: true }
    );

    if(!addingItem) { console.debug("Could not add item!"); throw new Error("Could not add item"); }
    return addingItem.upsertedId._id;
  }

  createServerKey = async (item : Object) : Promise<string> =>{
    let addingItem = await this.client.db("452Final")
    .collection("ServerKeys")
    .insertOne(
      item
    );

    if(!addingItem) { console.debug("Could not add item!"); return ""; }
    return addingItem.insertedId;
  }

  createOrderHandler = async (req : Request, res : Response) : Promise<void> =>
  {
    if(!req.body) { console.debug("No body provided!"); res.sendStatus(400); return; }
    let order = req.body;

    let user : string = order.user;
    if(!user) { console.debug("User not found!"); res.sendStatus(400); return; }
    
    let cart = Buffer.from(order.encryptedOrder);
    if(!cart) { console.debug("Cart not found!"); res.sendStatus(400); return; }
    
    let encryptType : EncryptType = order.encryptType;
    if(!encryptType) { console.debug("Bad Encrypt Type!"); res.sendStatus(400); return; }
    
    let signedAndEncrypted = Buffer.from(order.signedAndEncryptedOrder);
    if(!signedAndEncrypted) { console.debug("Bad Encrypt Type!"); res.sendStatus(400); return; }

    let signedOrder = crypto
    console.log(await this.key.verify(user, cart, signedAndEncrypted, encryptType))
    // let processed = await this.opd.processOrder(encryptType, cart, user);
    // if(!processed) { res.sendStatus(400); return; }

    res.status(200);
    res.send(cart);
  }

}