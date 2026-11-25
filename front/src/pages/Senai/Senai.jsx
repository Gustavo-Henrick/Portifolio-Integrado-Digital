const subjects = ['Matemática', 'Linguagens', 'Ciências da Natureza', 'Ciências Humanas']

function Senai() {
  return (
    <main className="school-page school-page--senai">
      <header>
        <h1>SENAI</h1>
        <p>Portfólio de projetos e atividades do SENAI</p>
      </header>
      <ul className="school-subjects" aria-label="Áreas de estudo">
        {subjects.map((subject) => (
          <li key={subject}>
            <h2>{subject}</h2>
            <p>Atividades em breve.</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default Senai