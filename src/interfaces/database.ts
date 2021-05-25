import { ObjectID } from "bson";
import { KeyLike } from "crypto";
import { IKeyPair } from "./key/types";

export interface IProduct {
    _id : ObjectID;
    name : string;
    img : string;
    qty : number;
    price : string;
}

export interface IUser {
    _id : ObjectID;
    username : string;
    password : string;
    email : string;
    dsaKey: string | KeyLike;
    rsaKey: string | KeyLike;
}

export interface IOrder {
    _id? : ObjectID;
    items : IProduct[];
    total : number;
}

export interface IServerKey {
    _id : ObjectID;
    name : string;
    img : string;
    qty : number;
}

export interface IUserKeyPair {
    dsa : IKeyPair;
    rsa : IKeyPair;
}

export type CollectionName = 'Users' | 'Orders' | 'Stock' | 'ServerKeys';
export type PrettyCollection = IProduct[] | IUser[] | IOrder[] | IServerKey[];