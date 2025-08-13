# 🎲 Bot de RPG para Discord

Um bot de RPG completo para Discord com sistema de rolagem de dados, inventário e fichas 3D&T!

## ✨ Funcionalidades

### 🎲 Sistema de Rolagem
- **`/roll [entrada]`** - Rola dados com modificadores
- Mensagens personalizadas com humor baiano e memes
- Suporte a qualquer dado (d20, d6, d100, etc.)
- Modificadores opcionais (+5, -2, etc.)

### 🎒 Sistema de Inventário
- **`/inventario [item]`** - Exibe inventário ou detalhes de item
- **`/add-inventario item [quantidade]`** - Adiciona item ao inventário
- **`/remove-inventario item [quantidade]`** - Remove item do inventário
- Sistema de peso dinâmico baseado na força do personagem
- Autocomplete para nomes de itens

### 📝 Sistema de Fichas 3D&T
- **`/ficha criar`** - Cria uma nova ficha de personagem 3D&T
- **`/ficha ver`** - Exibe sua ficha de personagem
- **`/ficha editar`** - Edita sua ficha de personagem
- Interface modal para criação de fichas
- Cálculos automáticos de PV, PM, Força de Ataque e Defesa
- Sistema fiel ao 3D&T 3ª Edição Alpha

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd rpgbot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
TOKEN=seu_token_do_bot
CLIENT_ID=id_do_seu_bot
GUILD_ID=id_do_seu_servidor
```

4. **Registre os comandos slash**
```bash
npm run deploy
```

5. **Inicie o bot**
```bash
npm start
```

## 📋 Comandos Disponíveis

### 🎲 Rolagem de Dados
```
/roll 2d20 +3
/roll d20 -1
/roll 6
/roll
```
- Você pode usar: `ndn`, `d20`, `6`, `+2`, `-1` ou combinar tudo em uma linha
- Exemplos: `/roll 3d6 +2`, `/roll d100`, `/roll 20`, `/roll -1`

### 🎒 Inventário
```
/inventario
/inventario espada
/add-inventario espada_ferro 3
/remove-inventario pocao_cura 1
```

### 📝 Fichas 3D&T
```
/ficha criar
/ficha ver
/ficha editar
```
**Características do 3D&T:**
- **Força, Habilidade, Resistência, Armadura, Poder de Fogo**
- **PV = Resistência, PM = Habilidade**
- **Força de Ataque: H + F + 1d (corpo-a-corpo) ou H + PdF + 1d (longa distância)**
- **Força de Defesa: H + A + 1d**

## 🛠️ Configuração do Cargo RPG

O bot verifica se o usuário possui o cargo específico **"Rpg homens"** para usar os comandos de inventário.

**Importante**: O nome do cargo deve ser exatamente **"Rpg homens"** (com R maiúsculo e espaço).

## 📁 Estrutura do Projeto

```
rpgbot/
├── src/
│   ├── commands/
│   │   ├── roll.js
│   │   ├── inventario.js
│   │   ├── add-inventario.js
│   │   └── remove-inventario.js
│   ├── messages/
│   │   ├── rollMessages.json
│   ├── data/
│   │   ├── itens.json
│   │   └── inventarios.json
│   ├── utils/
│   │   └── inventarioUtils.js
│   └── index.js
├── deploy-commands.js
├── package.json
└── README.md
```

## 🎯 Itens Disponíveis

O sistema inclui diversos tipos de itens:
- **Armas**: Espada de Ferro, Varinha de Fogo
- **Armaduras**: Escudo de Madeira, Armadura de Couro
- **Consumíveis**: Poção de Cura

## 🔧 Personalização

### Adicionando Novos Itens
Edite `src/data/itens.json` para adicionar novos itens:

```json
{
  "id": "novo_item",
  "nome": "Nome do Item",
  "descricao": "Descrição do item",
  "tipo": "arma",
  "raridade": "comum",
  "peso": 2,
  "valor": 50
}
```

### Personalizando Mensagens
Edite `src/messages/rollMessages.json` para personalizar as mensagens de rolagem.
