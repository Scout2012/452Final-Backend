import { Router } from 'express'

export default interface IControllerBase
{
    path : string,
    router() : any,
    initRoutes(): any;
}