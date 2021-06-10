import React, { useState, useEffect } from 'react';
import { Route, Navigate } from 'react-router-dom';
import Loading from '../../Components/Loading';
import OrdemCard from './Card';
import './Ordens.css';
// import Board from 'react-trello';
  
const Ordens = () => {
    const [estoque, setEstoque] = useState([]);
    const [novasOrdens, setNovasOrdens] = useState([]);
    const [ordensAguardando, setOrdensAguardando] = useState([]);
    const [ordensAgendadas, setOrdensAgendadas] = useState([]);
    const [ordensExecutadas, setOrdensExecutadas] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filterText, setFilterText] = useState('');
    const [filtroFase, setFiltroFase] = useState('0');
    const [filtroPgto, setFiltroPgto] = useState('0');


    useEffect(() => {
        fetch('/api/ordensdeservico').then(res => {

            console.log('res', res)
            if(res.status == 401)
                window.location = "/autenticacao";
            else
                return res.json()
        }).then(data => {
            console.log('estoque', data)
            setNovasOrdens(data.result.filter((ordem) => ordem.fase == 1))
            setOrdensAguardando(data.result.filter((ordem) => ordem.fase == 2))
            setOrdensAgendadas(data.result.filter((ordem) => ordem.fase == 3))
            setOrdensExecutadas(data.result.filter((ordem) => ordem.fase == 4))

            setLoading(false);
          })
          .catch(e => {
            console.log('e', e)
            setError('Ops, não foi possível conectar! Por favor, tente novamente mais tarde')
        });
    }, []);

    const editFunction = (id) => {
        window.open(`/ordemservico/edit/${id}`);
    }

    const addFunction = () => {
        window.location.href = '/ordemservico/adicionar';
    }

    const FiltrarOrdensStatus = () => {

        setLoading(true);
        var filtros = []

        if(filtroFase != '0')
            filtros.push({
                campo: 'fase',
                valor: parseInt(filtroFase)
            })

        if(filtroPgto != '0')
            filtros.push({
                "campo": 'statusPagamento',
                "valor": parseInt(filtroPgto)
            })

        if(filterText != '')
        filtros.push({
            "campo": 'detalhes',
            "valor": filterText
        })

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        fetch('/api/ordensdeservico/filtrar', {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify({"filters": filtros})
        })
        .then(res => {

            if(res.status == 401)
                window.location = "/autenticacao";
            console.log('res', res)
            return res.json()
        })
        .then(data => {
            console.log('estoque', data)
            setNovasOrdens(data.result.filter((ordem) => ordem.fase == 1))
            setOrdensAguardando(data.result.filter((ordem) => ordem.fase == 2))
            setOrdensAgendadas(data.result.filter((ordem) => ordem.fase == 3))
            setOrdensExecutadas(data.result.filter((ordem) => ordem.fase == 4))

            setLoading(false);
          })
    }

    const deleteFunction = (id, type) => {
        if (window.confirm('Deseja realmente excluir esse registro?')) {
            fetch('/delete/ordensdeservico/' + id, {
            method: 'DELETE',
            })
            .then(res => {
                console.log('res')
                if(res.status == 401)
                    return window.location = "/autenticacao";
                else
                    return res.text()
            }) // or res.json()
            .then(res => {
                switch(type){
                    case 1:
                        console.log('remove', [...estoque.filter(item => item.id != id)])
                        setNovasOrdens([...novasOrdens.filter(item => item.id != id)])
                        break;
                    case 2:
                        setOrdensAguardando([...ordensAguardando.filter(item => item.id != id)])
                        break;
                    case 3:
                        setOrdensAgendadas([...ordensAgendadas.filter(item => item.id != id)])
                        break;
                    case 4:
                        setOrdensExecutadas([...ordensExecutadas.filter(item => item.id != id)])
                        break;
                    default:
                        break;
                }
                
            })
        }
    }


    return (
            <main>
                <div className="flex header-container">
                    <h1 className="title">Ordens de Serviço</h1>
                    <button type="button" className="btn novo-item" onClick={addFunction}>Novo item</button>                    
                </div>

                <div className="flex header-container">

                    <div>
                        <p>Fase</p>
                        <select className="form-select" defaultValue="0" value={filtroFase} onChange={(event) => setFiltroFase(event.target.value)}>
                            <option value="0">Selecione</option>
                            <option value="1">Solicitada</option>
                            <option value="2">Aguardando Agenda</option>
                            <option value="3">Agendada</option>
                            <option value="4">Executada</option>
                        </select>
                    </div>                    

                    <div>
                        <p>Pagamento</p>
                        <select className="form-select" defaultValue="0" value={filtroPgto} onChange={(event) => setFiltroPgto(event.target.value)}>
                            <option value="0">Selecione</option>
                            <option value="1">Pendente</option>
                            <option value="2">1ª parte paga</option>
                            <option value="3">Realizado</option>
                        </select>
                    </div>

                    <div>
                        <p>Descrição</p>
                        <input className="form-control" type='text' name='filtro_OS' value={filterText} onChange={(ev) => setFilterText(ev.target.value)} id='filtro_OS' placeholder='Pesquisar'/>
                    </div>
                    
                    <button type="button" className="btn novo-item" onClick={FiltrarOrdensStatus} disabled={loading}>Filtrar</button>
                </div>

                {loading && error == null && <Loading />}

                {error != null && <p className="error">{error}</p>}

                {!loading && <section className="itens-ordens">
                    <div className="ordens-novas">
                        <h3>Novas</h3>
                        
                        {novasOrdens.map((row) => (
                            <OrdemCard row={row} editFunction={editFunction} deleteFunction={deleteFunction} />
                        ))}
                    </div>

                    <div className="ordens-aguardando">
                        <h3>Aguardando Agenda</h3>
                        {ordensAguardando.map((row) => (
                            <OrdemCard row={row} editFunction={editFunction} deleteFunction={deleteFunction} />
                        ))}
                    </div>

                    <div className="ordens-agendadas">
                        <h3>Agendadas</h3>
                        {ordensAgendadas.map((row) => (
                            <OrdemCard row={row} editFunction={editFunction} deleteFunction={deleteFunction} />
                        ))}
                    </div>

                    <div className="ordens-executadas">
                        <h3>Executadas</h3>
                        {ordensExecutadas.map((row) => (
                            <OrdemCard row={row} editFunction={editFunction} deleteFunction={deleteFunction} />
                        ))}
                    </div>

                </section>}

            </main>
    )
}
export default Ordens;