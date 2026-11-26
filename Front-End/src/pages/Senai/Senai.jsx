import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Style.css'

const categories = [
  ['web', 'Desenvolvimento Web', '▣'],
  ['automacao', 'Automação', '⚙'],
  ['programacao', 'Programação', '‹/›'],
  ['tecnico', 'Projeto Técnico', '◇'],
  ['outras', 'Outras Atividades', '▤'],
]

const semesters = [1, 2]

function Senai() {
  const [semester, setSemester] = useState(1)
  const [categoryId, setCategoryId] = useState(categories[0][0])
  const [, category] = categories.find(([id]) => id === categoryId)
  const showExample = semester === 1 && categoryId === 'web'

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

        <aside className="senai-categories" aria-label="Categorias de atividades">
          {categories.map(([id, title, icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={categoryId === id}
              aria-controls="senai-project"
              onClick={() => setCategoryId(id)}
            >
              <span aria-hidden="true" className="senai-category-icon">{icon}</span>
              {title}
            </button>
          ))}
        </aside>

        <section id="senai-project" className="senai-project" aria-labelledby="senai-project-title">
          <div className="senai-project-heading">
            <h2 id="senai-project-title">{category}</h2>
            {showExample && <span className="senai-status">Projeto de exemplo</span>}
          </div>

          {showExample ? (
            <div className="senai-project-content">
              <div>
                <h3>Portfólio escolar digital</h3>
                <p>Site responsivo para organizar atividades do SESI e do SENAI, desenvolvido com React, HTML e CSS.</p>
                <Link to="/" className="senai-project-link">Ver projeto</Link>
              </div>

              <div className="senai-art" aria-hidden="true">
                <div className="senai-laptop">
                  <div className="senai-laptop-screen"><span>‹/›</span></div>
                  <div className="senai-laptop-base" />
                </div>
              </div>
            </div>
          ) : (
            <p className="senai-empty">Nenhuma atividade nesta categoria para o {semester}º semestre.</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default Senai