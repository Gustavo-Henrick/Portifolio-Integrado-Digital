import { Link } from 'react-router-dom'
import hero from '../../assets/estudos.png'
import './Style.css'

const schools = [
  { name: 'SESI', route: '/sesi', icon: 'book' },
  { name: 'SENAI', route: '/senai', icon: 'gear' },
]

function Home() {
  return (
    <main className="home">
      <section className="home-intro">
        <div>
          <p className="home-greeting">Olá, eu sou o Gustavo! <span aria-hidden="true">👋</span></p>
          <h1>Meu ano de<br />aprendizagem</h1>
          <p className="home-description">
            Explore os projetos, atividades e conquistas do meu ano letivo, organizados por SESI e SENAI.
          </p>
        </div>
        <img className="home-illustration" src={hero} alt="" />
      </section>

      <section className="school-links" aria-label="Portfólios por escola">
        {schools.map(({ name, route, icon }) => (
          <Link className={`school-link school-link--${icon}`} to={route} key={name}>
            <svg className="school-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {icon === 'book' ? (
                <path d="M12 6c-3-3-7-3-10-2v15c4-1 7-.5 10 2 3-2.5 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15" />
              ) : (
                <>
                  <path d="M9.5 2h5l.6 2.8 2 .9 2.4-1.4 2.5 4.3-2.1 1.9v2.9l2.1 1.9-2.5 4.3-2.4-1.4-2 .9-.6 2.9h-5l-.6-2.9-2-.9-2.4 1.4L2 15.3l2.1-1.9v-2.9L2 8.6l2.5-4.3 2.4 1.4 2-.9Z" />
                  <circle cx="12" cy="12" r="3.4" />
                </>
              )}
            </svg>
            <span>
              <strong>{name}</strong>
              <span>Projetos e atividades do {name}</span>
            </span>
            <span className="school-open" aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
    </main>
  )
}

export default Home