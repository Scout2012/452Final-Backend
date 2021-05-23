import { writeFile, readFileSync } from "fs";
import { generateKeyPair, createSign, createVerify, sign } from "crypto";
import {Database} from "./database";
import { EncryptType, IKeyPair } from '../interfaces/key/types';
import { ObjectId } from "mongodb";

export class Key
{
  encryptType : EncryptType; 
  database : Database;

  constructor(encryptType : EncryptType, database : Database)
  {
      this.encryptType = encryptType;
      this.database = database;
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
      keyType: "public"+this.encryptType,
      key: keys.publicKey
    }
    let privateKey = {
      keyType: "private"+this.encryptType,
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
      let users = await this.database.getUsers()
      let filter = { _id: new ObjectId(id) }
      let keyStringName = this.encryptType+"Key"
      let updateDoc = {
        $set: {
          [keyStringName]: publicKey
        }
      }
      await users.updateOne(filter, updateDoc);
  }

  sign = async (order : string) : Promise<Buffer> =>
	{
    let privateKey = readFileSync("./" + this.encryptType + "Key.pem")
    var signature = createSign(this.encryptType.toUpperCase() + "-SHA1").update(order).sign({
      key: privateKey,
      passphrase: 'top secret'
    });
    return signature
  }

  verify = async (id : string, order : string, signature : Buffer) : Promise<boolean> =>
  {
      let user = await this.database.getUserHelper(id)
      
      let publicKey = user[this.encryptType + "Key"]
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
