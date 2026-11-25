import { Link, NavLink } from 'react-router-dom'
import './Style.css'

function Menu() {
  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <img src={import.meta.env.BASE_URL + "favicon.svg"} width="32" height="32" alt="" />
        Meu Portfólio
      </Link>
      <nav className="site-nav" aria-label="Navegação principal">
        <NavLink to="/" end>Início</NavLink>
        <NavLink to="/sesi">SESI</NavLink>
        <NavLink className="nav-senai" to="/senai">SENAI</NavLink>
      </nav>
    </header>
  )
}

export default Menu