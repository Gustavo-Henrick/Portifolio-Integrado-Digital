import { useState } from 'react'
import { getSenai, saveSenai } from '../../api/portfolio.js'
import { usePortfolio } from '../../api/usePortfolio.js'
import './Style.css'

const subjectsBySemester = {
  1: [
    ['banco-de-dados', 'Banco de Dados', '▤'],
    ['front-end', 'Codificação para Front-end', '▣'],
    ['back-end', 'Codificação para Back-end', '‹/›'],
    ['sustentabilidade', 'Sustentabilidade nos Processos Industriais', '◇'],
    ['industria', 'Introdução à Indústria 4.0', '⚙'],
    ['introducao', 'Introdução ao Desenvolvimento de Sistemas', '‹/›'],
  ],
  2: [
    ['projeto-integrador', 'Projeto Integrador II', '◇'],
  ],
}

const semesters = [1, 2]

function SenaiProjects({ subject, semester, signedIn }) {
  const { loading, data, error, reload } = usePortfolio(getSenai, subject, semester)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const values = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, value.trim()]))
    setSaving(true)
    setMessage('')
    try {
      await saveSenai(subject, semester, values)
      setEditing(false)
      setMessage('Projeto salvo. Atualize a visualização para ver o registro.')
    } catch (failure) {
      setMessage(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {loading && <p role="status">Carregando projetos…</p>}
      {error && <p role="alert">{error}</p>}
      {data?.length === 0 && <p className="senai-empty">Nenhuma atividade nesta matéria para o {semester}º semestre.</p>}
      {data?.map((project) => (
        <article key={project.id} className="senai-api-project">
          <h3>{project.titulo}</h3>
          {project.descricao && <p>{project.descricao}</p>}
          {project.conteudo && <p>{project.conteudo}</p>}
          {project.link_github?.startsWith('https://github.com/') && (
            <a href={project.link_github} className="senai-project-link">Ver projeto</a>
          )}
        </article>
      ))}
      <button type="button" className="sesi-edit-button" onClick={reload} disabled={loading || saving || editing}>Atualizar visualização</button>
      {signedIn && !loading && !error && (
        <button type="button" className="sesi-edit-button" aria-label={editing ? 'Cancelar edição' : 'Adicionar projeto'} disabled={saving}
          onClick={() => { setEditing(!editing); setMessage('') }}>
          {editing ? 'Cancelar edição' : '✎'}
        </button>
      )}
      {signedIn && editing && (
        <form className="sesi-form" onSubmit={submit}>
          <label>Título<input name="titulo" maxLength={120} required /></label>
          <label>Descrição<textarea name="descricao" rows={3} /></label>
          <label>Conteúdo<textarea name="conteudo" rows={4} /></label>
          <label>Link do GitHub<input name="link_github" type="url" maxLength={512} /></label>
          <button type="submit" className="senai-project-link" disabled={saving}>{saving ? 'Salvando…' : 'Salvar projeto'}</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </>
  )
}

function Senai({ signedIn }) {
  const [semester, setSemester] = useState(1)
  const [selectedBySemester, setSelectedBySemester] = useState({})
  const subjects = subjectsBySemester[semester]
  const [subjectId, subject] = subjects.find(([id]) => id === selectedBySemester[semester]) ?? subjects[0]

  return (
    <main className="school-page school-page--senai">
      <header>
        <h1>SENAI</h1>
        <p>Portfólio de projetos e atividades do SENAI</p>
      </header>

      <div className="senai-board">
        <div className="senai-semesters" role="group" aria-label="Semestres">
          {semesters.map((option) => (
            <button
              type="button"
              key={option}
              aria-label={`${option}º semestre`}
              aria-pressed={semester === option}
              aria-controls="senai-project"
              onClick={() => setSemester(option)}
            >
              S{option}
            </button>
          ))}
        </div>

        <aside className="senai-categories" aria-label="Matérias do semestre">
          {subjects.map(([id, title, icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={subjectId === id}
              aria-controls="senai-project"
              onClick={() => setSelectedBySemester((previous) => ({ ...previous, [semester]: id }))}
            >
              <span aria-hidden="true" className="senai-category-icon">{icon}</span>
              {title}
            </button>
          ))}
        </aside>

        <section id="senai-project" className="senai-project" aria-labelledby="senai-project-title">
          <div className="senai-project-heading">
            <h2 id="senai-project-title">{subject}</h2>
          </div>

          <SenaiProjects key={subjectId + semester + signedIn} subject={subject} semester={semester} signedIn={signedIn} />
        </section>
      </div>
    </main>
  )
}

export default Senai