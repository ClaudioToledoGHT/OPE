import React from 'react';
import logo from '../Assets/logo_1.jpeg';
import { Link, Navi } from 'react-router-dom';

const Header = () => {

    const logout = () => {
        fetch("/logout",{
            method: 'GET',
        }).then(res => {
        })
        window.location.href = "/autenticacao"
    } 

    return (
            <header>
                <nav className="navbar navbar-expand-lg navbar-light " style={{marginBottom:'10px'}}>
                <img className="logo" src={logo} />
                <a className="navbar-brand logo" href='/Estoque'>
                </a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">

                        <li className="nav-item">
                            <a id="ordens" className={window.location.pathname == "/" || window.location.pathname.indexOf('ordemservico') != -1 ? 'selected-menu-item nav-link' : 'nav-link'} href="/">Ordens de Serviço</a>
                        </li>

                        <li className="nav-item">
                            <a id="estoque"  className={window.location.pathname == "/Estoque" ? 'selected-menu-item nav-link' : 'nav-link'} href="/Estoque">Estoque</a>
                        </li>

                        <li className="nav-item">
                            <a id="func"  className={window.location.pathname.indexOf("/usuarios") != -1 ? 'selected-menu-item nav-link' : 'nav-link'} href="/usuarios">Colaboradores</a>
                        </li>

                        <li className="nav-item">   
                            <a id="servicos"  className={window.location.pathname == "/Servicos" ? 'selected-menu-item nav-link' : 'nav-link'} href="/Servicos">Serviços</a>
                        </li>
                    
                    </ul>
                </div>

                <div className="logout">
                    <div onClick={logout} ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-right" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                    </svg></div>
                </div>
                </nav>
            </header>
    )
}
export default Header;