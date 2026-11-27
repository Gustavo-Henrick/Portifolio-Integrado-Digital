import { useState } from 'react'
import { getSesi, saveSesi } from '../../api/portfolio.js'
import { usePortfolio } from '../../api/usePortfolio.js'
import { imageTypes, readAttachments } from '../../api/attachments.js'
import './style.css'

const areas = [
  ['matematica', 'Matemática'],
  ['natureza', 'Ciências da Natureza'],
  ['humanas', 'Ciências Humanas'],
  ['linguagens', 'Linguagens'],
]

const periods = [1, 2, 3, 4]

const sections = [
  {
    id: 'identificacao', title: 'Quem Sou Eu?',
    fields: [
      ['nome', 'Nome', 'text'],
      ['serie', 'Série', 'text'],
      ['itinerario', 'Itinerário formativo', 'text'],
      ['turma', 'Turma', 'text'],
      ['expectativas', 'Expectativas e objetivos pessoais'],
    ],
  },
  {
    id: 'fundamentos', title: 'Fundamentos Teóricos', quarterly: true,
    fields: [['resumo', 'Resumo das teorias, conceitos e metodologias estudados']],
  },
  {
    id: 'participacao', title: 'Participação em Sala de Aula', quarterly: true,
    fields: [
      ['atividades', 'Discussões, atividades e temas das aulas'],
      ['destaque', 'Atividade, exemplo ou discussão que ajudou no aprendizado'],
      ['pratica', 'Um conceito aprendido e como aplicá-lo no cotidiano'],
      ['engajamento', 'Autoavaliação do engajamento nas aulas'],
    ],
  },
  {
    id: 'projetos', title: 'Projetos e Trabalhos Desenvolvidos', quarterly: true, repeatable: true,
    fields: [
      ['titulo', 'Título da atividade', 'text'],
      ['descricao', 'Descrição do trabalho, da pesquisa ou da atividade prática'],
      ['evidencia', 'Link para evidência visual ou material produzido', 'url'],
    ],
  },
  {
    id: 'reflexao', title: 'Reflexão Crítica',
    fields: [
      ['aprendizado', 'O que aprendi com as experiências acadêmicas?'],
      ['aplicacao', 'Como posso aplicar esse conhecimento na vida real?'],
      ['melhorias', 'Em que pontos ainda preciso melhorar?'],
      ['desafios', 'Como os desafios fortaleceram minha resiliência e minha capacidade de resolver problemas?'],
    ],
  },
  {
    id: 'conexoes', title: 'Conexões Interdisciplinares',
    fields: [['relacoes', 'Como os conteúdos se relacionam com outras disciplinas ou áreas?']],
  },
  {
    id: 'vida', title: 'Aprendizados da Escola para a Vida?',
    fields: [
      ['experiencias', 'Como as experiências na escola influenciaram minha forma de pensar e agir?'],
      ['habilidades', 'Quais habilidades vou levar para a vida pessoal e profissional?'],
      ['convivencia', 'Como os desafios da escola me prepararam para conviver com outras pessoas e resolver problemas?'],
    ],
  },
  {
    id: 'autoavaliacao', title: 'Autoavaliação',
    fields: [
      ['evolucao', 'Como evoluí ao longo do ano?'],
      ['desafio', 'Qual foi meu maior desafio e como lidei com ele?'],
      ['meta', 'O que quero melhorar a partir de agora?'],
    ],
  },
]

function readStored(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function SesiEntry({ section, storageKey, signedIn, areaName, period }) {
  const { loading, data, error, reload } = usePortfolio(getSesi, areaName, section.id, period)
  const [localRecord] = useState(() => readStored(storageKey))
  const [saving, setSaving] = useState(false)
  const saved = data ?? localRecord
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const projects = section.repeatable && Array.isArray(saved) ? saved : []
  const values = section.repeatable ? [] : section.fields.filter(([id]) => saved?.[id])

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(Array.from(form).filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, value.trim()]))
    setSaving(true)
    setMessage('')
    try {
      if (section.repeatable) {
        const files = form.getAll('imagens').filter((file) => file.name)
        if (files.some((file) => !imageTypes.includes(file.type))) {
          throw new Error('Use imagens PNG, JPEG, GIF, WebP ou AVIF.')
        }
        values.imagens = await readAttachments(files)
      }
      await saveSesi(areaName, section.id, period, values)
      setEditing(false)
      setMessage('Registro salvo. Atualize a visualização para ver o registro.')
    } catch (failure) {
      setMessage(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {loading && <p role="status">Carregando registros…</p>}
      {error && <p role="alert">{error}</p>}
      {saved?.capitulos?.length > 0 && (
        <ul className="sesi-activities">
          {saved.capitulos.map((chapter) => (
            <li key={chapter.id}><h3>{chapter.titulo}</h3><p>{chapter.conteudo}</p></li>
          ))}
        </ul>
      )}
      {signedIn && !loading && !error && (
        <div className="sesi-editor-actions">
          <button
            type="button"
            className="sesi-edit-button"
            aria-label={editing ? 'Cancelar edição' : 'Editar registro'}
            title={editing ? 'Cancelar edição' : 'Editar registro'}
            aria-expanded={editing}
            disabled={saving}
            onClick={() => {
              setEditing(!editing)
              setMessage('')
            }}
          >
            {editing ? 'Cancelar edição' : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 5 4 4M4 20l1-5L16 4a2.8 2.8 0 0 1 4 4L9 19l-5 1Z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {projects.length > 0 && (
        <ul className="sesi-activities">
          {projects.map((project, index) => (
            <li key={index}>
              <h3>{project.titulo}</h3>
              {project.descricao && <p>{project.descricao}</p>}
              {project.imagens?.length > 0 && (
                <ul className="sesi-evidence-gallery" aria-label="Imagens de evidência">
                  {project.imagens.filter((image) => imageTypes.includes(image.tipo)).map((image, index) => (
                    <li key={index}>
                      <img src={`data:${image.tipo};base64,${image.dados}`} alt={image.nome} loading="lazy" />
                    </li>
                  ))}
                </ul>
              )}
              {(project.evidencias ?? [project.evidencia]).filter((url) => /^https?:\/\//i.test(url)).map((url, index) => (
                <a key={index} href={url}>Abrir evidência {index + 1} de {project.titulo}</a>
              ))}
            </li>
          ))}
        </ul>
      )}

      {values.length > 0 && (
        <dl className="sesi-record">
          {values.map(([id, label]) => (
            <div key={id}>
              <dt>{label}</dt>
              <dd>{saved[id]}</dd>
            </div>
          ))}
        </dl>
      )}

      {!loading && !error && projects.length === 0 && values.length === 0 && !saved?.capitulos?.length && <p>Nenhum registro nesta seção.</p>}

      {signedIn && editing && (
        <form
          className="sesi-form"
          onSubmit={submit}
          onChange={() => setMessage('')}
        >
          {section.fields.map(([id, label, type]) => (
            <label key={id}>
              {label}
              {type ? (
                <input
                  name={id}
                  type={type}
                  defaultValue={section.repeatable ? '' : (saved?.[id] ?? '')}
                  required={id === 'titulo'}
                  maxLength={type === 'url' ? 2048 : ['serie', 'turma'].includes(id) ? 80 : 120}
                />
              ) : (
                <textarea name={id} defaultValue={saved?.[id] ?? ''} rows={4} maxLength={5000} />
              )}
            </label>
          ))}

          {section.repeatable && (
            <label>Imagens de evidência (até 10, somando 4 MB)
              <input type="file" name="imagens" accept={imageTypes.join(',')} multiple disabled={saving} />
            </label>
          )}
          <button type="submit" className="sesi-action" disabled={saving}>{saving ? 'Salvando…' : 'Salvar registro'}</button>

        </form>
      )}
      {message && <p role="status">{message}</p>}
      <button type="button" className="sesi-edit-button" onClick={reload} disabled={loading || saving || editing}>Atualizar visualização</button>
    </>
  )
}

function PreviousRecords({ records }) {
  return (
    <details className="sesi-previous">
      <summary>Registros anteriores à organização por matéria</summary>
      {records.map(({ period, activities, reflection }) => (
        <section key={period} className="sesi-previous-period">
          <h3>{period}º bimestre</h3>
          {activities.length > 0 && (
            <ul className="sesi-activities">
              {activities.map((activity, index) => (
                <li key={index}>
                  <small>{activity.category}</small>
                  <h4>{activity.title}</h4>
                  {activity.description && <p>{activity.description}</p>}
                </li>
              ))}
            </ul>
          )}
          {reflection && <p><strong>Autoavaliação</strong><br />{reflection}</p>}
        </section>
      ))}
    </details>
  )
}

function Sesi({ signedIn }) {
  const [area, setArea] = useState(areas[0][0])
  const [sectionId, setSectionId] = useState('fundamentos')
  const [period, setPeriod] = useState(1)
  const [previousRecords] = useState(() => periods.flatMap((number) => {
    const record = readStored(`portfolio.sesi.${number}`)
    return record && (record.activities.length > 0 || record.reflection)
      ? [{ ...record, period: number }]
      : []
  }))

  const section = sections.find(({ id }) => id === sectionId)
  const storageKey = `portfolio.sesi.area.${area}.${sectionId}.${section.quarterly ? period : 'anual'}`

  return (
    <main className="school-page">
      <header>
        <h1>SESI</h1>
        <p>Portfólio de projetos e atividades do SESI</p>
      </header>

      <div className="sesi-board">
        <div className="sesi-area" role="group" aria-label="Matérias">
          {areas.map(([id, title]) => (
            <button type="button" key={id} aria-pressed={area === id} onClick={() => setArea(id)}>
              {title}
            </button>
          ))}
        </div>


        <div className="sesi-layout">
          <aside className="sesi-sidebar" aria-label="Seções do portfólio">
            <h2>Seções do portfólio</h2>
            {sections.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={sectionId === item.id}
                aria-controls="sesi-content"
                onClick={() => setSectionId(item.id)}
              >
                {item.title}
              </button>
            ))}
          </aside>

          <div className="sesi-content" id="sesi-content">
            {section.quarterly && (
              <div className="sesi-periods" role="group" aria-label="Escolher bimestre">
                {periods.map((option) => (
                  <button
                    type="button"
                    key={option}
                    aria-label={`${option}º bimestre`}
                    aria-pressed={period === option}
                    onClick={() => setPeriod(option)}
                  >B{option}</button>
                ))}
              </div>
            )}

            <section className="sesi-panel" aria-labelledby="sesi-section-title">
              <div className="sesi-section-heading">
                <h2 id="sesi-section-title">{section.title}</h2>
                <span>{section.quarterly ? `${period}º bimestre` : 'Anual'}</span>
              </div>

              <SesiEntry key={storageKey + signedIn} section={section} storageKey={storageKey} signedIn={signedIn} areaName={areas.find(([id]) => id === area)[1]} period={section.quarterly ? period : 1} />
            </section>
          </div>
        </div>

        {previousRecords.length > 0 && <PreviousRecords records={previousRecords} />}
      </div>
    </main>
  )
}

export default Sesi