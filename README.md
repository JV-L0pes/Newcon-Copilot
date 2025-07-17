# 🚀 Projeto Newcon + Copilot Studio

Integração completa entre WebServices da Newcon e Microsoft Copilot Studio via Power Automate, com serviços mock para desenvolvimento e testes.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [API Reference](#api-reference)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🎯 Visão Geral

Este projeto implementa uma solução completa de integração entre os WebServices da Newcon e o Microsoft Copilot Studio, utilizando Power Automate como orquestrador. Inclui serviços mock para desenvolvimento, testes e validação de integrações.

### Principais Características

- ✅ **Serviços SOAP**: Implementação completa do `cnsCliente`
- ✅ **Serviços REST**: API `valida_docs` com autenticação JWT
- ✅ **Autenticação**: Sistema de login e refresh token
- ✅ **Copilot Studio**: Configurações e entidades prontas
- ✅ **Power Automate**: Templates e flows de integração
- ✅ **Testes**: Exemplos de requisições SOAP e REST

## 🔧 Funcionalidades

### WebServices Implementados

#### SOAP - cnsCliente
- Consulta de dados de clientes
- Geração automática de WSDL
- Tratamento de erros SOAP
- Validação de estrutura XML

#### REST - valida_docs
- Validação de documentos
- Autenticação JWT
- Refresh token automático
- Histórico de consultas

### Autenticação
- Login com credenciais
- Tokens JWT seguros
- Refresh token automático
- Middleware de verificação

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Copilot       │    │   Power Automate │    │   Mock Services │
│   Studio        │◄──►│                  │◄──►│   (Node.js)     │
│                 │    │                  │    │                 │
│ • APIs          │    │ • Flows          │    │ • SOAP          │
│ • Entities      │    │ • Templates      │    │ • REST          │
│ • Topics        │    │                  │    │ • Auth          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **Power Automate** (para integração completa)
- **Copilot Studio** (para configuração do chatbot)

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd projeto-newcon-copilot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente** (opcional)
```bash
# Crie um arquivo .env na raiz do projeto
PORT=3000
JWT_SECRET=sua_chave_secreta_aqui
```

4. **Execute o servidor**
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

## 🎮 Como Usar

### Iniciando o Servidor

```bash
npm run dev
```

O servidor estará disponível em:
- **Health Check**: http://localhost:3000/health
- **SOAP WSDL**: http://localhost:3000/ws/ws_newcon.asmx
- **REST API**: http://localhost:3000/

### Testando os Serviços

#### 1. Autenticação REST
```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'
```

#### 2. Validação de Documentos
```bash
# Validação com token
curl -X POST http://localhost:3000/valida_docs \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"documento": "12345678901"}'
```

#### 3. Consulta SOAP
```xml
<!-- Exemplo de requisição SOAP -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <cnsCliente>
      <cpf>12345678901</cpf>
    </cnsCliente>
  </soap:Body>
</soap:Envelope>
```

## 📚 API Reference

### Endpoints REST

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/login` | Autenticação de usuário | ❌ |
| GET | `/refreshtoken` | Renovar token | ❌ |
| POST | `/valida_docs` | Validar documentos | ✅ |
| GET | `/historicoConsultaCliente` | Histórico de consultas | ✅ |
| GET | `/health` | Status do servidor | ❌ |

### Endpoints SOAP

| Endpoint | Descrição |
|----------|-----------|
| `POST /ws/ws_newcon.asmx` | Consulta de clientes |
| `GET /ws/ws_newcon.asmx` | WSDL do serviço |

## 📁 Estrutura do Projeto

```
projeto-newcon-copilot/
├── 📁 copilot-studio/          # Configurações do Copilot Studio
│   ├── 📁 apis/               # APIs configuradas
│   ├── 📁 entities/           # Entidades do chatbot
│   └── 📁 topics/             # Tópicos de conversa
├── 📁 docs/                   # Documentação
│   ├── 📁 apis/              # Documentação das APIs
│   └── 📁 examples/          # Exemplos de uso
├── 📁 mock-services/          # Serviços mock
│   ├── 📁 rest/              # Serviços REST
│   ├── 📁 soap/              # Serviços SOAP
│   └── 📁 shared/            # Serviços compartilhados
├── 📁 power-automate/         # Configurações Power Automate
│   ├── 📁 flows/             # Flows de integração
│   └── 📁 templates/         # Templates
├── 📁 tests/                  # Testes e exemplos
│   ├── 📁 rest-requests/     # Exemplos REST
│   └── 📁 soap-requests/     # Exemplos SOAP
├── 📄 package.json           # Dependências do projeto
├── 📄 server.js              # Servidor principal
└── 📄 README.md              # Este arquivo
```

## 🧪 Testes

### Arquivos de Teste Disponíveis

- **REST**: `tests/rest-requests/valida-docs-examples.http`
- **SOAP**: `tests/soap-requests/cnsCliente-examples.xml`

### Executando Testes

```bash
# Executar testes (implementação futura)
npm test
```

### Exemplos de Uso

Consulte os arquivos na pasta `tests/` para exemplos completos de requisições e respostas.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma [issue](../../issues) no GitHub
- Consulte a documentação na pasta `docs/`
- Verifique os exemplos na pasta `tests/`

---

**Desenvolvido com ❤️ para integração Newcon + Copilot Studio**