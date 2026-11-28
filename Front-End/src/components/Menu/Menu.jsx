import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { login, logout } from '../../api/session.js'
import './Style.css'

function Menu({ signedIn, checking, onSignIn, onSignOut }) {
  const dialog = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setError('')
    try {
      const user = await login({
        nome: values.get('username'),
        email: values.get('email'),
        senha: values.get('password'),
      })
      form.reset()
      dialog.current.close()
      onSignIn(user)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await logout()
      onSignOut()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
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
        <button className="site-login" type="button" disabled={busy} onClick={signOut}>Sair</button>
      ) : (
        <button className="site-login" type="button" disabled={checking || busy} onClick={() => dialog.current.showModal()}>Entrar</button>
      )}

      {signedIn && error && <p role="alert">{error}</p>}
      <dialog
        ref={dialog}
        className="login-dialog"
        aria-labelledby="login-title"
        onCancel={(event) => { if (busy) event.preventDefault() }}
        onClose={(event) => {
          event.currentTarget.querySelector('form').reset()
          setError('')
        }}
      >
        <h2 id="login-title">Entrar no portfólio</h2>
        <form onSubmit={signIn} onChange={() => setError('')}>
          <label>Usuário<input name="username" autoComplete="username" maxLength={120} required /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" maxLength={256} required /></label>
          {error && <p role="alert">{error}</p>}
          <div className="login-actions">
            <button type="button" disabled={busy} onClick={() => dialog.current.close()}>Cancelar</button>
            <button className="site-login" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          </div>
        </form>
      </dialog>
    </header>
  )
}

export default Menu
