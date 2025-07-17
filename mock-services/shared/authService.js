/**
 * Serviço de Autenticação JWT - Versão Completa Dia 2
 */

const jwt = require('jsonwebtoken');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'newcon-mock-secret-2024';
const JWT_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

// Usuários mockados (baseado na documentação Newcon)
const MOCK_USERS = [
    {
        id: 1,
        cod_usuario: 1,
        usuario: "Vanderson",
        email: "vandorogerio@gmail.com",
        password: "suaSenha",
        status: "Ativo"
    },
    {
        id: 2,
        cod_usuario: 2,
        usuario: "Connectus",
        email: "projetos@connectus.com.br",
        password: "suaSenha",
        status: "Ativo"
    },
    // Novos usuários mockados para testes
    {
        id: 3,
        cod_usuario: 3,
        usuario: "TesteUser",
        email: "testeuser@email.com",
        password: "teste@2024",
        status: "Ativo"
    },
    {
        id: 4,
        cod_usuario: 4,
        usuario: "MockUser",
        email: "mockuser@email.com",
        password: "mockUser!45",
        status: "Ativo"
    },
    {
        id: 5,
        cod_usuario: 5,
        usuario: "NovoUsuario",
        email: "novousuario@email.com",
        password: "novaSenha#789",
        status: "Ativo"
    }
];

class AuthService {
    static async authenticateUser(cod_usuario, password) {
        try {
            console.log(`🔍 Autenticando usuário: ${cod_usuario}`);
            
            const user = MOCK_USERS.find(u => u.cod_usuario === parseInt(cod_usuario));
            
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            if (user.status !== 'Ativo') {
                throw new Error('Usuário inativo');
            }

            if (password !== user.password) {
                throw new Error('Senha incorreta');
            }

            console.log(`✅ Autenticação bem-sucedida: ${user.usuario}`);
            return user;
            
        } catch (error) {
            console.error('❌ Erro na autenticação:', error.message);
            throw error;
        }
    }

    static generateTokens(user) {
        try {
            const payload = {
                id: user.id,
                cod_usuario: user.cod_usuario,
                usuario: user.usuario,
                email: user.email,
                iat: Math.floor(Date.now() / 1000)
            };

            const token = jwt.sign(payload, JWT_SECRET, { 
                expiresIn: JWT_EXPIRES_IN,
                issuer: 'newcon-api'
            });

            const refreshToken = jwt.sign(
                { id: user.id, type: 'refresh' }, 
                JWT_SECRET, 
                { 
                    expiresIn: REFRESH_EXPIRES_IN,
                    issuer: 'newcon-api'
                }
            );

            console.log(`🎫 Tokens gerados para: ${user.usuario}`);
            return { token, refreshToken };
            
        } catch (error) {
            console.error('❌ Erro ao gerar tokens:', error);
            throw error;
        }
    }

    static verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Token não fornecido',
                    message: 'Header Authorization deve conter: Bearer <token>',
                    status_code: 401
                });
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET);
            
            req.user = decoded;
            console.log(`✅ Token válido para: ${decoded.usuario}`);
            next();
            
        } catch (error) {
            console.error('❌ Token inválido:', error.message);
            return res.status(401).json({
                error: 'Token inválido ou expirado',
                message: error.message,
                status_code: 401
            });
        }
    }

    static validateRefreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_SECRET);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Token inválido');
            }

            const user = MOCK_USERS.find(u => u.id === decoded.id);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            console.log(`🔄 Refresh token válido para: ${user.usuario}`);
            return this.generateTokens(user);
            
        } catch (error) {
            console.error('❌ Refresh token inválido:', error.message);
            throw error;
        }
    }
}

module.exports = AuthService;