"use strict";

import "./../style/visual.less";
import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import Metas from "./models/meta";

export class Visual implements IVisual {
    private target: HTMLElement;
    private dataView: DataView;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        // Limpa o conteúdo anterior
        this.target.innerHTML = "";
        this.dataView = options.dataViews[0];

        const metas = Metas.montarMetas(this.dataView);

        // Cria container flexível para os gauges
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexWrap = "wrap";
        container.style.maxHeight = "600px";           // ajuste conforme necessário
        container.style.overflowY = "auto";            // ativa barra de rolagem vertical
        container.style.alignItems = "flex-start";     // evita esticar os gauges verticalmente
        this.target.appendChild(container);

        // Renderiza cada gauge
        metas.forEach((meta, i) => {
            const gaugeDiv = document.createElement("div");
            gaugeDiv.id = `gauge-${i}`;
            gaugeDiv.style.margin = "12px";
            gaugeDiv.style.height = "170px";
            gaugeDiv.style.alignContent = 'end';
            container.appendChild(gaugeDiv);

            gaugeDiv.onclick = () => renderDetalhes(meta);

            drawGauge(`#gauge-${i}`, meta);
        });
    }
}

// Função para desenhar o gauge semicircular
function drawGauge(selector: string, meta: Metas, min = 0, max = 5) {

    d3.select(selector).html("");

    const width = 250, height = 80;

    const maxCharsPorLinha = 22;
    const lines = splitText(meta.titulo, maxCharsPorLinha);

    const titulo = document.createElement('div');
    titulo.style.backgroundColor = '#007A00';
    titulo.style.textAlign = 'center';
    titulo.style.border = '1px solid';
    titulo.style.borderColor = '#007A00';
    titulo.style.borderRadius = '10px';
    titulo.style.margin = '0px 15px';

    lines.forEach((line, i) => {
        const texto = document.createElement('h5');
        texto.style.margin = '0px';
        texto.style.color = '#fff';
        texto.innerText += line;
        titulo.appendChild(texto);
    })

    document.getElementById(selector.slice(1)).appendChild(titulo);

    const setor = document.createElement('div');
    setor.innerText = meta.setor;
    setor.style.alignItems = "center";
    setor.style.textAlign = 'center';

    document.getElementById(selector.slice(1)).appendChild(setor);

    // Escala para o valor da nota
    const scale = d3.scaleLinear()
        .domain([min, max])
        .range([-Math.PI, Math.PI]);

    // Limpa conteúdo anterior, se houver

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const arcGenerator = d3.arc()
        .innerRadius(50)
        .outerRadius(60);

    // Gauge background (arco completo)
    svg.append("path")
        .attr("d", arcGenerator({
            startAngle: -Math.PI,
            endAngle: Math.PI,
            innerRadius: 50,
            outerRadius: 60
        })!)
        .attr("fill", "#e6e6e6")
        .attr("transform", `translate(${width / 2},${height})`);

    // Gauge value (arco parcial)
    svg.append("path")
        .attr("d", arcGenerator({
            startAngle: -Math.PI,
            endAngle: scale(meta.nota),
            innerRadius: 50,
            outerRadius: 60
        })!)
        .attr("fill", "#007A00")
        .attr("transform", `translate(${width / 2},${height})`);

    // Valor numérico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .attr("font-size", "25px")
        .attr("fill", "#333")
        .text(meta.nota.toFixed(2));

    // Min label
    svg.append("text")
        .attr("x", 10)
        .attr("y", height - 1)
        .attr("font-size", "20px")
        .attr("fill", "#333")
        .text(min.toFixed(2));

    // Max label
    svg.append("text")
        .attr("x", width - 10)
        .attr("y", height - 1)
        .attr("text-anchor", "end")
        .attr("font-size", "20px")
        .attr("fill", "#333")
        .text(max.toFixed(2));
}

function splitText(text: string, maxChars: number) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach(word => {
        // Se adicionar a próxima palavra ultrapassar o limite, cria nova linha
        if ((currentLine + (currentLine ? " " : "") + word).length > maxChars) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine += (currentLine ? " " : "") + word;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
}

function renderDetalhes(meta: Metas) {
    let detalheDiv = document.createElement('div');
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

    const nomeMeta = document.createElement('div');
    nomeMeta.style.fontSize = '30px';
    nomeMeta.style.fontWeight = 'bold';
    nomeMeta.style.color = '#00823d';
    nomeMeta.innerText = meta.titulo;

    TituloCard.appendChild(nomeMeta);
    detalheDiv.appendChild(TituloCard);

    const detalhesHead = document.createElement('div');
    detalhesHead.style.background = '#00823d';
    detalhesHead.style.color = '#fff';
    detalhesHead.style.fontWeight = 'bold';
    detalhesHead.style.fontSize = '17px';
    detalhesHead.style.border = '1px solid #ddd';
    detalhesHead.style.padding = '7px 6px';
    detalhesHead.style.textAlign = 'left';
    detalhesHead.innerText = 'Descrição';

    detalheDiv.appendChild(detalhesHead);

    const detalhesContent = document.createElement('p');
    detalhesContent.innerText = meta.detalhes;
    detalhesContent.style.paddingLeft = '5px';
    

    detalheDiv.appendChild(detalhesContent);

    renderTabelaProjetistas(detalheDiv, meta.projetistas)



}

function renderTabelaProjetistas(conteiner: HTMLElement, projetistas: string[]) {
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
        'Projetistas'
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
    projetistas.forEach(projetista => {
        const tr = document.createElement('tr');
        [
            projetista
        ].forEach((valor, idx) => {
            const td = document.createElement('td');
            td.innerText = valor.toString();
            td.style.border = '1px solid #ddd';
            td.style.padding = '6px 5px';
            td.style.fontSize = '16px';
            if (idx === 5) td.style.textAlign = 'right'; // Nota GD à direita
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tabela.appendChild(table);

    conteiner.appendChild(tabela);
}