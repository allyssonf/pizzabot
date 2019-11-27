require('dotenv').config();

const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const WatsonAssistant = require('./config/bot.js');

// Parâmetros da aplicação
const applicationPort = process.env.PORT || 3000;

// Chave do serviço Watson Assistant
const apiKey = process.env.API_KEY || '';

// Id do skill do serviço Watson Assistant
const workspaceId = process.env.WORKSPACE_ID || '';

// URL do banco de dados
const dbURL = process.env.CLOUDANT || '';

// Nome do banco de dados
const dbName = process.env.DATABASE || '';

const app = express();
const assistant = new WatsonAssistant(apiKey, workspaceId, dbURL, dbName);

// configuração da aplicação web
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// Configuração do Express
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

// Rota Principal
app.get('/', routes.chat);

// Rota do Watson Assistant
app.post('/api/watson', (req, res) => {
    assistant.sendMessage(req.body.msg, response => {
        res.json({ message: response });
    });
});

// Rota para pegar todas os pedidos de pizza
app.get('/api/orders', (req, res) => {
    assistant.getOrders(response => {
        res.json({ orders: response });
    });
});

app.listen(applicationPort, '0.0.0.0', () => {
    console.log(`Express server listening on port ${applicationPort}`);
});