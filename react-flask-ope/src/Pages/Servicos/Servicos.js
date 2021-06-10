import React, { useState, useEffect } from 'react';
  
const Servicos = () => {
    const [estoque, setServicos] = useState([]);
    const [error, setError] = useState(null);
    const [isADM, setIsADM] = useState(false);

    useEffect(() => {
        setIsADM(localStorage.getItem('adm') == "true" ? true : false)
        fetch('/api/servicos')
        .then(function(response) {
            if (!response.ok) {

                if(response.status == 401){
                    window.location.replace('/autenticacao');
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('servicos', data)

            if(data?.result)
                setServicos(data.result);
          })
        .catch(e => {
            console.log('e', e)
            setError('Ops, não foi possível conectar! Por favor, tente novamente mais tarde')
        });
    }, []);

    const addFunction = () => {
        window.location.href = 'http://127.0.0.1:5000/add/Servico';
    }

    const deleteFunction = (id) => {
        if (window.confirm('Deseja realmente excluir esse registro?')) {
            fetch('/delete/Servico/' + id, {
            method: 'DELETE',
            })
            .then(res => res.text()) // or res.json()
            .then(res => {
                setServicos([...estoque.filter(item => item.id != id)])
            })
        }
    }

    return (
            <main>
                <div class="flex header-container">
                    <h1 class="title">Serviços</h1>
                    {/* {isADM && <button type="button" class="btn novo-item" onClick={addFunction}>Novo item</button>} */}
                </div>

                {error != null ? <p className="error">{error}</p>
                :
                <table class='table table-sm table-striped table-responsive-md'>
                    <thead>
                        <tr>
                            {/* <th scope="col">ID</th> */}
                            <th scope="col">Nome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estoque.map((item) => (
                            <tr id={item.id}>
                            {/* <td>{item['id']}</td> */}
                            <td>{item['Nome']}</td>
                            {/* <td>
                                <i class="fa fa-edit icon pointer" onClick={() => (window.location = `http://127.0.0.1:5000/edit/Servicos/${item.id}`)}></i>
                            </td> */}
                            {/* <td>
                                <i class="fa fa-remove icon pointer" onClick={() => deleteFunction(item.id)}></i>
                            </td> */}
                            </tr>
                        ))}
                        
                    </tbody>
                </table>
                }
            </main>
    )
}
export default Servicos;