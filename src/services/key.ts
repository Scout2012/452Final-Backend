import { writeFile, readFileSync } from "fs";
import * as express from 'express';
import { publicDecrypt, publicEncrypt, generateKeyPair, createSign, createVerify, privateDecrypt } from "crypto";
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

    let keyType = "public";
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
    let serverPrivateKey = await this.getServerPrivateKey();

    let verifiedAndConfidentialOrder = req.body.verifiedAndConfidentialOrder;
    let signature = privateDecrypt(serverPrivateKey, Buffer.from(verifiedAndConfidentialOrder, "utf-8"))

    let confidentialOrder = req.body.confidentialOrder;
    let plainTextOrder = privateDecrypt(serverPrivateKey, Buffer.from(confidentialOrder));

    let userId = req.body.id;
    if(this.verify(userId, plainTextOrder, signature))
    {
      res.status(200);
      res.send("order verified");
      return;
    }
    res.status(406);
    res.send("order denied");
  }

  isOrder = async(plainText : string) : Promise<boolean> =>
  {
    let keys = ["_id", "userId", "items", "total", "date"];
    let order = JSON.parse(plainText);
    let verified = true;
    Object.keys(order).forEach(function(key) {
      if(!keys.includes(key)){
        verified = false;
      }
      });
    return verified;
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
      keyType: "public",
      key: keys.publicKey
    }
    let privateKey = {
      keyType: "private",
      key: keys.privateKey
    }
    await this.database.createServerKey(publicKey);
    await this.database.createServerKey(privateKey);
  }

  
  createKeys = async () : Promise<IKeyPair> =>
  {
    let length = this.encryptType=='rsa' ? 3072 : 2048 
    return new Promise((res, rej) =>
      {
        generateKeyPair(this.encryptType, {
          modulusLength: length,
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

  sign = async (order : Buffer) : Promise<Buffer> =>
	{
    let algorithm = this.encryptType == 'rsa' ? "RSA-SHA1" : "sha1";
    let privateKey = readFileSync("./" + this.encryptType + "Key.pem")
    return createSign(algorithm).update(order).sign({
      key: privateKey,
      passphrase: ''
    });
  }

  verify = async (id : string, order : Buffer, signature : Buffer) : Promise<boolean> =>
  {
      let user : IUser | null = await this.database.getUserHelper(id)

      if(!user) { console.debug(`User with ID ${id} does not exist.`); return false; }
      
      let publicKey = user.key
      let algorithm = this.encryptType == 'rsa' ? "RSA-SHA1" : "sha1"
      let verify = createVerify(algorithm)
      verify.update(order)
      verify.end()
      return verify.verify(publicKey, signature)
  }

  signAndVerify = async (id: string, order: Buffer) : Promise<boolean> =>
	{
    let signature = await this.sign(order)

    return await this.verify(id, order, signature)
  }
}
