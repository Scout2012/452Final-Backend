import { writeFile, readFileSync } from "fs";
import * as express from 'express';
import { publicDecrypt, publicEncrypt, generateKeyPair, createSign, createVerify, privateDecrypt, constants, createPrivateKey } from "crypto";
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
    this.router.get(this.path + "/publicKey", this.getServerPublicKey);
    this.router.post(this.path + "/verify", this.verifyResponse);
  }

  getServerPublicKey = async(req: Request, res: Response) : Promise<void> =>
  {

    let keyType = "public";
    let serverKeys : any = await (await this.database.getCollection("ServerKeys")).findOne({
      keyType: keyType
    })
    res.status(200);
    res.send(serverKeys);
  }

  getServerPrivateKey = async() : Promise<string> =>
  {
    let keyType = "private";
    let serverKeys = await (await this.database.getCollection("ServerKeys")).findOne({
      keyType: keyType
    });

    console.log(serverKeys)
    return serverKeys.key;
  }

  getUserPublicKey = async(userId : string, encryptType: EncryptType) : Promise<string> =>
  {
    let user = await (await this.database.getCollection("Users")).findOne({
      "_id": new ObjectId(userId)
    })
    return user[encryptType + "Key"];
  }

  base64ToArrayBuffer(base64 : any) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  verifyResponse = async(req: Request, res: Response) : Promise<void> =>
  {
    let serverPrivateKey = await this.getServerPrivateKey();
    if(!serverPrivateKey) { console.debug("Could not fetch server private keys"); res.sendStatus(0); return;}

    if(!req.body) { console.debug("No body"); res.sendStatus(400); return; }
    
    let data = req.body;
    if(!data.encryptType || !data.encryptedOrder || !data.signedAndEncryptedOrder) { console.debug("Invalid body"); res.sendStatus(400); return; }

    let keyType = req.body.encryptType;

    // Decrypt so we can verify the signature
    let verifiedAndConfidentialOrder = data.signedAndEncryptedOrder;
    
    let vAndCBuff = Buffer.from(verifiedAndConfidentialOrder, 'base64');
    let signature = privateDecrypt({key: serverPrivateKey, oaepHash: 'sha256'}, vAndCBuff)

    // Decrypt so we have something to verify against
    let confidentialOrder = Buffer.from(data.encryptedOrder, 'base64');
    let plainTextOrder = privateDecrypt({key: serverPrivateKey, oaepHash: 'sha256'}, confidentialOrder);
    let userId = data.user;
    if(await this.verify(userId, plainTextOrder, signature, keyType))
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
      let keys : IKeyPair | null = await this.createKeys()
      if(!keys) { console.log("Could not create a keypair"); return; }
      await this.savePrivateKey(keys.privateKey)
      await this.savePublicKey(id, keys.publicKey)
  }

  createServerKeys = async () : Promise<void> =>{
    let keys : IKeyPair | null = await this.createKeys();
    if(!keys) { console.log("Could not create a keypair"); return; }

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
  
  createKeys = async () : Promise<IKeyPair | null> =>
  {
    let keyPair : IKeyPair | null = null;
    let length : number = 3072;
    if(this.encryptType == 'rsa')
    {
      length = 3072
      keyPair = await new Promise((res, rej) =>
      {
        generateKeyPair('rsa', {
          modulusLength: length,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        },
          (err : Error | null, pub : string, priv : string) =>
          {
            if(err) { rej(err); }
            res({ publicKey: pub, privateKey: priv })
          }
        )
      })
    }
    else if(this.encryptType == 'dsa')
    {
      length = 3072
      keyPair = await new Promise((res, rej) =>
      {
        generateKeyPair('dsa', {
          modulusLength: length,
          divisorLength: 224,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        },
          (err : Error | null, pub : string, priv : string) =>
          {
            if(err) { console.log(err); rej(err); }
            res({ publicKey: pub, privateKey: priv })
          }
        )
      })
    }
    if(!keyPair) { console.debug("Invalid Encryption Type!"); return null; }
    return keyPair;
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
    let algorithm = this.encryptType == 'rsa' ? "RSA-SHA256" : "sha256";
    let privateKey = readFileSync("./" + this.encryptType + "Key.pem")
    return createSign(algorithm).update(order).sign({
      key: privateKey,
      passphrase: ''
    });
  }

  verify = async (id : string, order : Buffer, signature : Buffer, keyType : EncryptType) : Promise<boolean> =>
  {
    let user : IUser | null = await this.database.getUserHelper(id)

    if(!user) { console.debug(`User with ID ${id} does not exist.`); return false; }
    let publicKey;
    if(keyType == 'rsa') { publicKey = user.rsaKey }
    if(keyType == 'dsa') { publicKey = user.dsaKey }

    if(!publicKey) { console.debug("No public key with that user"); return false; }

    let algorithm = this.encryptType == 'rsa' ? "RSA-SHA256" : "sha256"
    let verify = createVerify(algorithm)
    verify.update(order)
    verify.end()
    return verify.verify(publicKey, signature)
  }

  signAndVerify = async (id: string, order: Buffer) : Promise<boolean> =>
	{
    let signature = await this.sign(order)

    return await this.verify(id, order, signature, 'rsa')
  }
}
