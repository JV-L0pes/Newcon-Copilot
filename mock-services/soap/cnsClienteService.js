/**
 * Serviço SOAP para consulta de cliente (cnsCliente)
 * Implementação completa com parsing XML e dados mockados
 */

const xml2js = require('xml2js');
const xmlbuilder = require('xmlbuilder');

// Dados mockados de clientes
const MOCK_CLIENTES = [
    {
        cgc_cpf_cliente: "12345678901",
        nome: "João Silva Santos",
        documento: "123456789",
        orgao_emissor: "SSP-SP",
        data_exp_doc: "2020-01-15T00:00:00",
        naturalidade: "São Paulo",
        uf_doc_cliente: "SP",
        nacionalidade: "Brasileira",
        data_nascimento: "1985-06-20T00:00:00",
        estado_civil: "S",
        sexo: "M",
        celular: "11987654321",
        e_mail: "joao.silva@email.com",
        valor_renda_mensal: 5500.00,
        codigo_profissao: 1234,
        pessoa: "F"
    },
    {
        cgc_cpf_cliente: "98765432100",
        nome: "Maria Oliveira Costa",
        documento: "987654321",
        orgao_emissor: "SSP-RJ",
        data_exp_doc: "2019-03-10T00:00:00",
        naturalidade: "Rio de Janeiro",
        uf_doc_cliente: "RJ",
        nacionalidade: "Brasileira",
        data_nascimento: "1990-12-05T00:00:00",
        estado_civil: "C",
        sexo: "F",
        celular: "21987654321",
        e_mail: "maria.oliveira@email.com",
        valor_renda_mensal: 8200.50,
        codigo_profissao: 2345,
        pessoa: "F"
    },
    {
        cgc_cpf_cliente: "12345678000190",
        nome: "Empresa Exemplo LTDA",
        documento: "12345678000190",
        orgao_emissor: "JUCEG",
        data_exp_doc: "2018-08-25T00:00:00",
        naturalidade: "",
        uf_doc_cliente: "GO",
        nacionalidade: "Brasileira",
        data_nascimento: "2018-08-25T00:00:00",
        estado_civil: "",
        sexo: "",
        celular: "62987654321",
        e_mail: "contato@empresaexemplo.com.br",
        valor_renda_mensal: 25000.00,
        codigo_profissao: 0,
        pessoa: "J"
    }
];

class CnsClienteService {
    static async handleSoapRequest(req, res) {
        try {
            // Se o header Accept pedir JSON, retorna JSON direto
            if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
                return res.json({
                    cpf_cnpj: "12345678901",
                    nome: "João Silva Santos",
                    renda: "R$ 5.500",
                    tipo_pessoa: "F",
                    status: "Regular"
                });
            }
            console.log('🧼 Processando requisição SOAP...');
            
            // Verificar Content-Type
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('text/xml')) {
                return res.status(400).send('Content-Type deve ser text/xml para requisições SOAP');
            }

            // Parse do XML
            const parser = new xml2js.Parser({ 
                explicitArray: false, 
                ignoreAttrs: false,
                tagNameProcessors: [xml2js.processors.stripPrefix]
            });

            const result = await parser.parseStringPromise(req.body);
            console.log('📋 XML Parsed:', JSON.stringify(result, null, 2));
            
            // Extrair dados do envelope SOAP
            const envelope = result.Envelope || result.envelope;
            const body = envelope.Body || envelope.body;
            
            if (!body || !body.cnsCliente) {
                return res.status(400).send('Envelope SOAP inválido - método cnsCliente não encontrado');
            }

            const params = body.cnsCliente;
            
            // Extrair parâmetros (com fallbacks para diferentes casos)
            const cpfCnpj = params.Cgc_Cpf_Cliente || params.cgc_Cpf_Cliente || params['Cgc_Cpf_Cliente'] || params.cpf_cnpj;
            const tipo = params.Tipo || params.tipo;
            const pessoa = params.Pessoa || params.pessoa;
            const tipoGrupo = params.Tipo_Grupo || params.tipo_Grupo;

            console.log('📝 Parâmetros extraídos:', { cpfCnpj, tipo, pessoa, tipoGrupo });

            // Buscar cliente
            const cliente = this.buscarCliente(cpfCnpj, pessoa);
            
            let responseXml;
            if (cliente) {
                console.log('✅ Cliente encontrado:', cliente.nome);
                responseXml = this.criarRespostaSucesso(cliente);
            } else {
                console.log('❌ Cliente não encontrado');
                responseXml = this.criarRespostaErro('Cliente não encontrado para o CPF/CNPJ informado');
            }

            // Retornar resposta SOAP
            res.set({
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '""'
            });
            
            res.send(responseXml);

        } catch (error) {
            console.error('❌ Erro SOAP:', error);
            const errorXml = this.criarRespostaErro(`Erro interno: ${error.message}`);
            res.status(500).set('Content-Type', 'text/xml; charset=utf-8');
            res.send(errorXml);
        }
    }

    static buscarCliente(cpfCnpj, pessoa = null) {
        if (!cpfCnpj) return null;
        
        const normalizedCpf = cpfCnpj.replace(/\D/g, '');
        
        let cliente = MOCK_CLIENTES.find(c => 
            c.cgc_cpf_cliente.replace(/\D/g, '') === normalizedCpf
        );

        // Filtrar por tipo de pessoa se especificado
        if (cliente && pessoa && cliente.pessoa !== pessoa.toUpperCase()) {
            return null;
        }

        return cliente;
    }

    static criarRespostaSucesso(cliente) {
        const envelope = xmlbuilder.create('soap:Envelope', { version: '1.0', encoding: 'UTF-8' })
            .att('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/')
            .att('xmlns:tns', 'http://tempuri.org/');

        const body = envelope.ele('soap:Body');
        const response = body.ele('tns:cnsClienteResponse');

        // Adicionar dados do cliente
        response.ele('Nome', cliente.nome);
        response.ele('Cgc_Cpf_Cliente', this.formatarCpfCnpj(cliente.cgc_cpf_cliente));
        response.ele('Documento', cliente.documento);
        response.ele('Orgao_Emissor', cliente.orgao_emissor);
        response.ele('Data_Exp_Doc', cliente.data_exp_doc);
        response.ele('Naturalidade', cliente.naturalidade);
        response.ele('UF_Doc_Cliente', cliente.uf_doc_cliente);
        response.ele('Nacionalidade', cliente.nacionalidade);
        response.ele('Data_Nascimento', cliente.data_nascimento);
        response.ele('Estado_Civil', cliente.estado_civil);
        response.ele('Sexo', cliente.sexo);
        response.ele('Celular', cliente.celular);
        response.ele('E_Mail', cliente.e_mail);
        response.ele('Valor_Renda_Mensal', cliente.valor_renda_mensal.toFixed(2));
        response.ele('Codigo_Profissao', cliente.codigo_profissao);
        response.ele('Pessoa', cliente.pessoa);
        response.ele('ErrMsg', '');

        return envelope.end({ pretty: true });
    }

    static criarRespostaErro(mensagem) {
        const envelope = xmlbuilder.create('soap:Envelope', { version: '1.0', encoding: 'UTF-8' })
            .att('xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/')
            .att('xmlns:tns', 'http://tempuri.org/');

        const body = envelope.ele('soap:Body');
        const response = body.ele('tns:cnsClienteResponse');

        response.ele('Nome', '');
        response.ele('Cgc_Cpf_Cliente', '');
        response.ele('Data_Nascimento', '');
        response.ele('Valor_Renda_Mensal', '0.00');
        response.ele('ErrMsg', mensagem);

        return envelope.end({ pretty: true });
    }

    static formatarCpfCnpj(documento) {
        if (!documento) return '';
        
        const digits = documento.replace(/\D/g, '');
        
        if (digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (digits.length === 14) {
            return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        return digits;
    }

    static generateWsdl(req, res) {
        const wsdl = `<?xml version="1.0" encoding="utf-8"?>
<wsdl:definitions xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" 
                  xmlns:tns="http://tempuri.org/" 
                  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" 
                  xmlns:xs="http://www.w3.org/2001/XMLSchema"
                  targetNamespace="http://tempuri.org/">
  
  <wsdl:types>
    <xs:schema targetNamespace="http://tempuri.org/">
      <xs:element name="cnsCliente">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="Cgc_Cpf_Cliente" type="xs:string"/>
            <xs:element name="Tipo" type="xs:int"/>
            <xs:element name="Pessoa" type="xs:string" minOccurs="0"/>
            <xs:element name="Tipo_Grupo" type="xs:string" minOccurs="0"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
      
      <xs:element name="cnsClienteResponse">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="Nome" type="xs:string"/>
            <xs:element name="Cgc_Cpf_Cliente" type="xs:string"/>
            <xs:element name="Data_Nascimento" type="xs:dateTime"/>
            <xs:element name="Valor_Renda_Mensal" type="xs:decimal"/>
            <xs:element name="ErrMsg" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>
  </wsdl:types>
  
  <wsdl:message name="cnsClienteRequest">
    <wsdl:part name="parameters" element="tns:cnsCliente"/>
  </wsdl:message>
  
  <wsdl:message name="cnsClienteResponse">
    <wsdl:part name="parameters" element="tns:cnsClienteResponse"/>
  </wsdl:message>
  
  <wsdl:portType name="NewconServicePortType">
    <wsdl:operation name="cnsCliente">
      <wsdl:input message="tns:cnsClienteRequest"/>
      <wsdl:output message="tns:cnsClienteResponse"/>
    </wsdl:operation>
  </wsdl:portType>
  
  <wsdl:binding name="NewconServiceBinding" type="tns:NewconServicePortType">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="cnsCliente">
      <soap:operation soapAction="http://tempuri.org/cnsCliente"/>
      <wsdl:input>
        <soap:body use="literal"/>
      </wsdl:input>
      <wsdl:output>
        <soap:body use="literal"/>
      </wsdl:output>
    </wsdl:operation>
  </wsdl:binding>
  
  <wsdl:service name="NewconService">
    <wsdl:port name="NewconServicePort" binding="tns:NewconServiceBinding">
      <soap:address location="http://localhost:3000/ws/ws_newcon.asmx"/>
    </wsdl:port>
  </wsdl:service>
  
</wsdl:definitions>`;

        res.set({
            'Content-Type': 'text/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        });
        
        res.send(wsdl);
    }
}

module.exports = {
    handleSoapRequest: CnsClienteService.handleSoapRequest.bind(CnsClienteService),
    generateWsdl: CnsClienteService.generateWsdl.bind(CnsClienteService)
};