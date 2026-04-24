CREATE DATABASE IF NOT EXISTS entrevistas_network CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE entrevistas_network;

CREATE TABLE IF NOT EXISTS vagas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  local VARCHAR(255) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  linkedin VARCHAR(500),
  pretensao_salarial VARCHAR(100),
  vaga_id INT,
  tecnologias JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS perguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  texto TEXT NOT NULL,
  pontos INT DEFAULT 1,
  dificuldade ENUM('NORMAL','MEDIUM','HARD') DEFAULT 'NORMAL'
);

CREATE TABLE IF NOT EXISTS respostas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidato_id INT NOT NULL,
  pergunta_id INT NOT NULL,
  acertou BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE,
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resposta (candidato_id, pergunta_id)
);

-- Seed questions from PDF
INSERT INTO perguntas (categoria, texto, pontos, dificuldade) VALUES
-- Camada 1 - Físico, Cabeamento (5Q)
('Camada 1 - Físico', 'Qual a importância de uma metragem adequada para conectar um ativo de redes?', 1, 'NORMAL'),
('Camada 1 - Físico', 'Qual a principal diferença entre o CAT6 e o CAT5?', 1, 'NORMAL'),
('Camada 1 - Físico', 'Consegue me explicar a diferença entre fibras monomodo e multimodo?', 2, 'NORMAL'),
('Camada 1 - Físico', 'Qual o benefício que traz uma interligação de fibra ponto a ponto?', 2, 'NORMAL'),
('Camada 1 - Físico', 'Quais são as considerações ao escolher um cabo blindado ou não blindado?', 2, 'NORMAL'),
-- Camada 2 - Switch (9Q)
('Camada 2 - Switch', 'Qual a importância de ter uma estrutura segmentada por VLANs?', 1, 'NORMAL'),
('Camada 2 - Switch', 'Qual um dos principais mecanismos para evitar looping de camada 2?', 1, 'NORMAL'),
('Camada 2 - Switch', 'Me fala um pouco sobre o funcionamento do Spanning Tree.', 3, 'NORMAL'),
('Camada 2 - Switch', 'Na parte de agregação como um LACP, quais os benefícios que isso traz em uma rede?', 2, 'NORMAL'),
('Camada 2 - Switch', 'Como você evitaria que uma pessoa não autorizada distribua DHCP em uma rede?', 2, 'NORMAL'),
('Camada 2 - Switch', 'Quais as melhores práticas para uma atualização de versão de equipamentos em um ambiente?', 2, 'NORMAL'),
('Camada 2 - Switch', 'Você conhece os termos HSRP e VRRP? Saberia explicar qual utilidade e como funcionam?', 2, 'NORMAL'),
('Camada 2 - Switch', 'Como funciona o LLDP e quando ele pode ser útil?', 2, 'NORMAL'),
('Camada 2 - Switch', 'Quando se aplica um SPAN / RSPAN / ERSPAN na rede levando em consideração um Switch?', 3, 'MEDIUM'),
-- Camada 3 - Roteamento (8Q)
('Camada 3 - Roteamento', 'Qual a diferença de um roteamento estático para um roteamento dinâmico?', 2, 'NORMAL'),
('Camada 3 - Roteamento', 'Me fale um pouco sobre o OSPF e os casos de uso?', 3, 'NORMAL'),
('Camada 3 - Roteamento', 'Me fale um pouco sobre o BGP e os casos de uso?', 3, 'NORMAL'),
('Camada 3 - Roteamento', 'Você configurou o OSPF, mas não fechou a adjacência. O que consideraria no Tshoot?', 2, 'NORMAL'),
('Camada 3 - Roteamento', 'Saberia me falar um pouco sobre o LSDB, LSA e Área 0 no OSPF?', 4, 'HARD'),
('Camada 3 - Roteamento', 'Saberia me falar sobre o uso de BFD, Route Map, prefix list e atributos no BGP?', 4, 'HARD'),
('Camada 3 - Roteamento', 'Saberia me dizer um pouco sobre os principais atributos do BGP?', 4, 'HARD'),
('Camada 3 - Roteamento', 'Explique a importância do conceito de convergência em roteamento dinâmico.', 2, 'NORMAL'),
-- Camada 4 e 7 (11Q)
('Camada 4 e 7', 'O que difere o protocolo UDP para o TCP?', 1, 'NORMAL'),
('Camada 4 e 7', 'Qual a diferença entre um Firewall Stateful e Stateless?', 2, 'NORMAL'),
('Camada 4 e 7', 'Já configurou ACL? Saberia a diferença entre ACL Padrão e ACL Estendida?', 2, 'NORMAL'),
('Camada 4 e 7', 'O que você considera para configuração de um firewall?', 2, 'NORMAL'),
('Camada 4 e 7', 'O que é necessário para estabelecer uma VPN ponto a ponto?', 3, 'NORMAL'),
('Camada 4 e 7', 'Se uma VPN estiver down, como você faria um Tshoot?', 3, 'NORMAL'),
('Camada 4 e 7', 'Caso a VPN esteja UP, mas não esteja trafegando, qual Tshoot você faria?', 3, 'NORMAL'),
('Camada 4 e 7', 'O que é QoS e para que se aplica?', 2, 'NORMAL'),
('Camada 4 e 7', 'Qual a usabilidade do SD-WAN?', 2, 'NORMAL'),
('Camada 4 e 7', 'Para que servem os filtros de conteúdo em um Firewall?', 2, 'NORMAL'),
('Camada 4 e 7', 'Qual a importância dos IDS/IPS em uma rede corporativa?', 2, 'NORMAL'),
-- AWS Cloud (7Q)
('AWS Cloud', 'Qual a diferença entre uma estrutura on-premises e cloud?', 1, 'NORMAL'),
('AWS Cloud', 'Qual a diferença entre Região e Zona de disponibilidade na AWS?', 1, 'NORMAL'),
('AWS Cloud', 'Sabe descrever o que é uma VPC?', 2, 'NORMAL'),
('AWS Cloud', 'Sabe descrever o que é um Security Group?', 2, 'NORMAL'),
('AWS Cloud', 'Sabe descrever a usabilidade de um Direct Connect?', 2, 'NORMAL'),
('AWS Cloud', 'Sabe descrever o que seria um Transit Gateway?', 2, 'NORMAL'),
('AWS Cloud', 'O que é e para que serve um Load Balancer no contexto da AWS?', 2, 'NORMAL'),
-- Wi-Fi (12Q)
('Wi-Fi', 'Qual a importância de um site Survey em uma localidade quando falamos de Wi-Fi?', 2, 'NORMAL'),
('Wi-Fi', 'Qual a diferença de Atenuação e Interferência?', 1, 'NORMAL'),
('Wi-Fi', 'Em quais ocasiões considera uma estrutura de APs com ou sem controladora?', 2, 'NORMAL'),
('Wi-Fi', 'AP propagando sinal normalmente, mas endpoint fica sem conexão ao conectar. Como faria o TShoot?', 2, 'NORMAL'),
('Wi-Fi', 'Quais seriam as principais diferenças entre a frequência de 2.4GHz e 5GHz?', 2, 'NORMAL'),
('Wi-Fi', 'Quais seriam os principais problemas com o uso da rede 2.4GHz?', 2, 'NORMAL'),
('Wi-Fi', 'Quais seriam os principais problemas com o uso da rede 5GHz?', 2, 'NORMAL'),
('Wi-Fi', 'Onde se aplica uma configuração de TACACS e RADIUS?', 2, 'NORMAL'),
('Wi-Fi', 'Usuário com problemas ao acessar Wi-Fi com autenticação 802.1x. Como faria o troubleshooting?', 3, 'NORMAL'),
('Wi-Fi', 'Saberia falar um pouco sobre EAP-TLS e EAP-PEAP e onde se aplica?', 3, 'HARD'),
('Wi-Fi', 'Me fala um pouco sobre RSSI / SNR / EIRP.', 3, 'HARD'),
('Wi-Fi', 'Como você implementaria segurança em uma rede WiFi empresarial para proteger contra intrusões?', 3, 'NORMAL');
