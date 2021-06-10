import React, { useState, useEffect } from 'react';
import './Ordens.css';
  
const EditOrdem = () => {
    const [item, setItem] = useState({});
    const [estoqueItensUtilizado, setEstoqueItensUtilizado] = useState([]);

    const [estoque, setEstoque] = useState([]);
    const [estoqueCopy, setEstoqueCopy] = useState([]);
    const [id, setId] = useState(null);
    const [colaboradores, setColaboradores] = useState([]);
    const [servicesSum, setServicesSum] = useState(0);

    const [agendamentos, setAgendamentos] = useState([]);

    const getSmallDateTimeFormat = (date) => {

        console.log('data', date)
        
        var formatDate = new Date(date); 
        formatDate = formatDate.getUTCFullYear() + '-' +
        ('00' + (formatDate.getUTCMonth()+1)).slice(-2) + '-' +
        ('00' + formatDate.getUTCDate()).slice(-2) + ' ' + 
        ('00' + formatDate.getUTCHours()).slice(-2) + ':' + 
        ('00' + formatDate.getUTCMinutes()).slice(-2) + ':' + 
        ('00' + formatDate.getUTCSeconds()).slice(-2);
        
        console.log('formatDate', formatDate)
        return formatDate;

    }

    useEffect(() => {
        console.log('ordem')
        var url = window.location.href;
        const valueId = url.substring(url.lastIndexOf('/') + 1);
        if(valueId != 'adicionar')
            setId(valueId);
            

        // pegando informações da ordem de serviço
        fetch(`/api/edit/Ordem_S/${url.substring(url.lastIndexOf('/') + 1)}`).then(res => {
            if(res.status == 401)
                window.location = "/autenticacao";
            return res.json()
        }).then(data => {
            data = data.results;

            var body = {
                id: data[0],
                detalhes: data[1],
                valorPecas: data[2],
                valorServico: data[3],
                fase: data[4],
                statusPagamento: data[5],
                responsavel_id: data[6],
                tipoServico: data[7]
            }
            setItem(body);
        });

        // pegando itens do estoque
        fetch('/api/estoque').then(res => res.json()).then(data => {

            // pegando materias primas selecionadas para a ordem de serviço
            fetch(`/api/materiasprimas/ordemservico/${url.substring(url.lastIndexOf('/') + 1)}`).then(res => res.json()).then(dataResult => {

                var dados = [];

                data.result.forEach(esto => {

                    dataResult.results.forEach(da => {
                        if(esto.id == da.id_materia_prima){
                            var mat = esto;
                            mat.Quantidade = da.Quantidade;
                            dados.push(mat);
                        }
                    });
                });        
                setEstoqueItensUtilizado(dados);

                dados.map((d) => {
                    data.result = data.result.filter((e) => {
                        if(parseInt(e.id) == parseInt(d.id)){
                            e.show = false;
                        }
                        return e;
                    });
                })

                console.log('estoque', data.result)
                
                setEstoque([...data.result])
                setEstoqueCopy([...data.result])
                
                var sum = 0
                dados.map((a) => (sum += (a.valor_venda * a.Quantidade)))
                console.log('sum', sum)
                console.log('sum1', sum)
                setServicesSum(sum)
            });
          });

          // pegando agendamentos cadastrados
        fetch(`/api/agendamento/ordemservico/${url.substring(url.lastIndexOf('/') + 1)}`).then(res => res.json()).then(data => {
            var dados = [];
            data.results.forEach(agenda => { 
                let a = {
                    id: agenda.Id,
                    statusAgendamento: agenda.StatusAgendamento,
                    inicioDateTime: new Date(agenda.InicioDateTime.toString()),
                    terminoDateTime: new Date(agenda.TerminoDateTime.toString()),
                }
                dados.push(a)
            });        

            // console.log('dsados', dados)
            setAgendamentos(dados);

        });

          fetch('/api/usuarios').then(res => res.json()).then(data => {
            console.log('usuarios', data)
            setColaboradores(data.result);
          });

    }, []);
    


    const excluirAgendamento = (agendamento) => {
        console.log('remover')

        var body = {
            inicioDateTime: getSmallDateTimeFormat(agendamento.inicioDateTime),
            terminoDateTime: getSmallDateTimeFormat(agendamento.terminoDateTime),
            statusAgendamento: 1,
        }

        fetch(`/api/agendamento/${agendamento.id}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        },
            ).then(res => res.json()).then(data => {
            console.log('response', data)

          });
       window.location.reload()
    }

    const getStatusAgendamento = (status, data) => {

        if(status == 1)
            return 'Cancelado';
        
        if(data < new Date())
            return 'Realizado'

        return 'Agendado'
    }

    return (
            <main>
                <div className="flex header-container">
                    <h1 className="title">{id == null ? 'Cadastrar' : 'Editar'} - Ordem de Serviço</h1>
                </div>

                {/* action={{ '/add/Mat_P' if method == 'POST' else '/edit/Mat_P/' ~ row.id }} */}
                <form 
                action={id == null ? `/add/Ordem_S` : `/edit/Ordem_S/${item.id}`}
                    method="POST" className="os-form">

                    <div className="os-data">
                    <h3>Detalhes</h3>
                        <div className="form-group">
                            <label>Solicitação:</label>
                            <input id='detalhes' name='detalhes' type='text' value ={item.detalhes} required="required" placeholder="Digite os detalhes da OS" size="80" className="form-control" onChange={(event) => setItem({...item, detalhes: event.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Endereço:</label>
                            <input id='endereco' name='endereco' type='text' value ={item.enderecoServico} required="required" placeholder="Digite o endereço" size="80" className="form-control" onChange={(event) => setItem({...item, enderecoServico: event.target.value})} />
                        </div>

                            <div className="form-group">
                                <label>Preço das peças:</label>
                                <input  type='number' step="0.01" min="0" value={servicesSum}  placeholder="Digite o valor das peças" size="80"  className="form-control" onChange={(event) => setItem({...item, valorPecas: event.target.value})} disabled/>

                                <input name="valorPecas" id="valorPecas" type="hidden" size="40" value={servicesSum}/>

                            </div>

                            <div className="form-group">
                                <label>Taxa de serviço:</label>
                                <input id='valorServico' name='valorServico' type='number' step="0.01" min="0.01" value={item.valorServico} required="required" placeholder="Digite o Preço" size="80" className="form-control" onChange={(event) => setItem({...item, valorServico: event.target.value})}/>            
                            </div>


                            <div className="form-group">
                                <label>Serviço executado:</label>
                                <br/>
                                <select name="servicoExecutado" id="servicoExecutado" className="form-select" aria-label="Default select example">
                                    <option value={17}>1 - Instalação de rede doméstica</option>
                                    <option value={18}>2 - Instalação de rede comercial</option>
                                    <option value={19}>3 - Reparo geral</option>
                                    <option value={30}>4 - Reparo de vazamento</option>
                                </select>  


                            <div className="form-group"  style={{width: '47%'}}>
                                <label>Status da OS:</label>
                                    <br/>
                                    <select name="fase" id="fase" className="form-select" onChange={(event) => setItem({...item, fase: event.target.value})} value={item.fase} defaultValue={item.fase}>
                                    <option value={1}>1 - Solicitada</option>
                                    <option value={2}>2 - Agendamento</option>
                                    <option value={3}>3 - Agendada</option>
                                    <option value={4}>4 - Executada</option>

                                </select>         
                            </div>
                        </div>


                        

                     

                        

                        <div className="form-group">
                            <label>Status do Pagamento:</label>
                            <br/>
                            <select className="form-select" name="statusPagamento" id="statusPagamento" defaultValue={item.statusPagamento} onChange={(event) => setItem({...item, statusPagamento: event.target.value})} value={item.statusPagamento}>
                                <option value="1">1 - Não paga</option>
                                <option value="2">2 - Paga 1ª Parcela</option>
                                <option value="3">3 - Paga 2ª Parcela</option>
                            </select>  
                        </div>

                        <div className="form-group">
                            <label>Profissional responsável:</label>
                            <br/>
                            <select className="form-select" value={item.responsavel_id} value={item.responsavel_id} name="responsavel_id" id="responsavel_id" onChange={(event) => {
                                setItem({...item, responsavel_id: event.target.value})
                            }}>
                                <option disabled>Selecione</option>
                                {colaboradores.map(colaborador => (
                                    <option key={colaborador.Id} value={colaborador.Id}>{colaborador.nome}</option>
                                ))}
                            </select>  
                        </div>

                        <div className="form-group">
                            <div style={{width:'100%', textAlign: 'center', marginTop: '40px'}}>
                                <button id="submit" type="submit" className="btn novo-item" style={{width: '200px'}}>Salvar</button>
                            </div>
                        </div> 
                        <input name="dataexe" id="dataexe" type="hidden" size="40" value={item.fase == 4 ? new Date().toJSON() : null}/>
                    </div>

                    <div className="os-agendamentos">

                        {id != null && <div>
                            
                        
                            <h3>Agendamentos</h3>
                                
                            <br/>
                            <button className="btn novo-item-white" onClick={(event) => {
                                event.preventDefault()

                                setAgendamentos([...agendamentos, {inicioDateTime: new Date(), terminoDateTime: new Date()}])
                            }}>adicionar</button>

                            <br/>
                            <br/>

                            {agendamentos.map(agendamento => (
                                <div className="form-group" key={agendamento.id}>                                
                                    
                                    {agendamento.id == null ?
                                                                
                                        <>
                                            <label>Início</label>
                                            <input  style={{width: 'auto', marginLeft: 'auto'}} className="form-control" type="datetime-local" id="initdatetime" value={agendamento.inicioDateTime} onChange={(event) => {

                                                var items = [...agendamentos];
                                                var agenda = items.find(a => a.id == agendamento.id);
                                                agenda.inicioDateTime = event.target.value
                                                setAgendamentos(items)
                                            }} />
                                            <br/>
                                            <label>Término</label>
                                            <input className="form-control" defaultValue={agendamento.terminoDateTime} style={{width: 'auto', marginLeft: 'auto'}} type="datetime-local" id="enddatetime"  value={agendamento.terminoDateTime} onChange={(event) => {

                                                var items = [...agendamentos];
                                                var agenda = items.find(a => a.id == agendamento.id);
                                                agenda.terminoDateTime = event.target.value
                                                setAgendamentos(items)
                                            }} />
                                        </>

                                        :

                                        <>
                                    
                                    <p><b>Data: </b>{agendamento.inicioDateTime.toLocaleString()}</p>
                                        <p><b>Status: </b>{getStatusAgendamento(agendamento.statusAgendamento, agendamento.terminoDateTime)}</p>
                                       {agendamento.statusAgendamento != 1 && <button className="btn cancel-button" onClick={(ev) => {
                                           ev.preventDefault()
                                           excluirAgendamento(agendamento)
                                       }}>Cancelar agendamento</button>}

                                        </>                                                    
                                    }                

                                    <br/>    

                                    {agendamento.id == null && <button className="btn novo-item" onClick={(event) => {
                                        event.preventDefault();

                                        const body = {
                                            "inicioDateTime": getSmallDateTimeFormat(agendamento.inicioDateTime),
                                            "terminoDateTime": getSmallDateTimeFormat(agendamento.terminoDateTime),
                                            "status": 0 //criado
                                        }

                                        fetch(`/api/agendamento/adicionar/ordemservico/${id}`, {
                                            method: 'POST',
                                            headers: {
                                            'Accept': 'application/json',
                                            'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify(body)
                                        },
                                            ).then(res => res.json()).then(data => {
                                            console.log('response', data)
                                            window.location.reload()
                                        });
                                    }}>Cadastrar</button>}
                                        </div> 
                                    ))}

                            <br/>
                        </div>}

                    </div>


                    <div className="os-materiais">

                        {id != null && <div>
                            <h3>Matérias Primas requeridas</h3>
                            <div>
                            {estoqueItensUtilizado.map((item) => (
                                    <div className="d-flex" key={item.id}>

                                        <div>
                                            <span className="add-option" onClick={() => {

                                                var quantidadeInvalida = false;
                                                var itensEstoque = [...estoque];

                                                var sum = 0;
                                                    estoqueItensUtilizado.map((a) => (sum += a.valor_venda))

                                                    console.log('sum', sum)

                                                const newList = estoqueItensUtilizado.map((materia) => {

                                                    var itemEstoque = itensEstoque.find((e) => e.id == item.id);
                                                    if (materia.id === item.id) {
                                                                                                   
                                                        if(item.Quantidade + 1 > itemEstoque.QtdeDisponivel){
                                                            alert('Quantidade indisponível')
                                                            quantidadeInvalida = true;
                                                        }

                                                    materia.Quantidade = materia.Quantidade +1;
                                                    materia.QtdeDisponivel = materia.QtdeDisponivel -1;
                                                    }

                                                    return materia;
                                                })
                                                var sum = 0;
                                                newList.map((a) => (sum += a.valor_venda * a.Quantidade))
                                                setServicesSum(sum)
                                                
                                                if(!quantidadeInvalida){
                                                    return setEstoqueItensUtilizado([...newList])
                                                }
                                                }}>+</span>

                                                <span className="add-option" style={{marginLeft: '10px'}} onClick={() => {
                                                    var itensEstoque = [...estoque];
                                                    
                                                    const newList = estoqueItensUtilizado.map((materia) => {
                                                    
                                                        var itemEstoque = itensEstoque.find((e) => e.id == item.id);

                                                        if (materia.id === item.id) {

                                                            var materiaUtilizada = {...materia};

                                                            if(materiaUtilizada.Quantidade > 1){
                                                                materiaUtilizada.Quantidade = materiaUtilizada.Quantidade -1;
                                                                materiaUtilizada.QtdeDisponivel = materiaUtilizada.QtdeDisponivel +1;
                                                                return materiaUtilizada;
                                                            }else {
                                                                

                                                                if(itemEstoque != undefined){                                                                
                                                                    itemEstoque.show = true;
                                                                    
                                                                }else {
                                                                    // TODO
                                                                }
                                                                console.log('item estoque', item)
                                                            }
                                                        }else{

                                                            return materia;
                                                        }
                                                    })
                                                    
                                                    

                                                    console.log(itensEstoque)
                                                // setEstoque(itensEstoque)
                                                console.log(itensEstoque)
                                                console.log('2222', estoqueItensUtilizado.reduce((a, b) => (a.valor_venda) + b.valor_venda))

                                                    var sum = 0;
                                                    console.log('a', newList)
                                                    newList.map((a) => (sum += a != undefined ? a.valor_venda * a.Quantidade : 0))
                                                    setServicesSum(sum)

                                                return setEstoqueItensUtilizado([...newList.filter(n => n != undefined)])
                                                }}>-</span>
                                            </div>


                                        <div key={item?.id} className="list-group-item ml-15">
                                            <span><b>{item?.Quantidade}</b></span>
                                            <span> - </span>
                                            <span className="ml-30">{item?.nome}&nbsp;</span>
                                            <span className="ml-30"><b>R${(item.valor_venda * item.Quantidade).toFixed(2)}</b></span>
                                        </div>                                           
                                    </div>
                                ))}
                            </div>

                            <br/>

                            <div style={{width:'100%', textAlign: 'center'}}>
                                <button className="btn novo-item" style={{width: '150px'}} onClick={(event) => {
                                    event.preventDefault();
                                    console.log('estoqueCopy', estoqueCopy)
                                    console.log('estoqueCopy', estoque)
                                    console.log('estoqueItensUtilizado', estoqueItensUtilizado)
                                    console.log(`a`, estoqueCopy.find(e => e.id == 12))
                                    console.log(`a`, estoque.find(e => e.id == 12))
                                    console.log(`a`, estoqueItensUtilizado)

                                    // return;
                                    var body = estoqueItensUtilizado.map(it => (
                                        {
                                            "id_os": parseInt(id),
                                            "id_materia_prima": it.id,
                                            "quantidade": it.Quantidade,
                                            "valor": it.valor_venda,
                                            "responsavel_id": it.responsavel_id,
                                            "estoque_alteracao": (estoqueCopy.find(e => e.id == it.id).QtdeDisponivel - it.QtdeDisponivel) * (-1)
                                        }
                                    ))
   
                                    fetch(`/add/materiasprimas/ordemservico/${id}`, {
                                        method: 'POST',
                                        headers: {
                                          'Accept': 'application/json',
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(body)
                                    },
                                        ).then(res => res.json()).then(data => {
                                        console.log('response', data)
                                      });

                                      //todo: recarregar pg
                                      
                                }}>Salvar itens</button>
                            </div>
                        </div>   }                     

                    </div>

                    {id != null && <div className="os-materias-primas" style={{maxWidth: '300px', marginTop: '40px'}}>
                        <h5><b>Selecione as Matérias Primas necessárias</b></h5>

                        <div className="list-group">
                            {estoque.map((item) => (
                                (item.show != false && <button key={item.id} type="button" className="list-group-item list-group-item-action" 
                                onClick={() => {
                                    // escondendo itens selecionados da lista 
                                    var itensEstoque = [...estoque];
                                    var itemEstoque = itensEstoque.find((e) => e.id == item.id);
                                    itemEstoque.show = false;
                                    
                                    
                                    setEstoque(itensEstoque);
                                    
                                    var novoItem = {...item};
                                    novoItem.Quantidade = 1;
                                    novoItem.QtdeDisponivel = itemEstoque.QtdeDisponivel -1;

                                    var sum = 0;
                                    [...estoqueItensUtilizado, novoItem].map((a) => (sum += a.valor_venda * a.Quantidade))
                                    console.log('sum1', sum)
                                    setServicesSum(sum)

                                    return setEstoqueItensUtilizado([...estoqueItensUtilizado, novoItem])
                                }}>
                                    <b>{item.QtdeDisponivel}-</b>
                                    &nbsp;
                                    <span>{item.nome}&nbsp;</span>
                                    <span><b>R${item.valor_venda.toFixed(2)}</b></span>
                                </button>)
                            ))}
                        </div>
                    </div>}
                </form>

                
            </main>
    )
}
export default EditOrdem;