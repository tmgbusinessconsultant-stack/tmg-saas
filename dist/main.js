"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
let cachedServer;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
    app.setGlobalPrefix('api');
    await app.init();
    return app.getHttpAdapter().getInstance();
}
async function startLocal() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    await app.listen(4000);
    console.log('TMG Running on http://localhost:4000/api');
}
if (!process.env.VERCEL) {
    startLocal();
}
exports.default = async (req, res) => {
    if (!cachedServer) {
        cachedServer = await bootstrap();
    }
    cachedServer(req, res);
};
//# sourceMappingURL=main.js.map