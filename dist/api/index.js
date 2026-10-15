"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
let cachedServer;
async function bootstrap() {
    if (!cachedServer) {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.setGlobalPrefix('api');
        app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
    }
    return cachedServer;
}
exports.default = async (req, res) => {
    const server = await bootstrap();
    server(req, res);
};
//# sourceMappingURL=index.js.map