import App from './src/app';

const PORT : number = 8000;
const app = new App
({
    port: PORT,
    controllers: [
    ]
});

app.listen();
