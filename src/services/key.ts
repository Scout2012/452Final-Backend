import { writeFile, readFileSync } from "fs";
import * as express from 'express';
import { generateKeyPair, createSign, createVerify, sign, publicDecrypt, privateDecrypt } from "crypto";
import {Database} from "./database";
import { EncryptType, IKeyPair } from '../interfaces/key/types';
import { ObjectId } from "mongodb";
import { IServerKey, IUser } from "../interfaces/database";
import { Router, Request, Response } from "express";
import IControllerBase from "../interfaces/IControllerBase";

export class Key implements IControllerBase
{
  encryptType : EncryptType; 
  router : any;
  database : Database;
  path : string;

  constructor(encryptType : EncryptType, database : Database)
  {
      this.path = '/key';
      this.encryptType = encryptType;
      this.router = Router();
      this.database = database;

      this.initRoutes();
  }

  public initRoutes = () : void =>
  {
    this.router.use(express.json());
    this.router.post(this.path + "/publicKey", this.getServerPublicKey);
    this.router.post(this.path + "/verify", this.verifyResponse);
  }

  getServerPublicKey = async(req: Request, res: Response) : Promise<void> =>
  {
    if(!req.body || !req.body.encryptType) { console.debug("Bad Request"); res.sendStatus(400); return; }

    let keyType = "public" + req.body.encryptType;
    let serverKeys : any = await (await this.database.getCollection("ServerKeys")).findOne({
      keyType: keyType
    })
    res.status(200);
    res.send(serverKeys[keyType]);
  }

  getServerPrivateKey = async() : Promise<string> =>
  {
    let keyType = "private";
    let serverKeys = await (await this.database.getCollection("ServerKeys")).findOne({
      keyType: keyType
    })
    return serverKeys[keyType];
  }

  getUserPublicKey = async(userId : string, encryptType: EncryptType) : Promise<string> =>
  {
    let user = await (await this.database.getCollection("Users")).findOne({
      "_id": new ObjectId(userId)
    })
    return user[encryptType + "Key"];
  }

  verifyResponse = async(req: Request, res: Response) : Promise<void> =>
  {
    if(!req.body  || !req.body.id || !req.body.encryptedOrder || !req.body.encryptedOrder) { console.debug("Bad Request"); res.sendStatus(400); return; }
    
    let encryptedOrder = req.body.encryptedOrder;
    let encryptType = req.body.encryptType;
    let userId = req.body.id;
    let userPublicKey = await this.getUserPublicKey(userId, encryptType)
    let serverPrivateKey = await this.getServerPrivateKey();
    let serverPrivateDecrypt= privateDecrypt(serverPrivateKey, Buffer.from(encryptedOrder, "utf-8"))
    let plainText = publicDecrypt(userPublicKey, Buffer.from(serverPrivateDecrypt)).toString();
    console.log(plainText)
    
    if(this.isOrder(plainText))
    {
      res.send("order verified");
      res.status(200);
    }
    res.send("order denied");
    res.status(406);
  }

  isOrder = async(plainText : string) : Promise<boolean> =>
  {
    let keys = ["_id", "userId", "items", "total", "date"];
    let order = JSON.parse(plainText);
    Object.keys(order).forEach(function(key) {
      if(!keys.includes(key)){
        return false;
      }
      });
    return true;
  }
  
  createAndStoreKeys = async (id : string) =>
  {
      let keys : IKeyPair = await this.createKeys()
      await this.savePrivateKey(keys.privateKey)
      await this.savePublicKey(id, keys.publicKey)
  }

  createServerKeys = async () : Promise<void> =>{
    let keys = await this.createKeys();
    let publicKey = {
      keyType: "public" + this.encryptType,
      key: keys.publicKey
    }
    let privateKey = {
      keyType: "private" + this.encryptType,
      key: keys.privateKey
    }
    await this.database.createServerKey(publicKey);
    await this.database.createServerKey(privateKey);
  }

  createKeys = async () : Promise<IKeyPair> =>
  {
    return new Promise((res, rej) =>
      {
        generateKeyPair("rsa", {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: 'top secret'
          }
        },
          (err : Error | null, pub : string, priv : string) =>
          {
            if(err) { rej(err); }
            res({ publicKey: pub, privateKey: priv })
          }
        )
      }
    )
  }
  
  savePrivateKey = async (privateKey : string) : Promise<void> =>
  {
    return new Promise((res, rej) =>
      {
        writeFile(this.encryptType + 'Key.pem', privateKey, (err) =>
          {
            if(err) { rej(err); }
            res();
          }
        )
      }
    )
  }

  savePublicKey = async (id : string, publicKey : string) : Promise<void> =>
  {
      let filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $set: {
          "key": publicKey
        }
      }
      await this.database.upsertItem(filter, updateDoc);
  }

  sign = async (order : string) : Promise<Buffer> =>
	{
    let privateKey = readFileSync("./" + this.encryptType + "Key.pem")
    return createSign(this.encryptType.toUpperCase() + "-SHA1").update(order).sign({
      key: privateKey,
      passphrase: 'top secret'
    });
  }

  verify = async (id : string, order : string, signature : Buffer) : Promise<boolean> =>
  {
      let user : IUser | null = await this.database.getUserHelper(id)

      if(!user) { console.debug(`User with ID ${id} does not exist.`); return false; }
      
      let publicKey = user.key
      let verify = createVerify(this.encryptType.toUpperCase() + "-SHA1")
      verify.update(order)
      verify.end()
      return verify.verify(publicKey, signature)
  }

  signAndVerify = async (id: string, order: string) : Promise<boolean> =>
	{
    let signature = await this.sign(order)

    return await this.verify(id, order, signature)
  }
}
