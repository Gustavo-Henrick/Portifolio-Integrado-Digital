import { useEffect, useRef, useState } from 'react'
import { deleteSenaiProject, getSenai, getSenaiProject, saveSenai, saveSenaiContent, appendSenaiAttachments } from '../../api/portfolio.js'
import { usePortfolio } from '../../api/usePortfolio.js'
import { imageTypes, readAttachments } from '../../api/attachments.js'
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
    ['testes-front-end', 'Testes de Front-end', '▣'],
    ['testes-back-end', 'Testes de Back-end', '‹/›'],
    ['interacao-apis', 'Interação com APIs', '⇄'],
    ['projeto-back-end', 'Projeto de Back-end', '◇'],
    ['desenvolvimento-apis', 'Desenvolvimento de APIs', '⚙'],
    ['projeto-front-end', 'Projeto de Front-end', '▣'],
  ],
}

const semesters = [1, 2]

function ProjectAttachments({ project, signedIn, onDelete }) {
  const [attachments, setAttachments] = useState(null)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getSenaiProject(project.id, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setAttachments(data.anexos ?? []) },
      (error) => { if (!controller.signal.aborted) setFailure(error.message) },
    )
    return () => controller.abort()
  }, [project.id, version])

  async function appendFiles(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    setBusy(true)
    setFailure('')
    try {
      const files = await readAttachments(new FormData(form).getAll('anexos'), attachments)
      const saved = await appendSenaiAttachments(project.id, files)
      setAttachments(saved.anexos)
      form.reset()
    } catch (error) {
      setFailure(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    setBusy(true)
    setFailure('')
    try {
      await deleteSenaiProject(project.id)
      onDelete()
    } catch (error) {
      setFailure(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="senai-attachments">
      <h5>Anexos</h5>
      {!attachments && !failure && <p role="status">Carregando anexos…</p>}
      {failure && <p role="alert">{failure}</p>}
      {!attachments && failure && (
        <button type="button" className="sesi-edit-button" onClick={() => { setFailure(''); setVersion(version + 1) }}>Tentar novamente</button>
      )}
      {attachments?.length === 0 && <p>Nenhum anexo.</p>}
      {attachments?.length > 0 && (
        <ul>
          {attachments.map((file, index) => (
            <li key={index}>
              {imageTypes.includes(file.tipo) && (
                <img src={`data:${file.tipo};base64,${file.dados}`} alt={file.nome} />
              )}
              <a href={`data:application/octet-stream;base64,${file.dados}`} download={file.nome}>{file.nome}</a>
            </li>
          ))}
        </ul>
      )}
      {signedIn && attachments && (
        <form className="sesi-form senai-attachment-form" onSubmit={appendFiles}>
          <label>Adicionar imagens e arquivos<input type="file" name="anexos" multiple required disabled={busy} /></label>
          <button type="submit" className="sesi-edit-button" disabled={busy}>Enviar anexos</button>
        </form>
      )}
      {signedIn && (confirmDelete ? (
        <div className="senai-delete-confirm">
          <p>Excluir este projeto e seus anexos?</p>
          <button type="button" className="senai-delete-button" disabled={busy} onClick={remove}>Confirmar exclusão</button>
          <button type="button" className="sesi-edit-button" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="senai-delete-button" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir projeto</button>
      ))}
    </div>
  )
}


function LearnedContent({ content, subject, semester, signedIn, ready, onEditingChange, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function changeEditing(value) {
    setEditing(value)
    onEditingChange(value)
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const value = new FormData(event.currentTarget).get('conteudo').trim()
    setSaving(true)
    setMessage('')
    try {
      await saveSenaiContent(subject, semester, value)
      changeEditing(false)
      onSaved('Conteúdo salvo. Atualize a visualização para ver o registro.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="senai-learned-content" aria-labelledby="senai-learned-title">
      <h3 id="senai-learned-title">Conteúdo aprendido</h3>
      {content && <p className="senai-learned-text">{content}</p>}
      {ready && !content && <p>Nenhum conteúdo registrado nesta matéria.</p>}
      {signedIn && ready && (
        <button type="button" className="sesi-edit-button" aria-expanded={editing} disabled={saving}
          onClick={() => changeEditing(!editing)}>
          {editing ? 'Cancelar edição' : 'Editar conteúdo'}
        </button>
      )}
      {editing && (
        <form className="sesi-form" onSubmit={submit}>
          <label>Resumo do que aprendeu
            <textarea name="conteudo" rows={5} maxLength={12000} defaultValue={content ?? ''} disabled={saving} />
          </label>
          <button type="submit" className="senai-project-link" disabled={saving}>{saving ? 'Salvando…' : 'Salvar conteúdo'}</button>
        </form>
      )}
      {message && <p role="alert">{message}</p>}
    </section>
  )
}



function SenaiProjects({ subject, semester, signedIn }) {
  const { loading, data, error, reload } = usePortfolio(getSenai, subject, semester)
  const details = useRef(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const projects = data?.projetos
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const values = Object.fromEntries(Array.from(new FormData(form)).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, value.trim()]))
    setSaving(true)
    setMessage('')
    try {
      const anexos = await readAttachments(new FormData(form).getAll('anexos'))
      await saveSenai(subject, semester, { ...values, anexos })
      setAdding(false)
      setMessage('Projeto salvo. Atualize a visualização para ver o registro.')
    } catch (failure) {
      setMessage(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <LearnedContent
        content={data?.conteudo}
        subject={subject}
        semester={semester}
        signedIn={signedIn}
        ready={!loading && !error}
        onEditingChange={setEditingContent}
        onSaved={setMessage}
      />

      <h3 className="senai-projects-title">Projetos feitos</h3>
      {loading && <p role="status">Carregando projetos…</p>}
      {error && <p role="alert">{error}</p>}
      {projects?.length === 0 && <p className="senai-empty">Nenhum projeto nesta matéria para o {semester}º semestre.</p>}
      {projects?.length > 0 && (
        <ul className="senai-project-grid" aria-label="Projetos feitos">
          {projects.map((project) => (
            <li key={project.id}>
              <button type="button" className="senai-project-card" aria-haspopup="dialog" onClick={() => {
                setSelectedProject(project)
                details.current.showModal()
              }}>
                <span aria-hidden="true" className="senai-card-icon">‹/›</span>
                <span>{project.titulo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <dialog ref={details} className="senai-project-details" aria-labelledby="senai-details-title"
        onClose={() => setSelectedProject(null)}>
        {selectedProject && (
          <>
            <h4 id="senai-details-title">{selectedProject.titulo}</h4>
            {selectedProject.descricao && <p>{selectedProject.descricao}</p>}
            {selectedProject.conteudo && <p>{selectedProject.conteudo}</p>}
            {!selectedProject.descricao && !selectedProject.conteudo && !selectedProject.link_github && (
              <p>Nenhum detalhe adicionado a este projeto.</p>
            )}
            {selectedProject.link_github?.startsWith('https://github.com/') && (
              <a href={selectedProject.link_github} className="senai-project-link">Ver no GitHub</a>
            )}
            <ProjectAttachments project={selectedProject} signedIn={signedIn} onDelete={() => {
              details.current.close()
              setSelectedProject(null)
              setMessage('Projeto excluído.')
              reload()
            }} />

          </>
        )}
        <form method="dialog">
          <button type="submit" className="sesi-edit-button">Fechar</button>
        </form>
      </dialog>

      <button type="button" className="sesi-edit-button" onClick={reload} disabled={loading || saving || adding || editingContent}>Atualizar visualização</button>
      {signedIn && !loading && !error && (
        <button type="button" className="sesi-edit-button" aria-label={adding ? 'Cancelar' : 'Adicionar projeto'} disabled={saving}
          onClick={() => { setAdding(!adding); setMessage('') }}>
          {adding ? 'Cancelar' : 'Adicionar projeto'}
        </button>
      )}
      {signedIn && adding && (
        <form className="sesi-form" onSubmit={submit}>
          <label>Título<input name="titulo" maxLength={120} required /></label>
          <label>Descrição<textarea name="descricao" rows={3} /></label>
          <label>Conteúdo<textarea name="conteudo" rows={4} /></label>
          <label>Imagens e arquivos (até 10, somando 4 MB)<input name="anexos" type="file" multiple /></label>
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