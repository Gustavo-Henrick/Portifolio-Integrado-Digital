import { useState } from 'react'
import { imageTypes, readAttachments } from '../../api/attachments.js'
import { saveSenaiSections } from '../../api/portfolio.js'

const fields = [
  ['codigos', 'Códigos produzidos'],
  ['relatorios', 'Relatórios técnicos'],
  ['competencias', 'Competências desenvolvidas'],
  ['autoavaliacao', 'Autoavaliação'],
]

const linkFields = [
  ['links_codigo', 'Links para os códigos'],
  ['videos', 'Vídeos'],
  ['links_relatorios', 'Links para os relatórios'],
]

const lines = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
const safeLinks = (links = []) => links.filter((link) => /^https?:\/\//i.test(link))

function Links({ links, label }) {
  const urls = safeLinks(links)
  if (!urls.length) return null
  return (
    <ul className="senai-resource-links">
      {urls.map((url, index) => <li key={index}><a href={url}>{label} {index + 1}</a></li>)}
    </ul>
  )
}

function ResourceText({ values, id, label, links, linkLabel }) {
  const text = values[id]
  if (!text?.trim() && !safeLinks(links).length) return null
  return (
    <section className="senai-resource">
      <h4>{label}</h4>
      {text && (id === 'codigos'
        ? <pre><code>{text}</code></pre>
        : <p className="senai-learned-text">{text}</p>)}
      <Links links={links} label={linkLabel} />
    </section>
  )
}

export default function SubjectPortfolio({ data, subject, semester, signedIn, ready, onEditingChange, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const values = data ?? {}
  const photos = values.fotos ?? []
  const visiblePhotos = photos.filter((photo) => imageTypes.includes(photo.tipo))

  const hasVideos = safeLinks(values.videos).length > 0
  const hasRecords = visiblePhotos.length > 0 || fields.some(([id]) => values[id]?.trim())
    || linkFields.some(([id]) => safeLinks(values[id]).length > 0)

  function toggleEditing(next) {
    setEditing(next)
    onEditingChange(next)
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      const files = form.getAll('fotos').filter((file) => file.name)
      if (files.some((file) => !imageTypes.includes(file.type))) {
        throw new Error('Use imagens PNG, JPEG, GIF, WebP ou AVIF.')
      }
      const kept = form.getAll('manter_foto').map((index) => photos[Number(index)])
      const added = await readAttachments(files, kept)
      const sections = Object.fromEntries([
        ...fields.map(([id]) => [id, form.get(id).trim() || null]),
        ...linkFields.map(([id]) => [id, lines(form.get(id))]),
        ['fotos', [...kept, ...added]],
      ])
      await saveSenaiSections(subject, semester, sections)
      toggleEditing(false)
      onSaved('Registros salvos.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  if (!ready || (!hasRecords && !signedIn)) return null

  return (
    <section className="senai-resources" aria-labelledby={hasRecords ? 'senai-resources-title' : undefined}>
      <div className="senai-project-heading">
        {hasRecords && <h3 id="senai-resources-title">Registros da matéria</h3>}
        {signedIn && (
          <button type="button" className="sesi-edit-button" aria-expanded={editing} disabled={saving}
            onClick={() => toggleEditing(!editing)}>
            {editing ? 'Cancelar edição' : 'Editar registros da matéria'}
          </button>
        )}
      </div>

      {hasRecords && (
        <div className="senai-resource-grid">
          <ResourceText values={values} id="codigos" label="Códigos produzidos" links={values.links_codigo} linkLabel="Ver código" />
          {visiblePhotos.length > 0 && (
            <section className="senai-resource">
              <h4>Registros fotográficos</h4>
              <ul className="sesi-evidence-gallery" aria-label="Fotos da matéria">
                {visiblePhotos.map((photo, index) => (
                  <li key={index}><img src={`data:${photo.tipo};base64,${photo.dados}`} alt={photo.nome} loading="lazy" /></li>
                  ))}
              </ul>
            </section>
          )}
          {hasVideos && (
            <section className="senai-resource">
              <h4>Vídeos</h4>
            <Links links={values.videos} label="Assistir ao vídeo" />
            </section>
          )}
          <ResourceText values={values} id="relatorios" label="Relatórios técnicos" links={values.links_relatorios} linkLabel="Abrir relatório" />
          <ResourceText values={values} id="competencias" label="Competências desenvolvidas" />
          <ResourceText values={values} id="autoavaliacao" label="Autoavaliação" />
        </div>
      )}

      {signedIn && editing && (
        <form className="sesi-form" onSubmit={submit}>
          <fieldset disabled={saving}>
            <legend>Registros da matéria</legend>
            {fields.map(([id, label]) => (
              <label key={id}>{label}<textarea name={id} rows={4} maxLength={12000} defaultValue={values[id] ?? ''} /></label>
            ))}
            {linkFields.map(([id, label]) => (
              <label key={id}>{label} (um link por linha)
                <textarea name={id} rows={2} defaultValue={values[id]?.join('\n') ?? ''} />
              </label>
            ))}
            {photos.length > 0 && (
              <div>
                <p>Fotos a manter</p>
                {photos.map((photo, index) => (
                  <label className="senai-keep-photo" key={index}>
                    <input type="checkbox" name="manter_foto" value={index} defaultChecked />
                    {photo.nome}
                  </label>
                ))}
              </div>
            )}
            <label>Adicionar fotos (até 10 e 4 MB no total)
              <input type="file" name="fotos" accept={imageTypes.join(',')} multiple />
            </label>
            <button type="submit" className="senai-project-link">{saving ? 'Salvando…' : 'Salvar registros'}</button>
          </fieldset>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}

