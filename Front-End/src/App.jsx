import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { readSession } from './api/session.js'
import Menu from './components/Menu/Menu.jsx'
import Home from './pages/Home/Home.jsx'
import Sesi from './pages/Sesi/Sesi.jsx'
import Senai from './pages/Senai/Senai.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    function sessionExpired() { setUser(null) }
    window.addEventListener('portfolio:session-expired', sessionExpired)

    readSession(controller.signal).then((currentUser) => {
      if (!controller.signal.aborted) setUser(currentUser)
    }, () => {}).finally(() => {
      if (!controller.signal.aborted) setChecking(false)
    })
    return () => {
      controller.abort()
      window.removeEventListener('portfolio:session-expired', sessionExpired)
    }
  }, [])

  const signedIn = Boolean(user)
  return (
    <>
      <Menu signedIn={signedIn} checking={checking} onSignIn={setUser} onSignOut={() => setUser(null)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sesi" element={<Sesi signedIn={signedIn} />} />
        <Route path="/senai" element={<Senai signedIn={signedIn} />} />
      </Routes>
    </>
  )
}

export default App

