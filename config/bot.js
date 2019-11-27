const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const Cloudant = require('@cloudant/cloudant');

/**
 * Classe do Watson Assistant
 * Encapsula o componente de acesso do assistente
 */
class WatsonAssistant {
    constructor(apikey, workspaceId, dbUrl, dbName) {
        this.assistant = new AssistantV1({
            authenticator: new IamAuthenticator({
                apikey
            }),
            url: 'https://gateway.watsonplatform.net/assistant/api/',
            version: '2018-02-16'
        });

        this.workspaceId = workspaceId;

        this.cloudant = new Cloudant({
            url: dbUrl
        });

        this.mydb = this.cloudant.db.use(dbName);

        this.context = null;
    }

    /**
     * Método de envio de mensagens para o Watson Assistant
     * @param {String} message mensagem a ser enviada.
     * @param {Function} cb função de retorno na resposta do serviço.
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
                this.context = response.result.context;

                // Envia resposta ao cliente. Não precisa esperar
                // salvar no banco pra responder.
                cb(this.processResponse(response.result));

                // Salva o pedido no banco se a condição for verdadeira.
                this.saveOrderToDB(response.result);
            }
        }).catch(err => {
            console.log(err);
            cb('Erro na chamada do Watson Assistant!');
        });
    }

    /**
     * Processa a resposta do servidor
     * @param {Object} result objeto de retorno da chamada do assistente
     * @returns {String} mensagem a ser enviada ao cliente.
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

    /**
     * Salva pedido no banco de dados se estiver completo
     * @param {JSON} data dados a serem salvos
     */
    saveOrderToDB(data) {
        if (data.context) {
            const { pizza_ordered } = data.context;
            if (pizza_ordered) {
                const { sabor, tamanho, cep } = data.context;
                const timestamp = new Date().getTime();
                this.mydb.insert({ sabor, tamanho, cep, timestamp });
            }
        }
    }

    /**
     * Retorna um vetor dos pedidos de pizza já feitos.
     * @param {Function} cb função de retorno.
     */
    getOrders(cb) {
        this.mydb.list({ include_docs: true }).then(result => {
            if (result.rows && result.rows.length > 0) {
                const returnValue = result.rows.map(elem => {
                    return elem.doc;
                });
                cb(returnValue);
            } else {
                cb([]);
            }
        }).catch(error => {
            console.log(error);
            cb([]);
        });
    }
}

module.exports = WatsonAssistant;