 import {Link} from "react-router-dom"
 import "./Style.css"
 
 function Menu(){
   
    return(
        <nav>
         
         <Link className="Home" to="/">HOME</Link>
         <Link className="Sesi" to="/sesi">SESI</Link>

         
        </nav>
    )
 }

 export default Menu