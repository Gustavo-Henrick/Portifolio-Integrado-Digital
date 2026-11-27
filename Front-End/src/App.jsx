import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Menu from './components/Menu/Menu.jsx'
import Home from './pages/Home/Home.jsx'
import Sesi from './pages/Sesi/Sesi.jsx'
import Senai from './pages/Senai/Senai.jsx'
import './App.css'

function App() {
  const [signedIn, setSignedIn] = useState(false)

  return (
    <>
      <Menu signedIn={signedIn} onSignIn={() => setSignedIn(true)} onSignOut={() => setSignedIn(false)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sesi" element={<Sesi signedIn={signedIn} />} />
        <Route path="/senai" element={<Senai signedIn={signedIn} />} />
      </Routes>
    </>
  )
}

export default App
