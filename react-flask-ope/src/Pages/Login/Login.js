import React, { useState, useEffect } from 'react';
import logo from '../../Assets/logo_1.jpeg';
  
const Estoque = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [errorText, setErrorText] = useState('');

    useEffect(() => {
        
    }, []);

    const authenticate = async(event) => {
        event.preventDefault()
        const data = new URLSearchParams();
        data.append('email', login)
        data.append('password', password)

        fetch('/login',{
            method: 'POST',
            body: data
        }).then(res => {
            console.log('res', res.status)
            
            if(res.status == 404){
                setErrorText("Dados inválidos")
                return;
            }
            else {

                window.location = "/"
            }
            
            return res.json()
        })
        .then(res =>{
            console.log('res2', res)
            if(res != undefined)
                localStorage.setItem('adm', res.data.permission == 'S')
        })
    }

    return (
        <main className="login-page">
            <form class="form-signin" action="/login" method="POST">
                <img class="mb-4" src={logo} alt="" width="300" height="300" />
                <h1 class="h3 mb-3 font-weight-normal">Bem Vindo!</h1>
                <label for="inputEmail" class="sr-only">Email address</label>
                <div style={{maxWidth: '300px', textAlign: 'center', margin: 'auto', marginBottom: '20px'}}>
                    <input name='email' type="email" id="inputEmail" class="form-control" placeholder="E-mail" value={login} onChange={(event) => setLogin(event.target.value)} required autofocus />
                    <label for="inputPassword" class="sr-only">Password</label>
                    <input name='password' type="password" value={password} onChange={(event) => setPassword(event.target.value)} id="inputPassword" class="form-control" placeholder="Password" required />
                </div>
            

            <button class="btn btn-lg btn-primary" type="submit" onClick={authenticate}>Entrar</button>

            <br/>
            <br/>

            <p>{errorText}</p>

            <p class="mt-5 mb-3 text-muted">&copy; 2021</p>

            </form>
        </main>
    )
}
export default Estoque;