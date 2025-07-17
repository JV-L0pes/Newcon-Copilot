/**
 * Serviço REST para validação de documentos
 * Implementa login, validação de docs e histórico
 */

const AuthService = require('../shared/authService');

// Simulação de dados de validação
const HISTORICO_CONSULTAS = new Map();

class ValidaDocsService {
    static async login(req, res) {
        try {
            console.log('🔐 Tentativa de login...');
            const { cod_usuario, password } = req.body;

            if (!cod_usuario || !password) {
                return res.status(400).json({
                    error: 'cod_usuario e password são obrigatórios',
                    status_code: 400
                });
            }

            // Autentica usuário
            const user = await AuthService.authenticateUser(cod_usuario, password);
            
            // Gera tokens
            const { token, refreshToken } = AuthService.generateTokens(user);

            res.json({
                token,
                refresh_token: refreshToken,
                expires_in: 3600,
                token_type: 'Bearer',
                usuario: {
                    id: user.id,
                    cod_usuario: user.cod_usuario,
                    usuario: user.usuario,
                    email: user.email,
                    status: user.status
                },
                status_code: 200
            });

        } catch (error) {
            console.error('❌ Erro no login:', error);
            res.status(401).json({
                error: error.message,
                status_code: 401
            });
        }
    }

    static async refreshToken(req, res) {
        try {
            console.log('🔄 Refresh token...');
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Refresh token não fornecido',
                    status_code: 401
                });
            }

            const refreshToken = authHeader.substring(7);
            const { token, refreshToken: newRefreshToken } = AuthService.validateRefreshToken(refreshToken);

            res.json({
                token,
                refresh_token: newRefreshToken,
                expires_in: 3600,
                token_type: 'Bearer',
                status_code: 200
            });

        } catch (error) {
            console.error('❌ Erro no refresh token:', error);
            res.status(401).json({
                error: 'Refresh token inválido',
                status_code: 401
            });
        }
    }

    static async validaDocs(req, res) {
        try {
            console.log('📄 Validando documentos...');
            const { cpf_cnpj, consulta_opc_SN } = req.body;

            if (!cpf_cnpj) {
                return res.status(400).json({
                    error: 'cpf_cnpj é obrigatório',
                    status_code: 400
                });
            }

            const consultarOrgaos = consulta_opc_SN === 'S';
            const isPessoaFisica = cpf_cnpj.replace(/\D/g, '').length === 11;

            // Verificar carência (30 dias)
            const dentroCarencia = this.verificarCarencia(cpf_cnpj);

            // Gerar resultado
            const resultado = {
                cpf_cnpj: cpf_cnpj,
                dataConsultaServidor: new Date().toISOString().split('T')[0],
                status_code: 200,
                validacao_docs: this.gerarValidacaoDocumentos()
            };

            // Adicionar consultas aos órgãos se solicitado e fora da carência
            if (consultarOrgaos && !dentroCarencia) {
                resultado.dados_spc = this.gerarDadosSPC();
                resultado.dados_serpro = this.gerarDadosSerpro(isPessoaFisica);
            } else if (consultarOrgaos && dentroCarencia) {
                resultado.msg = "Dentro do período de carência - dados da última consulta";
                // Retornar dados da última consulta se existir
                const ultimaConsulta = this.obterUltimaConsulta(cpf_cnpj);
                if (ultimaConsulta) {
                    Object.assign(resultado, ultimaConsulta);
                }
            }

            // Salvar no histórico
            this.salvarConsulta(cpf_cnpj, resultado);

            res.json(resultado);

        } catch (error) {
            console.error('❌ Erro na validação:', error);
            res.status(500).json({
                error: error.message,
                status_code: 500
            });
        }
    }

    static async historicoConsulta(req, res) {
        try {
            console.log('📋 Consultando histórico...');
            const { cpf_cnpj, ultimaConsultaSN } = req.query;

            if (!cpf_cnpj) {
                return res.status(400).json({
                    error: 'cpf_cnpj é obrigatório',
                    status_code: 400
                });
            }

            const historico = this.obterHistorico(cpf_cnpj, ultimaConsultaSN);

            res.json({
                cpf_cnpj: cpf_cnpj,
                consultas: historico,
                total_consultas: historico.length,
                status_code: 200
            });

        } catch (error) {
            console.error('❌ Erro no histórico:', error);
            res.status(500).json({
                error: error.message,
                status_code: 500
            });
        }
    }

    // Métodos auxiliares
    static verificarCarencia(cpfCnpj) {
        const key = cpfCnpj.replace(/\D/g, '');
        const consultas = HISTORICO_CONSULTAS.get(key) || [];
        
        if (consultas.length === 0) return false;
        
        const ultimaConsulta = consultas[consultas.length - 1];
        const agora = new Date();
        const dataUltima = new Date(ultimaConsulta.timestamp);
        const diferencaDias = (agora - dataUltima) / (1000 * 60 * 60 * 24);
        
        return diferencaDias < 30; // Carência de 30 dias
    }

    static salvarConsulta(cpfCnpj, resultado) {
        const key = cpfCnpj.replace(/\D/g, '');
        
        if (!HISTORICO_CONSULTAS.has(key)) {
            HISTORICO_CONSULTAS.set(key, []);
        }
        
        HISTORICO_CONSULTAS.get(key).push({
            ...resultado,
            timestamp: new Date().toISOString()
        });
    }

    static obterHistorico(cpfCnpj, ultimaConsultaSN = 'N') {
        const key = cpfCnpj.replace(/\D/g, '');
        const consultas = HISTORICO_CONSULTAS.get(key) || [];
        
        if (ultimaConsultaSN === 'S' && consultas.length > 0) {
            return [consultas[consultas.length - 1]];
        }
        
        return consultas;
    }

    static obterUltimaConsulta(cpfCnpj) {
        const historico = this.obterHistorico(cpfCnpj, 'S');
        return historico.length > 0 ? historico[0] : null;
    }

    static gerarValidacaoDocumentos() {
        return {
            renda: {
                presente: true,
                data_validade: "2025-08-15",
                valido: true,
                tipo: "holerite"
            },
            residencia: {
                presente: true,
                data_validade: "2025-12-31",
                valido: true,
                tipo: "conta_luz"
            },
            identificacao: {
                rg: {
                    presente: true,
                    data_validade: "2030-06-20",
                    valido: true
                },
                cnh: {
                    presente: false,
                    data_validade: null,
                    valido: false
                }
            }
        };
    }

    static gerarDadosSPC() {
        return {
            msg: "Consulta SPC realizada com sucesso",
            situacao: "Regular",
            possuiRestricoesSPC: false,
            score: {
                valor: 750,
                classe: "C",
                probabilidade: "15.2%"
            },
            alertas: {
                quantidade_total: "2",
                resumo: {
                    data_ultima_ocorrencia: "2024-01-15T00:00:00-03:00",
                    tipos: ["Consulta SPC", "Análise de Crédito"]
                }
            }
        };
    }

    static gerarDadosSerpro(isPessoaFisica) {
        const dataConsulta = new Date().toISOString().split('T')[0];
        
        if (isPessoaFisica) {
            return {
                msg: "Consulta Serpro já realizada nesta data",
                dataConsultaServidor: dataConsulta,
                status_code: 200,
                consumidor: {
                    "consumidor-pessoa-fisica": {
                        cpf: {
                            numero: "***.***.***-**",
                            "regiao-origem": "SAO PAULO"
                        },
                        "data-nascimento": "1985-06-20T00:00:00-03:00",
                        email: "***@***.com",
                        endereco: {
                            logradouro: "RUA DAS FLORES, 123",
                            bairro: "CENTRO",
                            cidade: "SAO PAULO",
                            uf: "SP",
                            cep: "01234-567"
                        },
                        situacao: {
                            codigo: "0",
                            descricao: "REGULAR"
                        }
                    }
                }
            };
        } else {
            return {
                msg: "Consulta Serpro já realizada nesta data",
                dataConsultaServidor: dataConsulta,
                status_code: 200,
                empresa: {
                    "razao-social": "EMPRESA EXEMPLO LTDA",
                    "nome-fantasia": "EXEMPLO",
                    cnpj: "**.***.***/****-**",
                    situacao: {
                        codigo: "02",
                        descricao: "ATIVA"
                    },
                    endereco: {
                        logradouro: "AV PRINCIPAL, 456",
                        bairro: "INDUSTRIAL",
                        cidade: "GOIANIA",
                        uf: "GO",
                        cep: "74000-000"
                    },
                    socios: [
                        {
                            nome: "João Silva",
                            qualificacao: "49",
                            "tipo-socio": "2",
                            "percentual-participacao": "50.0"
                        },
                        {
                            nome: "Maria Santos",
                            qualificacao: "49", 
                            "tipo-socio": "2",
                            "percentual-participacao": "50.0"
                        }
                    ],
                    "tipo-estabelecimento": "1"
                }
            };
        }
    }
}

module.exports = {
    login: ValidaDocsService.login.bind(ValidaDocsService),
    refreshToken: ValidaDocsService.refreshToken.bind(ValidaDocsService),
    validaDocs: ValidaDocsService.validaDocs.bind(ValidaDocsService),
    historicoConsulta: ValidaDocsService.historicoConsulta.bind(ValidaDocsService)
};