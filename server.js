/**
 * Mock Server para WebServices Newcon - Dia 2
 * Implementa SOAP (cnsCliente) e REST (valida_docs) completos
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar services que vamos criar
const soapService = require('./mock-services/soap/cnsClienteService');
const restService = require('./mock-services/rest/validaDocsService');
const authService = require('./mock-services/shared/authService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'SOAPAction']
}));

app.use(bodyParser.text({ type: 'text/xml' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.headers.authorization) {
        console.log('🔑 Token presente:', req.headers.authorization.substring(0, 20) + '...');
    }
    next();
});

// Rotas SOAP
app.post('/ws/ws_newcon.asmx', soapService.handleSoapRequest);
app.get('/ws/ws_newcon.asmx', soapService.generateWsdl);

// Rotas REST
app.post('/login', restService.login);
app.get('/refreshtoken', restService.refreshToken);
app.post('/valida_docs', authService.verifyToken, restService.validaDocs);
app.get('/historicoConsultaCliente', authService.verifyToken, restService.historicoConsulta);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Mock Server Newcon - Dia 2 Completo!',
        services: {
            soap: 'cnsCliente ✅ IMPLEMENTADO',
            rest: 'valida_docs ✅ IMPLEMENTADO',
            auth: 'JWT ✅ IMPLEMENTADO'
        }
    });
});

// Tratamento de erro global
app.use((error, req, res, next) => {
    console.error('❌ Erro:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});

// Inicialização
app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log(`🚀 Mock Server Newcon - DIA 2`);
    console.log('🚀 ================================');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
    console.log(`🧼 SOAP: http://localhost:${PORT}/ws/ws_newcon.asmx`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`📄 Docs: http://localhost:${PORT}/valida_docs`);
    console.log('🚀 ================================');
    console.log('✅ WebServices IMPLEMENTADOS!');
});

module.exports = app;