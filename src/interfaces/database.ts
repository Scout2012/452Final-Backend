import { ObjectID } from "bson";
import { KeyLike } from "crypto";

export interface IProduct {
    _id : ObjectID;
    name : string;
    img : string;
    qty : number;
}

export interface IUser {
    _id : ObjectID;
    username : string;
    password : number;
    email : string;
    key: string | KeyLike;
}

export interface IOrder {
    _id : ObjectID;
    name : string;
    img : string;
    qty : number;
}

export interface IServerKey {
    _id : ObjectID;
    name : string;
    img : string;
    qty : number;
}

export type CollectionName = 'Users' | 'Orders' | 'Stock' | 'ServerKeys';
export type PrettyCollection = IProduct[] | IUser[] | IOrder[] | IServerKey[];