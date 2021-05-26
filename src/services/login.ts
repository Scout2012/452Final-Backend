import * as express from 'express';
import { sha256 } from 'js-sha256';
import { Database } from './database';
import { Request, Response, Router } from "express";
import IControllerBase from '../interfaces/IControllerBase';

const URI = process.env["MongoURI"] || "mongodb://localhost:27017/";

export class Login implements IControllerBase
{
  public path : string;
  public router : any;
  private database : Database;

  constructor(database : Database) {

    this.path = '/user/login';
    this.router = Router();
    this.database = database;
    this.initRoutes();
  }

  public initRoutes = () : void =>
  {
    this.router.use(express.json());
    this.router.post("/user/login", this.validateLoginHandler);
  }

  validateLoginHandler = async (req : Request, res : Response) : Promise<void> =>
  {
    if(!req.body) { console.debug("No body included."); res.sendStatus(400); return; }
    
    // TODO: Type user
    let user_data = req.body;
    
    if(!user_data.username) { console.debug("No username included."); res.sendStatus(400); return; }
    if(!user_data.password) { console.debug("No password included."); res.sendStatus(400); return; }
    
    let user = await this.database.getUserHelper(user_data.username);
    if(!user) { console.debug("User not in system yet!"); res.sendStatus(401); return; }
    if(user?.password != sha256(user_data.password)) { res.sendStatus(401); return; }
    //Send 200!
    console.log("OK!");
    res.sendStatus(200);
  }

}
