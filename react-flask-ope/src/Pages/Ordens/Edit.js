import React, { useState, useEffect } from 'react';
import './Ordens.css';
  
const EditOrdem = () => {
    const [item, setItem] = useState({});
    const [estoqueItensUtilizado, setEstoqueItensUtilizado] = useState([]);

    const [estoque, setEstoque] = useState([]);
    const [estoqueCopy, setEstoqueCopy] = useState([]);
    const [id, setId] = useState(null);
    const [colaboradores, setColaboradores] = useState([]);

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
                tipoServico: data[3],
                valorServico: data[4],
                fase: data[5],
                statusPagamento: data[6]
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
                    <h1 className="title">Editar - Ordem de serviço</h1>
                </div>

                {/* action={{ '/add/Mat_P' if method == 'POST' else '/edit/Mat_P/' ~ row.id }} */}
                <form 
                action={id == null ? `/add/Ordem_S` : `/edit/Ordem_S/${item.id}`}
                    method="POST" className="os-form">

                    <div className="os-data">
                        <div className="form-group">
                            <label>Detalhes:</label>
                            <input id='detalhes' name='detalhes' type='text' value ={item.detalhes} required="required" placeholder="Digite os detalhes da OS" size="80" className="form-control" onChange={(event) => setItem({...item, detalhes: event.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Preço das Peças:</label>
                            <input id='valorPecas' name='valorPecas' type='number' step="0.01" min="0.01" value={item.valorPecas} required="required" placeholder="Digite o valor das peças" size="80"  className="form-control" onChange={(event) => setItem({...item, valorPecas: event.target.value})}/>
                        </div>

                        <div className="form-group">
                        <label>Serivço Executado:</label>
                            <br/>
                            <select name="servicoExecutado" id="servicoExecutado" className="form-select">
                            <option value={1}>1 - Instalação de rede doméstica</option>
                            <option value={2}>2 - Instalação de rede comercial</option>
                            <option value={3}>3 - Reparo geral</option>
                            <option value={4}>4 - Reparo de vazamento</option>
                        </select>         
                        </div>

                        <div className="form-group">
                            <label>Taxa de Serviço:</label>
                            <input id='valorServico' name='valorServico' type='number' step="0.01" min="0.01" value={item.valorServico} required="required" placeholder="Digite o Preço" size="80" className="form-control" onChange={(event) => setItem({...item, valorServico: event.target.value})}/>            
                        </div>

                        <div className="form-group">
                        <label>Status da OS:</label>
                            <br/>
                            <select name="fase" id="fase" className="form-select" onChange={(event) => setItem({...item, fase: event.target.value})} value={item.fase} defaultValue={item.fase}>
                            <option value={1}>1 - Solicitada</option>
                            <option value={2}>2 - Agendamento</option>
                            <option value={3}>3 - Agendada</option>
                            <option value={4}>4 - Executada</option>
                        </select>         
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
                            <div style={{width:'100%', textAlign: 'center'}}>
                                <button id="submit" type="submit" className="btn novo-item" style={{width: '200px'}}>Salvar</button>
                            </div>
                        </div> 
                    </div>

                    <div className="os-agendamentos">
                        <h3>Agendamentos</h3>
                            
                        <br/>
                        <button className="btn novo-item" onClick={(event) => {
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
                                        <input  className="form-control" type="datetime-local" id="initdatetime" value={agendamento.inicioDateTime} onChange={(event) => {

                                            var items = [...agendamentos];
                                            var agenda = items.find(a => a.id == agendamento.id);
                                            agenda.inicioDateTime = event.target.value
                                            setAgendamentos(items)
                                        }} />
                                        <br/>
                                        <label>Término</label>
                                        <input className="form-control" defaultValue={agendamento.terminoDateTime} type="datetime-local" id="enddatetime"  value={agendamento.terminoDateTime} onChange={(event) => {

                                            var items = [...agendamentos];
                                            var agenda = items.find(a => a.id == agendamento.id);
                                            agenda.terminoDateTime = event.target.value
                                            setAgendamentos(items)
                                        }} />
                                    </>

                                    :

                                    <>
                                    <div className="align-r">
                                        <i class="fa fa-remove icon pointer" onClick={() => excluirAgendamento(agendamento)}></i>
                                    </div>

                                    <b>Data: </b><p>{agendamento.inicioDateTime.toLocaleString()}</p>
                                    <span><b>Status: </b><p>{getStatusAgendamento(agendamento.statusAgendamento, agendamento.terminoDateTime)}</p></span>

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
                                      });
                                }}>Cadastrar</button>}
                                    </div> 
                                ))}

                        <br/>

                        
                    </div>



                    <br/>
                    <br/>

                    <div className=" os-materiais">

                        <div>
                            <h3>Matérias Primas requeridas</h3>
                            <div>
                            {estoqueItensUtilizado.map((item) => (
                                    <div className="d-flex" key={item.id}>

                                        <div>
                                            <span className="add-option" onClick={() => {

                                                var quantidadeInvalida = false;
                                                var itemEstoque;
                                                const newList = estoqueItensUtilizado.map((materia) => {
                                                    if (materia.id === item.id) {
                                                        itemEstoque = estoque.find((e) => e.id == item.id);
                                                        

                                                        if(item.Quantidade + 1 > itemEstoque.QtdeDisponivel){
                                                            alert('Quantidade indisponível')
                                                            quantidadeInvalida = true;
                                                        }

                                                    var materiaUtilizada = {...materia};
                                                    materiaUtilizada.Quantidade = materiaUtilizada.Quantidade +1;
                                                    materiaUtilizada.QtdeDisponivel = materiaUtilizada.QtdeDisponivel -1;
                                                    }
                                                    return materiaUtilizada;
                                                })
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

                                                return setEstoqueItensUtilizado([...newList.filter(n => n != undefined)])
                                                }}>-</span>
                                            </div>


                                        <div key={item?.id} className="list-group-item ml-15">
                                            <span><b>{item?.Quantidade}</b></span>
                                            <span> - </span>
                                            <span className="ml-30">{item?.nome}</span>
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
                        </div>                        

                    </div>

                    <div className="os-materias-primas" style={{maxWidth: '300px'}}>
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
                                        return setEstoqueItensUtilizado([...estoqueItensUtilizado, novoItem])
                                    }}>
                                        <b>{item.QtdeDisponivel}-</b>
                                        &nbsp;
                                        <span>{item.nome}</span>
                                    </button>)
                                ))}
                            </div>
                        </div>
                </form>

                
            </main>
    )
}
export default EditOrdem;