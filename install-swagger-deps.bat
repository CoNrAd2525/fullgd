@echo off
echo Installing Swagger dependencies...
npm install js-yaml swagger-ui-express
npm install --save-dev @types/js-yaml @types/swagger-ui-express
echo Dependencies installed successfully!
pause