# API do Portfólio Escolar

API REST em Express e Sequelize 6 para registrar matérias do SESI e do SENAI e organizar atividades e reflexões por bimestre.

## Executar com o Supabase

O servidor Express se conecta ao PostgreSQL do Supabase com Sequelize. No painel do seu projeto, abra **Connect → Session pooler** e copie a URL da porta **5432**. Se você usa uma rede com IPv6, a opção **Direct connection** também funciona. [Guia de conexão do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)

Na pasta do projeto, execute:

```powershell
npm install
Copy-Item .env.example .env
```

No arquivo `.env`, preencha `DATABASE_URL` com a URL do painel e substitua o marcador de senha pela senha do banco. Se a senha tiver caracteres reservados, codifique-os na URL. Por exemplo, use `%40` para `@` e `%23` para `#`. Mantenha a URL no ambiente do servidor.

A conexão usa TLS com validação do certificado. Se precisar informar a CA, baixe o certificado em **Database Settings** e configure `DB_SSL_CA_PATH` com o caminho do arquivo. Use `DB_SSL=false` somente para um PostgreSQL de teste local sem TLS. [Certificados do Supabase](https://supabase.com/docs/guides/database/psql)

Execute `npm start` para iniciar a API na porta 3333. A primeira execução cria o esquema `portfolio_escolar` e suas tabelas no Supabase. O usuário do banco precisa ter permissão para criá-los. O Express continua sendo executado onde você rodar a API. Para alterar a porta, configure `PORT`. Para reiniciar o servidor automaticamente durante o desenvolvimento, use `npm run dev`.

Registros de um banco MySQL anterior exigem uma migração de dados própria.

## Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| POST | /materias | Cadastrar matéria |
| GET | /materias | Listar matérias, com filtro opcional `instituto` |
| GET | /materias/:id | Consultar matéria |
| PUT | /materias/:id | Atualizar campos da matéria |
| DELETE | /materias/:id | Excluir matéria sem bimestres |
| POST | /bimestres | Cadastrar bimestre |
| GET | /bimestres | Listar bimestres, com filtros opcionais `materia_id` e `ano` |
| GET | /bimestres/:id | Consultar bimestre |
| PUT | /bimestres/:id | Atualizar campos do bimestre |
| DELETE | /bimestres/:id | Excluir bimestre |

Envie JSON com o cabeçalho `Content-Type: application/json`. Exemplo para `POST /materias`:

```json
{"nome":"Ciências","instituto":"SESI"}
```

Use o UUID retornado como `materia_id` ao enviar `POST /bimestres`:

```json
{
  "numero_bimestre": 1,
  "ano": 2026,
  "materia_id": "550e8400-e29b-41d4-a716-446655440000",
  "conteudo": "Estudei campo magnético e a orientação dos animais."
}
```

Os bimestres vão de 1 a 4 e o ano letivo de 2020 a 2026. O campo `conteudo` é opcional e pode ser limpo com `null` em uma atualização. A mesma matéria pode ter apenas um registro para cada combinação de ano e número do bimestre.

As consultas e atualizações retornam 200, os cadastros retornam 201 e as exclusões retornam 204. Dados inválidos retornam 400, registros ausentes retornam 404 e conflitos de vínculo ou duplicidade retornam 409.

## Capítulos, trabalhos, semestres e projetos

| Rota base | Campos obrigatórios no cadastro | Campos opcionais | Filtros na listagem |
| --- | --- | --- | --- |
| `/capitulos` | `titulo`, `conteudo`, `bimestre_id` | `capitulo_numero` | `bimestre_id` |
| `/trabalhos` | `titulo`, `conteudo`, `bimestre_id` | | `bimestre_id` |
| `/semestres` | `numero_semestre` (1 ou 2), `ano` (2020 a 2026), `materia_id` | | `materia_id`, `ano` |
| `/projetos` | `titulo`, `semestre_id` | `conteudo`, `descricao`, `link_github` | `semestre_id` |

Use `POST` e `GET` na rota base para cadastrar e listar. Acrescente `/:id` para consultar (`GET`), atualizar campos (`PUT`) e excluir (`DELETE`). Use os UUIDs retornados pela API ao preencher os campos de vínculo.

Os caminhos do planejamento `POST /bimestre/capitulo`, `POST /bimestre/trabalho` e `POST /semestre/projeto` também são aceitos. `/semestres/projetos` é um caminho alternativo para `/projetos`.

Para consultar um capítulo por número, use `GET /bimestre/capitulo/1?bimestre_id=<uuid>`. Envie `capitulo_numero` ao cadastrar ou atualizar o capítulo para permitir essa consulta. O número é único por bimestre. Se o mesmo número existir em mais de um bimestre, a consulta sem `bimestre_id` retorna 409.

Exemplo para `POST /projetos`:

```json
{
  "titulo": "API do Portfólio",
  "semestre_id": "550e8400-e29b-41d4-a716-446655440000",
  "descricao": "API REST para organizar atividades escolares.",
  "link_github": "https://github.com/aluno/portfolio"
}
```

Cada matéria pode ter um registro por ano e número de semestre. A exclusão de matéria, bimestre ou semestre com registros vinculados retorna 409.

## Cadastro de usuários

Envie um JSON para POST /usuarios com nome, email e senha (mínimo de 8 caracteres).

    {"nome":"Aluno","email":"aluno@example.com","senha":"senha-de-exemplo"}

A resposta HTTP 201 contém id, nome e email. E-mails são normalizados para minúsculas e um cadastro duplicado retorna 409. A senha é armazenada somente como hash com salt. Esta rota faz o cadastro. Sessões e login dependem de uma implementação própria.

## Portfólio individual do SESI

Cadastre cada área do conhecimento em /materias com instituto SESI. Use o UUID da área nas rotas de conteúdo anual e nos bimestres. Para a identificação do aluno, o nome vem do cadastro em /usuarios. O conteúdo anual registra também série, turma, itinerário e reflexão pessoal.

### Seções anuais

Use GET /materias/:id/portfolio/:ano para ler e PUT no mesmo caminho para editar. O PUT atualiza apenas os campos enviados e preserva os demais campos e anos. Um ano sem conteúdo retorna conteudo como objeto vazio.

```json
{
  "quem_sou_eu": {
    "serie": "3º ano",
    "turma": "G",
    "itinerario_formativo": "Tecnologia",
    "reflexao_pessoal": "Quero melhorar minha escrita científica."
  },
  "reflexao_critica": {
    "aprendizado_academico": "Aprendi a interpretar dados.",
    "aplicacao_pratica": "Usei gráficos para comparar resultados.",
    "pontos_a_melhorar": "Preciso explicar melhor minhas conclusões."
  },
  "conexoes_interdisciplinares": "Usei matemática para analisar um experimento de ciências.",
  "aprendizados_para_a_vida": {
    "experiencias": "Aprendi a dividir tarefas em grupo.",
    "aplicacao_dos_conhecimentos": "Posso aplicar isso em projetos futuros."
  }
}
```

### Seções bimestrais

- **Fundamentos teóricos**. Cadastre resumos em /capitulos e filtre a lista por bimestre_id.
- **Participação em sala de aula**. No POST /bimestres ou PUT /bimestres/:id, envie participacao com registro_atividades, reflexao_pratica e autoavaliacao. Ao enviar participacao em um PUT, o objeto substitui a versão anterior. Para apagar esse bloco, envie null. O campo conteudo continua aceitando texto.
- **Projetos e trabalhos desenvolvidos**. No POST /trabalhos ou PUT /trabalhos/:id, envie evidencias como uma lista de URLs de imagens, vídeos ou documentos. Uma lista vazia remove os links. Os arquivos são hospedados fora da API.

As rotas de semestres e projetos continuam disponíveis para o SENAI.
