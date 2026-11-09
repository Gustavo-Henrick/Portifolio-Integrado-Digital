import "./Style.css"
function Senai() {
  return (
    <div>
      <h1 className="btn-title">Senai</h1>
      

        <div className="container">
        <button className="btn">
            <h1 className="btn-title">Matematica</h1>
            <p className="btn-content">conteudo sobre matemática</p>
       
        </button>

        <button className="btn">
            <h1 className="btn-title">Linguagens</h1>
            <p className="btn-content">conteudo sobre linguagens</p>
        
        </button>

        <button className="btn">
            <h1 className="btn-title">Ciências da Natureza</h1>
            <p className="btn-content">conteudo sobre ciências da natureza</p>
    
        </button>

        <button className="btn">
            <h1 className="btn-title">Ciências Humanas</h1>
            <p className="btn-content">conteudo sobre ciências humanas</p>
           
        </button>
        </div>
    </div>
  );
}
export default Senai;