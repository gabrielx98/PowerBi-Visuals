import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;

import "./../style/visual.less";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";

import Sonda from "./models/sonda";
import Projeto from "./models/projeto";
import Servico from "./models/servico";
import { formatToReal, formatarTimestamp } from "./utilities/format";
import columnMapping from "./utilities/columnMapping";

export class Visual implements IVisual {
    private target: HTMLElement;
    private dataView: DataView;
    private width: number;
    private height: number;
    private anoAtual: number;
    private zoom: number;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.zoom = 1;
        
    }

    public update(options: VisualUpdateOptions) {
        this.width = options.viewport.width;
        this.height = options.viewport.height;
        this.dataView = options.dataViews[0];

        this.render()
    }

    private render() {
        const dataView = this.dataView;
        const sondas = Sonda.montarSondas(dataView);
        const servicos = Servico.montarServicos(dataView);
        const mapping = columnMapping(dataView);
        this.anoAtual = Number(dataView.table.rows[0][mapping["Ano"]]);

        d3.select(this.target).selectAll("*").remove();

        // Set up dimension
        const margin = { top: 50, right: 30, bottom: 0, left: 200 };
        const width = this.width - margin.left - margin.right;
        let height = (this.height - margin.top - margin.bottom) * (sondas.length / 5);

        // Create a container for the SVG with overflow
        const container = d3.select(this.target)
            .append("div")
            .style("width", `${this.width + 500}px`)
            .style("height", `${this.height}px`)
            .style("overflow-y", "scroll")
            .style("overflow-x", "hidden");

        const containerLegenda = container.append("div")
            .style("position", "relative")
            .style("top", "1px")
            .style("right","450px")
            .style("width","100%")
            .style("height","50px");

        containerLegenda.append("button")
            .text("Informações Gerais")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "-450px")
            .style("margin-right", "5px")
            .style("padding", "5px")
            .on("click", () => {
                modalDetalhes.style("display", "block");
                modalDetalhesContent.html(`
                    <h3>Informações Gerais</h3>
                    <h4>${sondas.length} Sondas</h4>
                    <h4>${servicos.length} Intervenções</h4>
                    
                    
                `)
            });

        containerLegenda.append("rect")
            .style("background-color", "#008000")
            .style("width","40px")
            .style("height","25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "460px")
        
        containerLegenda.append("div")
            .text("Avaliação e Motivação Completa")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "510px")
            .style("width","300px")
            .style("height","25px")

         containerLegenda.append("rect")
            .style("background-color", "#d3d3d3")
            .style("width","40px")
            .style("height","25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "750px")
        
        containerLegenda.append("div")
            .text("Não Avaliado")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "800px")
            .style("width","180px")
            .style("height","25px")

        containerLegenda.append("rect")
            .style("background-color", "#ff5d27ff")
            .style("width","40px")
            .style("height","25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "810px")
        
        containerLegenda.append("div")
            .text("Reavaliação Iniciada")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "620px")
            .style("width","180px")
            .style("height","25px")

        containerLegenda.append("rect")
            .style("background-color", "#0e1fa3ff")
            .style("width","40px")
            .style("height","25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "610px")
        
        containerLegenda.append("div")
            .text("Motivação X Esforço")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "420px")
            .style("width","180px")
            .style("height","25px")
        
        containerLegenda.append("div")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "410px")
            .style("width", "25px")
            .style("height", "25px")
            .style("background-color", "#fb1403ff")
            .style("border-radius", "50%");

        containerLegenda.append("div")
            .text("Reavaliação aplicada")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "220px")
            .style("width","180px")
            .style("height","25px")

        // Create SVG container
        const svg = container
            .append("svg")
            .attr("width", (width + margin.left + margin.right) * this.zoom)
            .attr("height", (height + margin.top + margin.bottom) * this.zoom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleTime()
            .domain([new Date(this.anoAtual, 0, 1), new Date(this.anoAtual, 11, 31)])
            .range([0, width * this.zoom]);

        const yScale = d3.scaleBand()
            .domain(sondas.map(s => s.codigoSonda))
            .range([0, height * this.zoom])
            .padding(0.05);

        // Create axes
        const yAxis = d3.axisLeft(yScale);

        const xAxis = d3.axisTop(xScale)
            .ticks(d3.timeMonth.every(1)) // Define ticks mensais
            .tickFormat(d3.timeFormat("%b")) // Formata os ticks com o nome completo dos meses ("January", "February", etc.)
            .tickSize(0); // Remove as linhas padrão dos ticks

        // Adicionar o eixo ao SVG
        const axisGroup = svg.append("g")
            .attr("transform", "translate(40, -30)") // Posiciona o eixo verticalmente
            .call(xAxis);

        // Adicionar o quadrado antes do primeiro tick
        svg.append("rect")
            .attr("x", -200) // Coloca o quadrado antes do início do domínio (ajustado manualmente)
            .attr("y", -54) // Posiciona o quadrado verticalmente (alinhado com os ticks)
            .attr("width", 200) // Largura do quadrado
            .attr("height", 50) // Altura do quadrado
            .attr("fill", "gray") // Cor do quadrado

        svg.append("text")
            .attr("x", -100) // Centraliza o texto no quadrado
            .attr("y", -17) // Ajusta verticalmente o texto
            .attr("fill", "white") // Define a cor do texto como branco
            .style("text-anchor", "middle") // Centraliza o texto
            .style("font-size", "30px") // Tamanho do texto
            .text("Cronograma"); // Texto exibido no quadrado

        let zooomlevel = this.zoom;
        // Customizar os ticks para exibir quadrados cinzas com o nome do mês em branco
        axisGroup.selectAll(".tick")
            .each(function (d) {
                const tick = d3.select(this); // Seleciona cada tick individualmente

                // Adiciona um quadrado cinza para cada tick
                tick.insert("rect", "text") // Insere o retângulo antes do texto
                    .attr("x", -40) // Ajusta horizontalmente (centraliza o quadrado no tick)
                    .attr("y", -24) // Ajusta verticalmente
                    .attr("width", 120 * zooomlevel) // Largura do quadrado
                    .attr("height", 50) // Altura do quadrado
                    .attr("fill", "gray") // Cor do quadrado

                // Personalizar o texto
                tick.select("text")
                    .attr("fill", "white") // Cor do texto
                    .attr("dy", 13) // Ajuste vertical do texto dentro do quadrado
                    .style("font-size", "20px") // Tamanho do texto
                    .style("text-anchor", "middle") // Alinha o texto no centro do quadrado
                    .style("font-family", "Arial"); // Define uma fonte específica
            });

        // Add project names with background rectangle
        const sondaNames = svg.selectAll(".sonda-name")
            .data(sondas.map(s => s.codigoSonda))
            .enter()
            .append("g")
            .attr("class", "sonda-name")
            .attr("id", data => `sonda-name-${data}`)
            .attr("transform", d => `translate(-${margin.left}, ${yScale(d)})`);

        sondaNames.append("rect")
            .attr("width", margin.left)
            .attr("height", yScale.bandwidth())
            .attr("fill", "#006398");

        sondaNames.append("text")
            .attr("x", 10)
            .attr("y", yScale.bandwidth() / 3)
            .attr("dy", "0em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")

            .each(function (d) {
                const textElement = d3.select(this); // Seleciona o elemento <text> atual

                // Primeira linha: Código da sonda
                textElement.append("tspan")
                    .attr("x", 100) // Mesmo X para alinhar
                    .attr("dy", "0.2em") // Primeira linha
                    .text(d)
                    .style("font-size", `${yScale.bandwidth() / 5}px`);

                // Segunda linha: Nome da sonda
                textElement.append("tspan")
                    .attr("x", 100) // Mesmo X para alinhar
                    .attr("dy", "1.2em") // Offset para a segunda linha
                    .text(sondas.filter(s => s.codigoSonda === d).map(s => s.nomeSonda)[0])
                    .style("font-size", `${yScale.bandwidth() / 6}px`);

                // Terceira linha: Nome da sonda
                textElement.append("tspan")
                    .attr("x", 100) // Mesmo X para alinhar
                    .attr("dy", "1.2em") // Offset para a segunda linha
                    .text(sondas.filter(s => s.codigoSonda === d).map(s => s.capacidade)[0])
                    .style("font-size", `${yScale.bandwidth() / 5}px`);

            })
            .style("font-size", `${yScale.bandwidth() / 5}px`) // Define o tamanho do texto como 20px
            .style("font-weight", "bold"); // Define o texto como negrito

        // Criar o modal para detalhamento
        const modalDetalhes = d3.select(this.target)
            .append("div")
            .attr("class", "modal")
            .style("display", "none")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "50px")
            .style("width", "400px")
            .style("background-color", "white")
            .style("border", "1px solid black")
            .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.2)")
            .style("padding", "20px")
            .style("z-index", "1000");

        const modalSecundario = d3.select(this.target)
            .append("div")
            .attr("class", "modal")
            .style("display", "none")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "500px")
            .style("width", "400px")
            .style("height","500px")
            .style("background-color", "white")
            .style("border", "1px solid black")
            .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.2)")
            .style("padding", "20px")
            .style("z-index", "1000")
            .style("overflow-y", "scroll")
            .style("overflow-x", "hidden");

        modalDetalhes.append("button")
            .text("Fechar")
            .style("float", "right")
            .style("cursor", "pointer")
            .on("click", () => {
                modalDetalhes.style("display", "none")
                modalSecundario.style("display", "none")

            });

        modalSecundario.append("button")
            .text("Fechar")
            .style("float", "right")
            .style("cursor", "pointer")
            .on("click", () => modalSecundario.style("display", "none"));

        const modalDetalhesContent = modalDetalhes.append("div");
        const modalSecundarioContent = modalSecundario.append("div");

        // Adicionar os serviços ao cronograma
        svg.selectAll(".servico")
            .data(servicos)
            .enter()
            .append("g")
            .attr("class", "servico")
            .each(function (d) {
                const grupoServico = d3.select(this);

                // Obter o ano atual
                const anoAtual = Number(dataView.table.rows[0][mapping["Ano"]]);;
                const inicioAno = new Date(anoAtual, 0, 1); // 1º de janeiro do ano atual
                const fimAno = new Date(anoAtual, 11, 31); // 31 de dezembro do ano atual

                // Ajustar as datas de início e término para o intervalo do ano atual
                const dataInicio = new Date(d.dtInicio) < inicioAno ? inicioAno : new Date(d.dtInicio);
                const dataFim = new Date(d.dtTermino) > fimAno ? fimAno : new Date(d.dtTermino);

                // Calcular a posição horizontal com base nas datas exatas
                const xInicio = xScale(dataInicio); // Posição inicial na escala
                const xFim = xScale(dataFim); // Posição final na escala

                // Calcular a posição vertical com base na sonda
                const yPos = yScale(d.sonda.codigoSonda);

                // Adicionar gradientes no <defs>
                const defs = svg.append("defs");
                // Gradiente 1
                defs.append("linearGradient")
                    .attr("id", `gradiente${d.dtInicio}${d.dtTermino}`)
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "0%")
                    .selectAll("stop")
                    .data([
                        { offset: "0%", color: Servico.atribuirCor(d,1) },
                        { offset: "100%", color: Servico.atribuirCor(d,2) }
                    ])
                    .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);

                // Adicionar o retângulo que representa o serviço
                let retangulo = grupoServico.append("rect")
                    .attr("x", xInicio) // Posição inicial do retângulo
                    .attr("y", yPos + 12) // Posição da linha correspondente à sonda
                    .attr("width", Math.max(1, (xFim - xInicio))) // Largura com base na duração do serviço (mínimo de 1px)
                    .attr("height", yScale.bandwidth() * 0.8) // Altura proporcional ao espaço da sonda
                    .attr("fill", `url(#gradiente${d.dtInicio}${d.dtTermino})`)
                    .attr("stroke", "black") // Contorno do retângulo
                    .attr("stroke-width", 1);
                
                if(d.reavaliacao.projetistaPROJ.avaliacaoUtilizada || d.reavaliacao.projetistaPEP.avaliacaoUtilizada){
                    grupoServico.append("circle")
                    .attr("cx", xInicio + (Math.max(1, (xFim - xInicio))) - 13)     
                    .attr("cy", yPos + 12 + 13)           
                    .attr("r", 5)
                    .attr("fill", Servico.atribuirCorCirculo(d))
                    .attr("stroke", "white")                  
                    .attr("stroke-width", 1.5);
                }
                
                // Adicionar o texto no retângulo com 4 linhas
                grupoServico.append("text")
                    .attr("x", (xInicio + xFim) / 2) // Centralizar horizontalmente o texto
                    .attr("y", yPos + yScale.bandwidth() / 2.5) // Ajustar a posição inicial vertical
                    .attr("text-anchor", "middle") // Alinhar texto ao centro
                    .style("font-size", `${yScale.bandwidth() / 8}px`) // Tamanho do texto
                    .style("fill", "black") // Cor do texto
                    .each(function () {
                        const textElement = d3.select(this);

                        // Linha 1: Nome do Projeto
                        textElement.append("tspan")
                            .attr("x", (xInicio + xFim) / 2) // Centralizar horizontalmente
                            .attr("dy", "0em") // Primeira linha sem deslocamento
                            .text(
                                (Math.max(1, xFim - xInicio) > 30) ? 
                                    (Math.max(1, xFim - xInicio) > 80) ? 
                                        (d.projeto.projeto.length < 8) ? 
                                            d.projeto.projeto 
                                            : d.projeto.projeto.substring(0, 8)
                                    : d.projeto.projeto.substring(0, 3) 
                                : "")
                            .style("font-weight", "bold");

                        // Linha 2: Nome do Poço
                        textElement.append("tspan")
                            .attr("x", (xInicio + xFim) / 2) // Centralizar horizontalmente
                            .attr("dy", "1.2em") // Segunda linha com deslocamento
                            .text((Math.max(1, xFim - xInicio) > 30) ? (Math.max(1, xFim - xInicio) > 120)
                                ? d.projeto.locacao
                                : d.projeto.locacao.substring(0, 3) : "")
                            .style("font-weight", "bold");

                        // Linha 3: Tipo do Serviço
                        textElement.append("tspan")
                            .attr("x", (xInicio + xFim) / 2) // Centralizar horizontalmente
                            .attr("dy", "1.2em") // Terceira linha com deslocamento
                            .text(
                                (Math.max(1, xFim - xInicio) > 30) ? 
                                    (Math.max(1, xFim - xInicio) > 100) ? 
                                        (d.tipoServico == "Abandono Definitivo") ? 
                                        "Abandono" 
                                        : d.tipoServico
                                    : d.tipoServico.substring(0, 3) 
                                : "");

                        // Linha 4: Nome do Poço
                        textElement.append("tspan")
                            .attr("x", (xInicio + xFim) / 2) // Centralizar horizontalmente
                            .attr("dy", "1.2em") // Quarta linha com deslocamento
                            .text((Math.max(1, xFim - xInicio) > 30) ? (Math.max(1, xFim - xInicio) > 150)
                                ? d.sonda.capacidadeAtual + " - " + d.duracao + " Dias"
                                : d.duracao + " D" : "");
                    });
            })
            .on("click", (event, d) => {

                // Exibir o modal com os detalhes do serviço
                modalDetalhes.style("display", "block");
                modalSecundario.style("display", "none")
                modalDetalhesContent.html(`
                    <h2>Detalhes da Intervenção</h2>
                    <p> <strong>Sonda:</strong> ${d.sonda.codigoSonda}</p>
                    <p> <strong>Projeto:</strong> ${d.projeto.projeto}<p/>
                    <p> <strong>Locação:</strong> ${d.projeto.locacao}</p>
                    <p> <strong>Poço:</strong> ${d.poco ? d.poco : ""}</p>
                    <p> <strong>Tipo de Serviço:</strong> ${d.tipoServico ? d.tipoServico : ""}</p>
                     ${d.descricao ? `<p> <strong>Observação:</strong> ${d.descricao}</p>` : ""}
                    <p> <strong>Início em:</strong> ${formatarTimestamp(d.dtInicio)}</p>
                    <p> <strong>Término em:</strong> ${formatarTimestamp(d.dtTermino)}</p>
                    <p> <strong>Valor Estimado em estoque:</strong> ${d.reavaliacao.valorEstoque ? formatToReal(d.reavaliacao.valorEstoque) : "Não Estimado"}</p>
                    
                    
                    
                `);

                modalDetalhesContent.append("button")
                    .text("Reavaliação de Projeto")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        modalSecundario.style("display", "block")

                        modalSecundarioContent.html(`<h3>Reavaliação do Projeto</h3>
                    <h4>
                        O projeto foi reavaliado pelo PROJ com foco em otimização de estoque?
                    </h4>
                    <label>${d.reavaliacao.projetistaPROJ.observacao ? `<STRONG> Projetista: ${d.reavaliacao.projetistaPROJ.nome.split(" -")[0]} <br> Observação: </STRONG>  ${d.reavaliacao.projetistaPROJ.observacao}` : "Projeto não reavaliado pelo PROJ."}</label>
                    <h4>${d.reavaliacao.projetistaPROJ.avaliacaoUtilizada ? "Observação do PROJ aplicada!": ""}</h4>
                    <h4>
                         O projeto foi reavaliado pelo PEP com foco em otimização de estoque?
                    </h4>
                    <label>${d.reavaliacao.projetistaPEP.observacao ? `<STRONG> Projetista: ${d.reavaliacao.projetistaPEP.nome.split(" -")[0]} <br> Observação:</STRONG> ${d.reavaliacao.projetistaPEP.observacao}` : " Projeto não reavaliado pelo PEP."}</label>
                    <h4>${d.reavaliacao.projetistaPEP.avaliacaoUtilizada ? "Observação do PEP aplicada!": ""}</h4>
                    `);
                    });

                modalDetalhesContent.append("div");

                modalDetalhesContent.append("button")
                    .text("Motivação X Esforço")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        modalSecundario.style("display", "block")

                        modalSecundarioContent.html(`
                            
                            <h3> Registro de Motivação X Esforço </h3>
                            <h4> Qual a proposta do que será realizado no poço? </h4>
                            ${d.motivacaoEsforco.proposta ? d.motivacaoEsforco.proposta : ""}
                            <h4> Quais obstáculos encontrados? </h4>
                            ${d.motivacaoEsforco.obstaculos ? d.motivacaoEsforco.obstaculos : ""}
                            <h4> Quais são as lições aprendidas? </h4>
                            ${d.motivacaoEsforco.licoes ? d.motivacaoEsforco.licoes : ""}
                            <h4> Qual o resultado esperado? </h4>
                            ${d.motivacaoEsforco.resultadoEsperado ? d.motivacaoEsforco.resultadoEsperado : ""}
                            <h4> Qual o resultado obtido? </h4>
                            ${d.motivacaoEsforco.resultadoObtido ? d.motivacaoEsforco.resultadoObtido : ""}

                            
                        `);
                    });
            });







        /* const buttonEstoqueGeral = container.append("div")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "20px");

        buttonEstoqueGeral.append("button")
            .text("Informações Gerais")
            .style("margin-right", "5px")
            .style("padding", "5px")
            .on("click", () => {
                modalDetalhes.style("display", "block");
                modalDetalhesContent.html(`
                    <h3>Informações Gerais</h3>
                    <h4>${sondas.length} Sondas</h4>
                    <h4>${servicos.length} Intervenções</h4>
                    
                    
                `)
            }); */
        /*<h4>Bens aplicados em poços realizados (operações passadas):  ${formatToDollar(servicos.reduce((valor, servico) => valor + servico.valorPassado, 0))}</h4>
                <h4>Bens projetados em poços a construir: ${formatToDollar(servicos.reduce((valor, servico) => valor + servico.valorProjetado, 0))}</h4>
                <h4>Otimizações implementadas:  ${formatToDollar(servicos.reduce((valor, servico) => valor + servico.valorImplementado, 0))}</h4>
        */

        
        
        

        // Adicionar botões de zoom
        /* const buttonContainer = container.append("div")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px");

        buttonContainer.append("button")
            .text("Zoom In")
            .style("margin-right", "5px")
            .style("padding", "5px")
            .on("click", () => {
                this.zoom = Math.min(this.zoom + 0.1, 1.4);;
                this.render();
            });

        buttonContainer.append("button")
            .text("Zoom Out")
            .style("padding", "5px")
            .on("click", () => {
                this.zoom = Math.max(this.zoom - 0.1, 1);
                this.render();
            }); */



    }

}


