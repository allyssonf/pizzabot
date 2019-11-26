require('dotenv').config();

const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const WatsonAssistant = require('./config/bot.js');

const applicationPort = process.env.PORT || 3000;
const apiKey = process.env.API_KEY || '';
const workspaceId = process.env.WORKSPACE_ID || '';

const app = express();
const assistant = new WatsonAssistant(apiKey, workspaceId);

// all environments
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// Express middleware configuration
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

// Main API
app.get('/', routes.chat);

// Conversation API
app.post('/api/watson', function (req, res) {
    assistant.sendMessage(req.body.msg, response => {
        console.log(response);
        res.json({ message: response });
    });
});

app.listen(applicationPort, '0.0.0.0', function () {
    console.log(`Express server listening on port ${applicationPort}`);
});