import Sesi from "./pages/Sesi/Sesi.jsx"
import Home from "./pages/Home/Home.jsx"
import {Route, Routes} from "react-router-dom"
import Menu from "./components/Menu/Menu.jsx"
import './App.css'

function App() {
  
  return (
  <>
  <Menu></Menu>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/sesi" element={<Sesi />} />
  </Routes>
  </>
  )
}

export default App
