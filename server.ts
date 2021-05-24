import App from './src/app';

// Services
import { Login } from './src/services/login';

const PORT : number = 8000;
const app = new App
({
    port: PORT,
    controllers: [
    ]
});

app.listen();
