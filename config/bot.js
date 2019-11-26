const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

/**
 * Watson Assistant Class
 * This class encapsulates IBM AssistantV1 calls
 */
class WatsonAssistant {
    constructor() {
        this.assistant = new AssistantV1({
            authenticator: new IamAuthenticator({
                apikey: process.env.API_KEY || ''
            }),
            url: 'https://gateway.watsonplatform.net/assistant/api/',
            version: '2018-02-16'
        });

        this.workspaceId = process.env.WORKSPACE_ID || '';

        this.context = null;
    }

    /**
     * Send message to Watson Assistant Service
     * @param {String} message message to be sent to server.
     * @param {Function} cb callback to be fired on service response.
     */
    sendMessage(message, cb) {
        const params = {
            input: {
                text: message || ''
            },
            workspaceId: this.workspaceId
        };

        if (this.context) {
            params.context = this.context;
        } else {
            params.context = {};
            params.context.timezone = "America/Sao_Paulo";
        }

        this.assistant.message(params).then(response => {
            if (response && response.result) {
                console.log(JSON.stringify(response.result));

                this.context = response.context;
                cb(this.processResponse(response.result));
            }
        }).catch(err => {
            console.log(err);
            cb('Erro na chamada do Watson Assistant!');
        });
    }

    /**
     * Process service response
     * @param {Object} result response from Watson Assistant API Call
     * @returns {String} message to be sent to client
     */
    processResponse(result) {
        let resultMessage = 'Erro ao processar resposta do Watson Assistant!';

        if (result.output &&
            result.output.text &&
            result.output.text.length > 0) {
            resultMessage = result.output.text[0];
        }

        return resultMessage;
    }
}

module.exports = WatsonAssistant;