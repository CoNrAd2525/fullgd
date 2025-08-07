"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
/**
 * Setup Swagger documentation
 * @param app Express application
 */
const setupSwagger = (app) => {
    try {
        // Path to the Swagger YAML file
        const swaggerPath = path_1.default.resolve(__dirname, 'swagger.yaml');
        // Read the YAML file
        const swaggerYaml = fs_1.default.readFileSync(swaggerPath, 'utf8');
        // Convert YAML to JSON
        const swaggerDocument = js_yaml_1.default.load(swaggerYaml);
        // Setup Swagger UI
        app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            swaggerOptions: {
                docExpansion: 'none',
                filter: true,
                showRequestDuration: true,
            },
        }));
        console.log('Swagger documentation setup successfully');
    }
    catch (error) {
        console.error('Error setting up Swagger documentation:', error);
    }
};
exports.setupSwagger = setupSwagger;
