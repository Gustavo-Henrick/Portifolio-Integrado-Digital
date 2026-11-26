import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Style.css'

const demoAccount = {
  username: 'gustavo',
  email: 'guga2008g@gmail.com',
  password: 'Guga@2026Demo',
}

function Menu({ signedIn, onSignIn, onSignOut }) {
  const dialog = useRef(null)
  const [error, setError] = useState('')

  function signIn(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)

    if (
      values.get('username').trim().toLowerCase() !== demoAccount.username ||
      values.get('email').trim().toLowerCase() !== demoAccount.email ||
      values.get('password') !== demoAccount.password
    ) {
      setError('Confira o usuário, o e-mail e a senha.')
      return
    }

    form.reset()
    dialog.current.close()
    onSignIn()
  }

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <img src={import.meta.env.BASE_URL + 'favicon.svg'} width="32" height="32" alt="" />
        Meu Portfólio
      </Link>
      <nav className="site-nav" aria-label="Navegação principal">
        <NavLink to="/" end>Início</NavLink>
        <NavLink to="/sesi">SESI</NavLink>
        <NavLink className="nav-senai" to="/senai">SENAI</NavLink>
      </nav>

      {signedIn ? (
        <button className="site-login" type="button" onClick={onSignOut}>Sair</button>
      ) : (
        <button className="site-login" type="button" onClick={() => dialog.current.showModal()}>Entrar</button>
      )}

      <dialog
        ref={dialog}
        className="login-dialog"
        aria-labelledby="login-title"
        onClose={(event) => {
          event.currentTarget.querySelector('form').reset()
          setError('')
        }}
      >
        <h2 id="login-title">Entrar no portfólio</h2>
        <form onSubmit={signIn} onChange={() => setError('')}>
          <label>Usuário<input name="username" autoComplete="username" required /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p role="alert">{error}</p>}
          <div className="login-actions">
            <button type="button" onClick={() => dialog.current.close()}>Cancelar</button>
            <button className="site-login" type="submit">Entrar</button>
          </div>
        </form>
      </dialog>
    </header>
  )
}

export default Menu
