# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from flask_cors import CORS
from datetime import timedelta, datetime

import urllib
#import pyodbc
from sqlalchemy.sql.elements import Null
from sqlalchemy.sql.expression import null

app = Flask(__name__)
CORS(app)
params = urllib.parse.quote_plus(
    "DRIVER={SQL Server};SERVER=ght.database.windows.net;DATABASE=ghteam_db;UID=ghtadmin;PWD=GHT_SI4B2020")
db = SQLAlchemy(app)
engine = db.create_engine("mssql+pyodbc:///?odbc_connect=%s" % params, {})
app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc:///?odbc_connect=%s" % params
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
app.secret_key = "oi"
app.debug = True

reactPort = "http://localhost:3000"

admin = ''

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    login = db.Column(db.String(255))
    senha = db.Column(db.String(255))
    nome = db.Column(db.String(80))
    adm = db.Column(db.String(1))

    def __init__(self, login, senha, nome, adm):
        self.login = login
        self.senha = senha
        self.nome = nome
        self.adm = adm



@app.route('/')
def rota_Raiz():
    return redirect(reactPort)

@app.before_request
def before_request():
    g.user = None
    if request.path == 'logout':
        print('logging out')
    elif request.path == '/login':
        print('entrou')
        pass
    elif 'user' in session:
        g.user = session['user']
    else:
        # return redirect(reactPort + "/autenticacao")
        response = jsonify({})
        return response, 401
        
        
        
def checaPermissao(user):
    query_result = engine.execute("select * from Usuario where Login = '{}'".format(user))
    for i in query_result:
        if i[4] == 'S':
            return True
        else:
            return False

def checaSession(user):
    if 'user' in session:
        return True
    return False
    
    

@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'GET':
        return redirect(reactPort+'/autenticacao')

    classeFlash = 'alert alert-success'

    session.pop('user', None)
    login = request.form['email']
    senha = request.form['password']
    print('senha', senha)
    g.loggeduser = Usuario.query.filter_by(login=login, senha=senha).first()
    print('user',  g.loggeduser)

    if g.loggeduser is None:
        flash('Incorrect email or password.')
        classeFlash = 'alert alert-danger'
        response = {}
        return response, 404
    else:
        session['user'] = login
        print('Valor de ADM', g.loggeduser.adm)
        return jsonify({'data': {
            'permission': g.loggeduser.adm
        }}), 200

    # return render_template('index.html', classeFlash=classeFlash)            
    response = {}
    return response, 401      

@app.route('/logout')
def logout():
    print('deslogou')
    session.pop('user', None)
    #flash('You have logged out')
    return redirect(reactPort + 'autenticacao')



@app.route('/api/estoque')
def EstoqueAPI():
    if checaSession(g.user):
        checaPermissao(g.user)
        query_result = engine.execute('select * from MateriaPrima')
        return jsonify({'result': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

@app.route('/api/estoque/ordenar')
def EstoqueFiltroAPI():
    if checaSession(g.user):
        query_result = engine.execute('select * from MateriaPrima order by qtdedisponivel')
        print('query_result', query_result)
        return jsonify({'result': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

@app.route('/api/estoque/<filtro>')
def FiltroEstoqueAPI(filtro):
    if checaSession(g.user):
        sql = ("select * from MateriaPrima WHERE nome like('%{}%')").format(filtro)
        data = engine.execute(sql)
        return jsonify({'result': [dict(row) for row in data]})
    return redirect(url_for('login'))

@app.route('/api/servicos')
def ServicosAPI():
    if checaSession(g.user):
        query_result = engine.execute('select * from Servico')
        print(Usuario)
        return jsonify({'result': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

@app.route('/api/usuarios')
def UsuariosAPI():
    if checaSession(g.user):
        query_result = engine.execute('select * from Usuario')
        
        return jsonify({'result': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

@app.route('/api/ordensdeservico', methods=['POST', 'GET'])
def OrdensDeServicoAPI():
    if checaSession(g.user):

        data = engine.execute('select os.id, os.detalhes, os.valorPecas, os.valorServico, os.fase, os.statusPagamento, os.dataexe,Usuario.nome as responsavel from OrdensdeServico as os LEFT JOIN Usuario ON os.responsavel_id = Usuario.Id')

        for row in data:
            if row.dataexe != None and row.fase == 4 and datetime.utcnow() - row.dataexe > timedelta(minutes=20):
                sql = "UPDATE ordensdeservico SET fase = 5 where id = {}".format(row.id)
                engine.execute(sql)

        data = engine.execute('select os.id, os.detalhes, os.valorPecas, os.valorServico, os.fase, os.statusPagamento, os.dataexe,Usuario.nome as responsavel from OrdensdeServico as os LEFT JOIN Usuario ON os.responsavel_id = Usuario.Id')


        return jsonify({'result': [dict(row) for row in data]})

    return redirect(url_for('login'))

@app.route('/api/ordensdeservico/filtrar', methods=['POST'])
def FiltroOrdensDeServicoAPI():
    if checaSession(g.user):

        payload = request.get_json()

        print('payload', payload)
        filtros = payload["filters"];

        query = ''
        print('****************************************************')
        print(filtros)
        sql = 'select os.id, os.detalhes, os.valorPecas, os.valorServico, os.fase, os.statusPagamento, Usuario.nome as responsavel from OrdensdeServico as os LEFT JOIN Usuario ON os.responsavel_id = Usuario.Id ';
        for i in range(0, len(filtros)):
            filtros[i]
            print('************************')
            # if(filtros[i]['campo'] == 'statusPagamento'):
                # query = 'WHERE statusPagamento = ' + filtros[i]['valor']
            if query != '':
                query += ' AND '

            if filtros[i]['campo'] == 'detalhes':
                query += ('{} like \'%{}%\' ').format(filtros[i]['campo'], filtros[i]['valor'])
            else:
                query += ('{} = {}').format(filtros[i]['campo'], filtros[i]['valor'])
            print('----------------------------------------------------------')
                # print(query)

        connector = ''
        if query != '':
            connector = 'WHERE '

        data = engine.execute(sql + connector + query)
        return jsonify({'result': [dict(row) for row in data]})

        return 'filtro inválido'
    return redirect(url_for('login'))

@app.route('/api/estoque/qntd/<int:id>/<int:qntd>', methods=['POST'])
def UpdteEstoqueItemCount(id, qntd):
    if checaSession(g.user):
        sql = "update MateriaPrima set qtdedisponivel = {} where id = {}".format(qntd, id)
        resp = jsonify(success=True)
        return resp
    return redirect(url_for('login'))

@app.route('/api/edit/<table>/<int:id>', methods=['POST', 'GET'])
def GetItems(table, id):
    if checaSession(g.user):
        print('table ', table)
        print('id ', id)
        if table == "Mat_P":
            sql = 'select * from MateriaPrima where id = {}'.format(id)
            query_result = engine.execute(sql)
            for row in query_result:
                result = row
                
        elif table == "Ordem_S":
            sql = 'select os.id, os.detalhes, os.enderecoServico, os.valorPecas, os.valorServico, os.fase, os.statusPagamento, os.responsavel_id, os.responsavel_id, Usuario.nome AS responsavelNome from OrdensdeServico AS os	LEFT JOIN Usuario ON os.responsavel_id = Usuario.Id  where os.id =  {}'.format(id)
            query_result = engine.execute(sql)

            for row in query_result:
                result = row

        results = [str(row) for row in result]
        return jsonify({'results': results})
    return redirect(url_for('login'))

@app.route('/api/materiasprimas/ordemservico/<int:id>', methods=['GET'])
def GetMateriasPrimasPordemServico(id):
    if checaSession(g.user):
        sql = 'select * from MateriasOrdemDeServico where id_os = {}'.format(id)
        query_result = engine.execute(sql)

        return jsonify({'results': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

@app.route('/api/usuarios/<int:id>', methods=['GET'])
def GetColaborador(id):
    if checaSession(g.user):
        sql = 'select * from Usuario where id = {}'.format(id)
        query_result = engine.execute(sql)

        return jsonify({'results': [dict(row) for row in query_result]})
    return redirect(url_for('login'))

def AtualizarQuantidadeItemEstoque(materiaPrimaId, qntdAlterada):
        sql = 'select * from MateriaPrima where id = {}'.format(materiaPrimaId)
        query_result = engine.execute(sql)

        for row in query_result:
            result = row

        quantidadeAtual = row[6] +qntdAlterada

        sql = "update MateriaPrima set qtdedisponivel = {} where id = {}".format(quantidadeAtual, materiaPrimaId)
        query_result = engine.execute(sql)


@app.route('/add/materiasprimas/ordemservico/<int:id>', methods=['POST'])
def AddMateriasPrimasNaOrdemServico(id):
    if checaSession(g.user):
        data = request.get_json()
        sql = 'select * from MateriasOrdemDeServico where id_os = {}'.format(id)
        query_result = engine.execute(sql)

        rows = []

        for row in query_result:
            rows.append(row)

        # percorrer lista do banco comparando com lista recebida para atualizar quantidade ou remover itens se necessário

        for row in rows:
            ja_cadastrado = False
            item_permanece = False

            id_materia_prima = row[1]
            for item in data:
                print('row', row)
                print('item', item)
                if id_materia_prima == item["id_materia_prima"]:
                    item_permanece = True

                    print('item permanece', id_materia_prima, row[2], item["quantidade"])
                    if row[2] != item["quantidade"]:
                        print('update', id, id_materia_prima)
                        # atualiza a quantidade de itens de matérias primas já cadastradas
                        sql = "update MateriasOrdemDeServico set Quantidade = '{}' where id_os = {} and id_materia_prima = {}".format(item["quantidade"], id, id_materia_prima)
                        query_result = engine.execute(sql)
                        if item["estoque_alteracao"] != 0:
                            quantidade = item["estoque_alteracao"]
                            AtualizarQuantidadeItemEstoque(id_materia_prima, quantidade)
                        
            if not item_permanece :
                # remove o item
                sql = 'delete from MateriasOrdemDeServico where id_os = {} and id_materia_prima = {}'.format(id, id_materia_prima)
                engine.execute(sql)

        # percorre lista recebida comparando com lista do banco para cadastrar se necessário
        for item in data:
            novo_item = True
            for row in rows:
                if(row[1] == item["id_materia_prima"]):
                    novo_item = False

            if novo_item:
                id_os = int(item['id_os'])
                id_materia_prima = item['id_materia_prima']
                Quantidade = item['quantidade']
                valor = item['valor']
                sql = "insert into MateriasOrdemDeServico values ('{}', {}, {}, {})".format(id_os, id_materia_prima, Quantidade, valor)
                engine.execute(sql)

        return ""
    return redirect(url_for('login'))

@app.route('/api/agendamento/ordemservico/<int:id>', methods=['GET'])
def GetAgendamentosPorOrdemDeServico(id):
        sql = 'select * from Agendamentos where idOs = {}'.format(id)
        query_result = engine.execute(sql)
        return jsonify({'results': [dict(row) for row in query_result]})

@app.route('/api/agendamento/<int:id>', methods=['PUT'])
def UpdateAgendamento(id):

    data = request.get_json()
    
    sql = "update Agendamentos set StatusAgendamento = {} where id = {}".format(data["statusAgendamento"], id)
    print('sqlaaa')
    print(sql)
    query_result = engine.execute(sql)

    return jsonify({})
    

@app.route('/api/agendamento/adicionar/ordemservico/<int:id>', methods=['POST'])
def CriarAgendamento(id):

    data = request.get_json()

    # STATUS: 0 - criado; 1 - cancelado
    idOS = id
    InicioDateTime = data['inicioDateTime']
    TerminoDateTime = data['terminoDateTime']
    Status = data['status']
    sql = "insert into Agendamentos (InicioDateTime, TerminoDateTime, StatusAgendamento, idOS) values ('{}', '{}', {}, {})".format(InicioDateTime, TerminoDateTime, Status, idOS)
    engine.execute(sql)

    return jsonify({})

@app.route('/Servicos')
def Servicos():
    if checaSession(g.user):
        query_result = engine.execute('select * from Servico')

        return render_template('listagemServicos.html', query_result=query_result)
    return redirect(url_for('login'))

@app.route('/Estoque')
def Estoque():
    if checaSession(g.user):
        query_result = engine.execute('select * from MateriaPrima')

        return render_template('estoque.html', query_result=query_result)
    return redirect(url_for('login'))



@app.route('/Usuarios')
def Usuarios():
    if checaSession(g.user):
        query_result = engine.execute('select * from Usuario')

        return render_template('usuarios.html', query_result=query_result)
    return redirect(url_for('login'))

@app.route('/OrdensServico')
def OrdensServico():
    if checaSession(g.user):
        query_novas = engine.execute('select * from OrdensdeServico where fase = 1')

        query_agendadas = engine.execute('select * from OrdensdeServico where fase = 3')

        query_executadas = engine.execute('select * from OrdensdeServico where fase = 4')

        results = {
            'novas': query_novas,
            'agendadas': query_agendadas,
            'executadas': query_executadas,
        }

        return render_template('ordens.html', query_result=results)
    return redirect(url_for('login'))


@app.route('/add/<table>', methods=['POST', 'GET'])
def add(table):
    if checaSession(g.user):
        print('register', request.form)
        if request.method == 'POST':
            if table == "Mat_P":
                nm = request.form['nome']
                pb = request.form['priceBuy']
                ps = request.form['priceSell']
                dt = datetime.now()
                da = datetime.now()
                qt = request.form['quantidade']
                sql = "insert into MateriaPrima values ('{}', {}, {}, '{}','{}', {})".format(
                    nm, pb, ps, dt, da, qt)
                engine.execute(sql)
                flash('Matéria Prima cadastrada com sucesso.')
                print(request.form)
                return render_template(table+'_edit.html', method="POST", row={})
            
            elif table == "Ordem_S":
                table = "Ordem_S"
                dt = request.form['detalhes']
                vl = request.form['valorPecas']
                servicoExecutado = request.form['servicoExecutado']
                vs = request.form['valorServico']
                fs = request.form['fase']
                st = request.form['statusPagamento']
                enderecoServico = request.form['endereco']
                responsavel = request.form['responsavel_id']
                if fs == 4 or fs == '4':
                    dataexecusao = request.form['dataexe']
                    sql = "insert into OrdensdeServico values ('{}', {}, {}, {}, {}, {}, {}, '{}', '{}')".format(
                    dt, vl, vs, fs, st, responsavel, servicoExecutado, dataexecusao, enderecoServico)
                else: 
                    dataexecusao = null()
                    sql = "insert into OrdensdeServico values ('{}', {}, {}, {}, {}, {}, {}, {}, '{}')".format(
                    dt, vl, vs, fs, st, responsavel, servicoExecutado, dataexecusao, enderecoServico)
                engine.execute(sql)
                flash('Ordem de Serviço cadastrada com sucesso.')
                return redirect(reactPort)
            
            elif table == "Servico":
                nomeServico = request.form['nomeServico']
                sql = "insert into Servico values ('{}')".format(nomeServico)
                engine.execute(sql)
                flash('Serviço cadastrado com sucesso.')
                print(request.form)

            elif table == "Usuario":
                login = request.form['Login']
                senha = request.form['senha']
                nome = request.form['nome']
                adm = request.form['adm']
                status = request.form['statusColaborador']
                sql = "insert into Usuario values ('{}', '{}', '{}', '{}', {})".format(
                    login, senha, nome, adm, status)
                engine.execute(sql)
                return redirect(reactPort + 'usuarios')
            
            elif table == "":
                pass

        if table == "Mat_P":
            return render_template(table+'_edit.html', method="POST", row={})
        else:
            return render_template(table+'_add.html')
    return redirect(url_for('login'))


@app.route('/edit/<table>/<int:id>', methods=['POST', 'GET'])
def edit(table, id):
    if checaSession(g.user):
        print('edit')
        print(request.method)
        if table == "Mat_P":
            sql = 'select * from MateriaPrima where id = {}'.format(id)
            query_result = engine.execute(sql)
            for row in query_result:
                result = row
        elif table == "Ordem_S":
            sql = 'select * from OrdensdeServico where id = {}'.format(id)
            query_result = engine.execute(sql)
            for row in query_result:
                result = row
        elif table == "Servicos":
            sql = 'select * from Servico where id = {}'.format(id)
            query_result = engine.execute(sql)
            for row in query_result:
                result = row    

        if request.method == 'POST':
            if table == "Mat_P":
                nm = request.form['nome']
                pb = request.form['priceBuy']
                ps = request.form['priceSell']
                dt = request.form['date_ins']
                da = datetime.now()
                qt = request.form['quantidade']
                sql = "update MateriaPrima set nome = '{}', valor_compra = {}, valor_venda = {}, data_abastecimento = '{}', data_atualização = '{}', qtdedisponivel = {} where id = {}".format(nm, pb, ps, dt, da, qt, id)
                query_result = engine.execute(sql)
                print('query', query_result)
                flash('Item alterado com sucesso')
                return redirect(reactPort+'/Estoque')
            
            elif table == "Ordem_S":
                table = "Ordem_S"
                dt = request.form['detalhes']
                vl = request.form['valorPecas']
                vs = request.form['valorServico']
                fs = request.form['fase']
                st = request.form['statusPagamento']
                re = request.form['responsavel_id']
                enderecoServico = request.form['endereco']
                if fs == 4 or fs == '4':
                    dataexecusao = request.form['dataexe']
                    sql = "update OrdensdeServico set detalhes = '{}', valorPecas = {}, valorServico = {}, fase = {}, statusPagamento = {}, responsavel_id={}, dataexe = '{}', enderecoServico = '{}' where id = {}".format(
                    dt, vl, vs, fs, st, re, dataexecusao, enderecoServico, id)
                else:
                    dataexecusao = null()
                    sql = "update OrdensdeServico set detalhes = '{}', valorPecas = {}, valorServico = {}, fase = {}, statusPagamento = {}, responsavel_id={}, dataexe = {}, enderecoServico = '{}' where id = {}".format(
                    dt, vl, vs, fs, st, re, dataexecusao, enderecoServico, id)

                query_result = engine.execute(sql)
                return redirect(reactPort)

            elif table == "Servicos":
                if checaPermissao(g.user):                
                    nomeServico = request.form['nomeServico']
                    sql = "update Servico set Nome = '{}' where id = {}".format(nomeServico, id)
                    query_result = engine.execute(sql)
                    # flash('Seu usuário não possui permissão para executar esta ação')
                    flash('Serviço alterado com sucesso')
                    return redirect(url_for('Servicos'))
                else:
                    flash('Seu usuário não possui permissão para executar esta ação')
                    return redirect(url_for('Servicos'))

            elif table == "Usuario":
                if checaPermissao(g.user):
                    table = "Usuario"

                    payload = request.get_json()
                    nome = payload.nome
                    login = payload.login
                    senha = payload.senha
                    adm = 'N'
                    status = request.form['statusColaborador']
                    sql = "update Usuario set Login = '{}', nome = '{}', senha = '{}', adm = '{}', statusColaborador = {} where id = {}".format(
                        login, nome, senha, adm, status, id)
                    query_result = engine.execute(sql)
                    return redirect(reactPort + '/usuarios')
                    
                response = jsonify({})
                return response, 403

            elif table == "":
                pass
            # flash('Registro alterado com sucesso')
            return redirect(url_for('Estoque'))

        if(table == "Ordem_S"):
            materias_primas = engine.execute('select * from MateriasOrdemDeServico where id_os = ' + str(result.id))

            estoque = engine.execute('select * from MateriaPrima')

            print('materias', materias_primas)
            print('estoque', estoque)
            return render_template(table+'_edit.html', row=result, materiasPrimas=materias_primas, estoque=estoque)
            
        else:
            return render_template(table+'_edit.html', row=result)
    return redirect(url_for('login'))


@app.route('/delete/<table>/<int:id>', methods=['DELETE'])
def delete(table, id):
    if checaSession(g.user):
        if request.method == 'DELETE':
            if checaPermissao(g.user):
                if table == "Mat_P":
                    sql = 'delete from materiaPrima where id = {}'.format(id)
                    engine.execute(sql)
                return 'sem permissão'
            elif table == "Ordem_S":
                try:
                    sql = 'delete from OrdensdeServico where id = {}'.format(id)
                    engine.execute(sql)
                except:
                    sql3 = 'delete from agendamentos where idOs = {}'.format(id)
                    sql2 = 'delete from materiasordemdeservico where id_os = {}'.format(id)
                    engine.execute(sql3)
                    engine.execute(sql2)
                    engine.execute(sql)

            elif table == "Servicos":
                if checaPermissao(g.user):
                    sql = 'delete from Servico where id = {}'.format(id)
                    engine.execute(sql)
                return 'sem permissão'

            elif table == "Usuario":
                if checaPermissao(g.user):
                    sql = 'delete from Usuario where id = {}'.format(id)
                    engine.execute(sql)
                return 'sem permissão'
            # return 'deleted'

            elif table == "ordensdeservico":
                print('chegou aqui')
                sql = 'delete from OrdensdeServico where id = {}'.format(id)
                engine.execute(sql)
                return 'sem permissão'
            return 'deleted'

    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True)
