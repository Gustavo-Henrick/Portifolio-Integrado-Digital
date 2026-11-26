export function erro(status, message, details) {
  return Object.assign(new Error(message), { status, details });
}

function invalido(field, message) {
  throw erro(400, "Dados inválidos", [{ field, message }]);
}

export function uuid(valor, campo) {
  if (typeof valor !== "string" ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(valor)) {
    invalido(campo, "Deve ser um UUID válido.");
  }
  return valor.toLowerCase();
}

export function instituto(valor) {
  if (!["SESI", "SENAI"].includes(valor)) {
    invalido("instituto", "Deve ser SESI ou SENAI.");
  }
  return valor;
}

export function texto(valor, campo, limite) {
  if (typeof valor !== "string" || !valor.trim() || Array.from(valor.trim()).length > limite) {
    invalido(campo, "Informe um texto válido e dentro do limite de tamanho.");
  }
  return valor.trim();
}

export function inteiro(valor, campo, min, max) {
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    invalido(campo, `Deve ser um inteiro de ${min} a ${max}.`);
  }
  return valor;
}

export function ano(valor) {
  return inteiro(valor, "ano", 2020, 2026);
}

export function dadosMateria(body, parcial) {
  return validarCorpo(body, parcial, {
    nome: (valor) => texto(valor, "nome", 120),
    instituto,
  });
}

export function dadosBimestre(body, parcial) {
  return validarCorpo(body, parcial, {
    numero_bimestre: (valor) => inteiro(valor, "numero_bimestre", 1, 4),
    ano,
    materia_id: (valor) => uuid(valor, "materia_id"),
  }, {
    conteudo: (valor) => textoLongo(valor, "conteudo", true),
    participacao: (valor) => valor === null ? null : validarCorpo(valor, true, {
      registro_atividades: (item) => textoLongo(item, "registro_atividades"),
      reflexao_pratica: (item) => textoLongo(item, "reflexao_pratica"),
      autoavaliacao: (item) => textoLongo(item, "autoavaliacao"),
    }),
  });
}

export function validarCorpo(body, parcial, obrigatorios, opcionais = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    invalido("body", "Envie um objeto JSON.");
  }

  const campos = { ...obrigatorios, ...opcionais };
  const dados = {};
  for (const campo of Object.keys(body)) {
    if (!Object.hasOwn(campos, campo)) invalido(campo, "Campo desconhecido.");
    dados[campo] = campos[campo](body[campo]);
  }
  if (!parcial) {
    for (const campo of Object.keys(obrigatorios)) {
      if (!Object.hasOwn(dados, campo)) invalido(campo, "Campo obrigatório.");
    }
  } else if (!Object.keys(dados).length) {
    invalido("body", "Informe pelo menos um campo para atualizar.");
  }
  return dados;
}

export function textoLongo(valor, campo, aceitaNulo = false) {
  if (aceitaNulo && valor === null) return null;
  if (typeof valor !== "string" || !valor.trim() || Buffer.byteLength(valor, "utf8") > 65_535) {
    invalido(campo, "Informe um texto de até 65.535 bytes.");
  }
  return valor;
}

export function linkGithub(valor) {
  if (valor === null) return null;
  const link = texto(valor, "link_github", 512);
  const url = URL.canParse(link) ? new URL(link) : null;
  if (!url || url.origin !== "https://github.com" || url.username || url.password ||
      url.pathname.split("/").filter(Boolean).length < 2) {
    invalido("link_github", "Informe a URL HTTPS de um repositório no GitHub.");
  }
  return link;
}

export function linksDeEvidencias(valor) {
  if (!Array.isArray(valor) || valor.length > 20) {
    invalido("evidencias", "Envie uma lista com até 20 links.");
  }
  return valor.map((item) => {
    const link = texto(item, "evidencias", 2048);
    const url = URL.canParse(link) ? new URL(link) : null;
    if (!url || !["https:", "http:"].includes(url.protocol) || url.username || url.password) {
      invalido("evidencias", "Cada evidência deve ser um link HTTP ou HTTPS válido.");
    }
    return url.href;
  });
}
