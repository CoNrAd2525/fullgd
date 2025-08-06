import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

/**
 * Setup Swagger documentation
 * @param app Express application
 */
export const setupSwagger = (app: Express): void => {
  try {
    // Path to the Swagger YAML file
    const swaggerPath = path.resolve(__dirname, 'swagger.yaml');
    
    // Read the YAML file
    const swaggerYaml = fs.readFileSync(swaggerPath, 'utf8');
    
    // Convert YAML to JSON
    const swaggerDocument = yaml.load(swaggerYaml) as object;
    
    // Setup Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    }));
    
    console.log('Swagger documentation setup successfully');
  } catch (error) {
    console.error('Error setting up Swagger documentation:', error);
  }
};