const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const year = Number(import.meta.env.VITE_PORTFOLIO_YEAR || 2026)

async function request(path, { method = 'GET', data, signal } = {}) {
  const response = await fetch(base + path, {
    method,
    signal,
    ...(data && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  }).catch((error) => {
    if (error.name === 'AbortError') throw error
    throw new Error('Não foi possível conectar à API do portfólio.')
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || body === null) {
    const detail = body?.details?.[0]
    throw Object.assign(new Error(detail ? `${detail.field}: ${detail.message}` : body?.message || 'A API do portfólio não está disponível.'), { status: response.status })
  }
  return body
}

const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
const pendingSubjects = new Map()

async function findSubject(instituto, nome, signal) {
  const subjects = await request(`/materias?instituto=${instituto}`, { signal })
  const name = normalize(nome)
  return subjects.find((subject) => normalize(subject.nome) === name)
    ?? subjects.find((subject) => normalize(subject.nome).startsWith(name + ' e '))
}

function ensureSubject(instituto, nome) {
  const key = instituto + ':' + normalize(nome)
  if (!pendingSubjects.has(key)) {
    const pending = findSubject(instituto, nome)
      .then((subject) => subject ?? request('/materias', { method: 'POST', data: { instituto, nome } }))
      .finally(() => pendingSubjects.delete(key))
    pendingSubjects.set(key, pending)
  }
  return pendingSubjects.get(key)
}

function periods(instituto, subjectId, number) {
  const path = instituto === 'SESI' ? '/bimestres' : '/semestres'
  const field = instituto === 'SESI' ? 'numero_bimestre' : 'numero_semestre'
  const find = async (signal) => {
    const records = await request(`${path}?materia_id=${subjectId}&ano=${year}`, { signal })
    return records.find((record) => record[field] === number)
  }
  const create = (content = {}) => request(path, {
    method: 'POST',
    data: { materia_id: subjectId, ano: year, [field]: number, ...content },
  })
  return { path, find, create }
}

async function ensurePeriod(period, content) {
  const existing = await period.find()
  if (existing) return { record: existing, created: false }
  try {
    return { record: await period.create(content), created: true }
  } catch (error) {
    if (error.status !== 409) throw error
    const record = await period.find()
    if (!record) throw error
    return { record, created: false }
  }
}

const annualSections = {
  identificacao: ['quem_sou_eu', { nome: 'nome', serie: 'serie', turma: 'turma', itinerario: 'itinerario_formativo', expectativas: 'reflexao_pessoal' }],
  reflexao: ['reflexao_critica', { aprendizado: 'aprendizado_academico', aplicacao: 'aplicacao_pratica', melhorias: 'pontos_a_melhorar', desafios: 'desafios' }],
  conexoes: ['conexoes_interdisciplinares', 'relacoes'],
  vida: ['aprendizados_para_a_vida', { experiencias: 'experiencias', habilidades: 'aplicacao_dos_conhecimentos', convivencia: 'convivencia' }],
  autoavaliacao: ['autoavaliacao_anual', { evolucao: 'evolucao', desafio: 'desafio', meta: 'meta' }],
}
const participation = { atividades: 'registro_atividades', destaque: 'destaque', pratica: 'reflexao_pratica', engajamento: 'autoavaliacao' }
const fromApi = (fields, value) => Object.fromEntries(Object.entries(fields).map(([local, remote]) => [local, value?.[remote] ?? '']))
const toApi = (fields, value) => Object.fromEntries(Object.entries(fields)
  .filter(([local]) => value[local])
  .map(([local, remote]) => [remote, value[local]]))

export async function getSesi(nome, section, number, signal) {
  const subject = await findSubject('SESI', nome, signal)
  if (!subject) return null
  if (section in annualSections) {
    const [key, fields] = annualSections[section]
    const { conteudo } = await request(`/materias/${subject.id}/portfolio/${year}`, { signal })
    return typeof fields === 'string' ? { [fields]: conteudo[key] } : fromApi(fields, conteudo[key])
  }
  const record = await periods('SESI', subject.id, number).find(signal)
  if (!record) return null
  if (section === 'participacao') return fromApi(participation, record.participacao)
  const path = section === 'fundamentos' ? '/capitulos' : '/trabalhos'
  const entries = await request(`${path}?bimestre_id=${record.id}`, { signal })
  if (section === 'fundamentos') {
    return { resumo: record.conteudo, capitulos: entries }
  }
  return entries.map((entry) => ({ id: entry.id, titulo: entry.titulo, descricao: entry.conteudo, evidencias: entry.evidencias }))
}

export async function saveSesi(nome, section, number, values) {
  if (!Object.values(values).some(Boolean)) throw new Error('Preencha pelo menos um campo.')
  if (section === 'projetos' && (!values.titulo || !values.descricao)) throw new Error('Preencha o título e a descrição do trabalho.')
  const subject = await ensureSubject('SESI', nome)
  if (section in annualSections) {
    const [key, fields] = annualSections[section]
    return request(`/materias/${subject.id}/portfolio/${year}`, {
      method: 'PUT', data: { [key]: typeof fields === 'string' ? values[fields] : toApi(fields, values) },
    })
  }
  const period = periods('SESI', subject.id, number)
  const update = section === 'participacao' ? { participacao: toApi(participation, values) }
    : section === 'fundamentos' ? { conteudo: values.resumo } : undefined
  const { record, created } = await ensurePeriod(period, update)
  if (section === 'participacao') {
    if (!created) return request(`${period.path}/${record.id}`, { method: 'PUT', data: {
      participacao: { ...record.participacao, ...update.participacao },
    } })
    return record
  }
  if (section === 'projetos') return request('/trabalhos', { method: 'POST', data: {
    bimestre_id: record.id, titulo: values.titulo, conteudo: values.descricao,
    evidencias: values.evidencia ? [values.evidencia] : [],
  } })
  return created ? record : request(`${period.path}/${record.id}`, { method: 'PUT', data: update })
}

export async function getSenai(nome, number, signal) {
  const subject = await findSubject('SENAI', nome, signal)
  if (!subject) return []
  const record = await periods('SENAI', subject.id, number).find(signal)
  return record ? request(`/projetos?semestre_id=${record.id}`, { signal }) : []
}

export async function saveSenai(nome, number, values) {
  if (!values.titulo) throw new Error('Preencha o título do projeto.')
  const subject = await ensureSubject('SENAI', nome)
  const { record } = await ensurePeriod(periods('SENAI', subject.id, number))
  return request('/projetos', { method: 'POST', data: {
    semestre_id: record.id,
    titulo: values.titulo,
    ...(values.descricao && { descricao: values.descricao }),
    ...(values.conteudo && { conteudo: values.conteudo }),
    ...(values.link_github && { link_github: values.link_github }),
  } })
}