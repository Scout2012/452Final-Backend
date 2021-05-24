import express from 'express';
import { Application } from 'express';
import cors from 'cors'
import { Database } from './services/database'
import IControllerBase from './interfaces/IControllerBase';
import { Login } from './services/login';

class App
{
    public app: Application;
    public port: number;

    constructor(appInit: { port: number, middlewares?: any ,controllers?: IControllerBase[] })
    {
        this.app = express();
        this.port = appInit.port;

        if(appInit.middlewares){ this.middlewares(appInit.middlewares); }
        if(appInit.controllers){ this.routes(appInit.controllers); }
    }

    private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; })
    {
        middleWares.forEach(middleWare =>
        {
            this.app.use(middleWare);
        })
    }

    private routes(controllers: { forEach: (arg0: (controller: IControllerBase) => void) => void; })
    {
        controllers.forEach(controller =>
        {
            this.app.use("/", controller.router);
        });
    }

    public listen()
    {
        this.app.listen(this.port, () => 
        {
            // TODO: Remove this(?)
            this.app.use(cors())
            this.app.use(express.json());
            
            // Need to init the database here and skip the routes function of this
            // because we need to connect to the database before anything.
            let database = new Database();
            this.app.use("/", database.router)

            database.connect().then(() => {
                this.app.use("/", new Login(database).router);
                console.log(`App listening on the http://localhost:${this.port}`);
            })
        });
    }
}

export default App;