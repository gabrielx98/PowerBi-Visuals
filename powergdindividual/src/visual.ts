"use strict";

import "./../style/visual.less";
import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import Projetista from "./models/projetista";

export class Visual implements IVisual {
    private target: HTMLElement;
    private dataView: DataView;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.target.innerHTML = "";
        this.dataView = options.dataViews[0];

        const projetistas = Projetista.MontarLista(this.dataView);

        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexWrap = "wrap";
        container.style.maxHeight = "600px";           // ajuste conforme necessário
        container.style.overflowY = "auto";            // ativa barra de rolagem vertical
        container.style.alignItems = "flex-start";     // evita esticar os gauges verticalmente
        this.target.appendChild(container);

        renderProjetistas(container, projetistas);

    }

}

function renderProjetistas(container: HTMLElement, projetistas: Projetista[]) {
    console.log(container)
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '24px';


    projetistas.forEach((proj, idx) => {
        const card = document.createElement('div');
        card.className = 'projetista-card';
        card.style.width = '180px';
        card.style.minHeight = '150px';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 2px 8px #eee';
        card.style.padding = '8px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.onclick = () => renderDetalhesProjetista(proj);

        // Nome
        const nomeDiv = document.createElement('div');
        nomeDiv.innerText = proj.Nome;
        nomeDiv.style.background = '#00823d';
        nomeDiv.style.color = '#fff';
        nomeDiv.style.fontWeight = 'bold';
        nomeDiv.style.padding = '4px 0';
        nomeDiv.style.width = '100%';
        nomeDiv.style.minHeight = '50px'
        nomeDiv.style.textAlign = 'center';
        nomeDiv.style.alignContent = 'center';
        nomeDiv.style.borderRadius = '6px';
        nomeDiv.style.margin = '8px 0';

        // Gauge
        const gaugeDiv = document.createElement('div');
        gaugeDiv.style.width = '140px';
        gaugeDiv.style.height = '70px';
        gaugeDiv.style.margin = '0 auto';
        drawGauge(gaugeDiv, proj.NotaGD);

        card.appendChild(nomeDiv);
        card.appendChild(gaugeDiv);

        container.appendChild(card);
    });
}

function renderDetalhesProjetista(proj: Projetista) {
    let detalheDiv = document.getElementById('painel-detalhes');
    if (!detalheDiv) {
        detalheDiv = document.createElement('div');
        detalheDiv.id = 'painel-detalhes';
        detalheDiv.style.position = 'fixed';
        detalheDiv.style.top = '32px';
        detalheDiv.style.left = '32px';
        detalheDiv.style.right = '32px';
        detalheDiv.style.bottom = '32px';
        detalheDiv.style.background = '#fff';
        detalheDiv.style.zIndex = '9999';
        detalheDiv.style.boxShadow = '0 4px 32px #aaa';
        detalheDiv.style.borderRadius = '12px';
        detalheDiv.style.overflow = 'auto';
        document.body.appendChild(detalheDiv);
    }
    // Limpa conteúdo anterior
    detalheDiv.innerHTML = '';

    // Botão fechar
    const btnFechar = document.createElement('button');
    btnFechar.innerText = 'Fechar';
    btnFechar.style.position = 'absolute';
    btnFechar.style.top = '16px';
    btnFechar.style.right = '16px';
    btnFechar.onclick = () => detalheDiv.remove();
    detalheDiv.appendChild(btnFechar);

    const TituloCard = document.createElement('div');
    TituloCard.style.display = 'flex';
    TituloCard.style.alignItems = 'center';
    TituloCard.style.gap = '24px';
    TituloCard.style.margin = '32px 0 24px 32px';

    const nomeProjetista = document.createElement('div');
    nomeProjetista.style.fontSize = '40px';
    nomeProjetista.style.fontWeight = 'bold';
    nomeProjetista.style.color = '#00823d';
    nomeProjetista.innerText = proj.Nome;
    
    TituloCard.appendChild(nomeProjetista);
    detalheDiv.appendChild(TituloCard);

    renderCards(detalheDiv, proj);
    renderTabelaTarefas(detalheDiv,proj);
    

}

function drawGauge(container: HTMLElement, nota: number, min = 0, max = 5) {
    const width = 120, height = 60;

    // Limpa o conteúdo anterior
    container.innerHTML = '';

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + 20)
        .attr("height", height);

    // Escala de ângulo
    const scale = d3.scaleLinear()
        .domain([min, max])
        .range([-Math.PI, Math.PI]);

    // Arco de fundo
    const arcBg = d3.arc()
        .innerRadius(40)
        .outerRadius(50);

    svg.append("path")
        .attr("d", arcBg({
            startAngle: -Math.PI,
            endAngle: Math.PI,
            innerRadius: 40,
            outerRadius: 50
        })!)
        .attr("fill", "#e6e6e6")
        .attr("transform", `translate(${width / 1.8},${height})`);

    // Arco valor
    svg.append("path")
        .attr("d", arcBg({
            startAngle: -Math.PI,
            endAngle: scale(nota),
            innerRadius: 22,
            outerRadius: 28
        })!)
        .attr("fill", "#00823d")
        .attr("transform", `translate(${width / 1.8},${height})`);

    // Nota numérica
    svg.append("text")
        .attr("x", width / 1.8)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("fill", "#00823d")
        .text(nota.toFixed(2));

    // Min label
    svg.append("text")
        .attr("x", -1)
        .attr("y", height - 1)
        .attr("font-size", "11px")
        .attr("fill", "#00823d")
        .text(min.toFixed(1));

    // Max label
    svg.append("text")
        .attr("x", width + 12)
        .attr("y", height - 1)
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("fill", "#00823d")
        .text(max.toFixed(1));
}

function renderCards(container: HTMLElement, projetista: Projetista) {
    let cards = document.createElement('div');
    cards.style.display = 'flex';
    cards.style.margin = '0 0';

    function renderCard(Titulo: string, Valor: number){

        const cardDiv = document.createElement('div');
        cardDiv.style.width = '200px';
        cardDiv.style.height = '80px';
        cardDiv.style.background = '#fff';
        cardDiv.style.border = '1px solid #e0e0e0';
        cardDiv.style.borderLeft = '4px solid #00823d';
        cardDiv.style.borderRadius = '3px';
        cardDiv.style.display = 'flex';
        cardDiv.style.flexDirection = 'column';
        cardDiv.style.justifyContent = 'center';
        cardDiv.style.alignItems = 'center';
        cardDiv.style.margin = '5px'
        
        const titulo = document.createElement('div');
        titulo.style.fontSize = '20px';
        titulo.style.color = '#444';
        titulo.style.marginBottom = '2px';
        titulo.innerText = Titulo;
        
        const valor = document.createElement('div');
        valor.style.fontSize = '28px';
        valor.style.fontWeight = 'bold';
        valor.style.color = '#232323';
        
        valor.innerText = Titulo == 'Nota GD'? Valor.toFixed(2) : Valor.toString();
        
        cardDiv.appendChild(titulo);
        cardDiv.appendChild(valor);
        cards.appendChild(cardDiv);
        
    }

    renderCard('Nota GD', projetista.NotaGD);
    renderCard('Não Iniciadas',projetista.Indicadores.NaoIniciadas);
    renderCard('Em Andamento', projetista.Indicadores.EmAndamento);
    renderCard('Finalzadas',projetista.Indicadores.Finalizadas);
    renderCard('Total', projetista.Indicadores.NaoIniciadas + projetista.Indicadores.EmAndamento + projetista.Indicadores.Finalizadas)

    container.appendChild(cards);

}

function renderTabelaTarefas(conteiner: HTMLElement, projetista: Projetista){
    let tabela = document.createElement('div');
    tabela.style.margin = '30px 2px 0px 2px';

    
    // Tabela
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '0px';
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        'Titulo da tarefa',
        'Setor',
        'Progresso',
        'Prioridade',
        'Nota'
    ];
    headers.forEach(h => {
        const th = document.createElement('th');
        th.innerText = h;
        th.style.background = '#00823d';
        th.style.color = '#fff';
        th.style.fontWeight = 'bold';
        th.style.fontSize = '17px';
        th.style.border = '1px solid #ddd';
        th.style.padding = '7px 6px';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Corpo da tabela
    const tbody = document.createElement('tbody');
    projetista.Metas.forEach(tarefa => {
        const tr = document.createElement('tr');
        [
            tarefa.Titulo,
            tarefa.Setor,
            tarefa.Progresso,
            tarefa.Prioridade,
            tarefa.Nota
        ].forEach((valor, idx) => {
            const td = document.createElement('td');
            td.innerText = valor.toString();
            td.style.border = '1px solid #ddd';
            td.style.padding = '6px 5px';
            td.style.fontSize = '16px';
            td.onclick = () =>{
                detalhesTituloTarefa.innerText = tarefa.Titulo
                detalhesTexto.innerText = tarefa.Detalhes
            }
            td
            if (idx === 5) td.style.textAlign = 'right'; // Nota GD à direita
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    // Linha de total
    const tfoot = document.createElement('tfoot');
    const totalRow = document.createElement('tr');
    // Células vazias
    for (let i = 0; i < headers.length - 2; i++) {
        const td = document.createElement('td');
        td.innerText = '';
        td.style.background = '#00823d';
        totalRow.appendChild(td);
    }
    
    // Célula "Total"
    const tdTotal = document.createElement('td');
    tdTotal.innerText = 'Total';
    tdTotal.style.background = '#00823d';
    tdTotal.style.color = '#fff';
    tdTotal.style.fontWeight = 'bold';
    tdTotal.style.fontSize = '16px';
    tdTotal.style.textAlign = 'left';
    totalRow.appendChild(tdTotal);
    
    let total = projetista.Metas.reduce((soma,meta) => soma + meta.Nota,0) / projetista.Metas.length;
    // Celula do valor
    const tdNotaTotal = document.createElement('td');
    tdNotaTotal.innerText = total.toFixed(2);
    tdNotaTotal.style.background = '#00823d';
    tdNotaTotal.style.color = '#fff';
    tdNotaTotal.style.fontWeight = 'bold';
    tdNotaTotal.style.fontSize = '16px';
    tdNotaTotal.style.textAlign = 'right';
    
    totalRow.appendChild(tdNotaTotal);
    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);
    tabela.appendChild(table);

    conteiner.appendChild(tabela);

    const detalhes = document.createElement('div');
    //detalhes.style.height = '200px';
    detalhes.style.background = '#ffffffff';
    detalhes.style.margin = '0px';
    tabela.appendChild(detalhes)

    const detalhesTitulo = document.createElement('h1');
        detalhesTitulo.innerText = "Descrição da Meta - Selecione na tabela: ";
        detalhesTitulo.style.background = '#00823d';
        detalhesTitulo.style.color = '#fff';
        detalhesTitulo.style.fontWeight = 'bold';
        detalhesTitulo.style.fontSize = '17px';
        detalhesTitulo.style.border = '1px solid #ddd';
        detalhesTitulo.style.padding = '7px 6px';
        detalhesTitulo.style.textAlign = 'left';
        detalhesTitulo.style.marginBottom = "0px"
        detalhes.appendChild(detalhesTitulo);

    const detalhesTituloTarefa = document.createElement('h1');
        detalhesTituloTarefa.style.background = '#00823d';
        detalhesTituloTarefa.style.color = '#fff';
        detalhesTituloTarefa.style.fontWeight = 'bold';
        detalhesTituloTarefa.style.fontSize = '17px';
        detalhesTituloTarefa.style.border = '1px solid #ddd';
        detalhesTituloTarefa.style.padding = '7px 6px';
        detalhesTituloTarefa.style.textAlign = 'left';
        detalhesTituloTarefa.style.marginTop = "0px"
        detalhes.appendChild(detalhesTituloTarefa);
    
    const detalhesTexto = document.createElement("h5");
    detalhes.appendChild(detalhesTexto);
    
}
