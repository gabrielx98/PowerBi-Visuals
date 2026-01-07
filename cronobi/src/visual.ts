
import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;

import IVisualEventService = powerbi.extensibility.IVisualEventService;

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
    private host: powerbi.extensibility.visual.IVisualHost;

    private dataView: DataView | undefined;
    private width: number = 0;
    private height: number = 0;
    private anoAtual: number = new Date().getFullYear();
    private zoom: number;

    // SDK services / accessibility
    private events: IVisualEventService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private locale: string;
    private isHighContrast = false;

    // Formatting Model (Format Pane)
    private formattingSettingsService = new FormattingSettingsService();
    private formattingSettings: VisualFormattingSettingsModel = new VisualFormattingSettingsModel();

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        this.zoom = 1;

        // Event service & selection manager
        this.events = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();

        // Locale & High Contrast
        this.locale = options.host.locale;
        const cp: any = options.host.colorPalette;
        this.isHighContrast = !!cp?.isHighContrast;

        // Keyboard focus base (acessibilidade)
        this.target.setAttribute("tabindex", "0");
        this.target.setAttribute("role", "region");
        this.target.setAttribute("aria-label", "Cronograma de intervenções");
        this.target.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                // foco no primeiro botão (se existir)
                const firstBtn = this.target.querySelector("button") as HTMLElement | null;
                firstBtn?.focus();
            }
            if (ev.key === "Escape") {
                (this.target as HTMLElement).blur();
            }
        });
    }

    public update(options: VisualUpdateOptions) {
        // Rendering Events - início
        this.events.renderingStarted(options);

        try {
            this.width = options.viewport.width;
            this.height = options.viewport.height;
            this.dataView = options.dataViews?.[0];

            // Landing Page quando não há dados
            const hasData = !!this.dataView?.table?.rows?.length;
            if (!hasData) {
                this.renderLandingPage();
                this.events.renderingFinished(options);
                return;
            }

            const allowInteractions = this.host?.hostCapabilities?.allowInteractions ?? true;

            this.render(allowInteractions);

            // Rendering Events - fim ok
            this.events.renderingFinished(options);
        } catch (err) {
            // Rendering Events - falha
            this.events.renderingFailed(options);
        }
    }

    // Novo Formatting Model para o Format Pane (API ≥ 5.1)
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    // Helper: cores de tema + alto contraste
    private themedColor(defaultHex: string, kind: "fill" | "stroke" | "text" = "fill") {
        const cp: any = this.host.colorPalette;
        if (this.isHighContrast) {
            if (kind === "text" || kind === "stroke") return cp.foreground.value;
            return cp.background.value;
        }
        // Em cenário normal, use o colorPalette (mantendo consistência com o tema)
        const themed = this.host.colorPalette.getColor(defaultHex)?.value;
        return themed ?? defaultHex;
    }

    private renderLandingPage() {
        d3.select(this.target).selectAll("*").remove();
        const wrapper = d3.select(this.target)
            .append("div")
            .style("display", "grid")
            .style("place-items", "center")
            .style("height", `${this.height}px`);

        wrapper.append("div")
            .style("text-align", "center")
            .html(`
                <h3>Sem dados</h3>
                <p>Conecte os campos necessários ou veja as instruções no painel de formato.</p>
            `);
    }

    private attachContextMenu(selection: d3.Selection<any, any, any, any>) {
        selection.on("contextmenu", (event: PointerEvent, d?: any) => {
            this.selectionManager.showContextMenu(d ? d : {}, { x: event.clientX, y: event.clientY });
            event.preventDefault();
        });
    }

    private render(allowInteractions: boolean = true) {
        const dataView = this.dataView!;
        const sondas = Sonda.montarSondas(dataView);
        const servicos = Servico.montarServicos(dataView);
        const mapping = columnMapping(dataView);
        this.anoAtual = Number(dataView.table.rows[0][mapping["Ano"]]);

        d3.select(this.target).selectAll("*").remove();

        // Dimensões
        const margin = { top: 50, right: 30, bottom: 0, left: 200 };
        const width = this.width - margin.left - margin.right;
        let height = (this.height - margin.top - margin.bottom) * (sondas.length / 5);

        // Container HTML com overflow
        const container = d3.select(this.target)
            .append("div")
            .style("width", `${this.width + 500}px`)
            .style("height", `${this.height}px`)
            .style("overflow-y", "scroll")
            .style("overflow-x", "hidden");

        // Legenda (HTML). Corrigido: usar div (não SVG <rect>).
        const containerLegenda = container.append("div")
            .style("position", "relative")
            .style("top", "1px")
            .style("right", "450px")
            .style("width", "100%")
            .style("height", "50px");

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
                `);
            });

        containerLegenda.append("div")
            .style("background-color", "#008000")
            .style("width", "40px")
            .style("height", "25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "460px");

        containerLegenda.append("div")
            .text("Avaliação e Motivação Completa")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "510px")
            .style("width", "300px")
            .style("height", "25px");

        containerLegenda.append("div")
            .style("background-color", "#d3d3d3")
            .style("width", "40px")
            .style("height", "25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "750px");

        containerLegenda.append("div")
            .text("Não Avaliado")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "800px")
            .style("width", "180px")
            .style("height", "25px");

        containerLegenda.append("div")
            .style("background-color", "#ff5d27ff")
            .style("width", "40px")
            .style("height", "25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "810px");

        containerLegenda.append("div")
            .text("Reavaliação Iniciada")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "620px")
            .style("width", "180px")
            .style("height", "25px");

        containerLegenda.append("div")
            .style("background-color", "#0e1fa3ff")
            .style("width", "40px")
            .style("height", "25px")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "610px");

        containerLegenda.append("div")
            .text("Motivação X Esforço")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "420px")
            .style("width", "180px")
            .style("height", "25px");

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
            .style("width", "180px")
            .style("height", "25px");

        // SVG principal
        const svg = container
            .append("svg")
            .attr("width", (width + margin.left + margin.right) * this.zoom)
            .attr("height", (height + margin.top + margin.bottom) * this.zoom);

        // Context menu no SVG (espaço vazio)
        this.attachContextMenu(svg);

        const gRoot = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleTime()
            .domain([new Date(this.anoAtual, 0, 1), new Date(this.anoAtual, 11, 31)])
            .range([0, width * this.zoom]);

        const yScale = d3.scaleBand()
            .domain(sondas.map(s => s.codigoSonda))
            .range([0, height * this.zoom])
            .padding(0.05);

        // Eixos
        const yAxis = d3.axisLeft(yScale);

        const xAxis = d3.axisTop(xScale)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b"))
            .tickSize(0);

        const axisGroup = gRoot.append("g")
            .attr("transform", "translate(40, -30)")
            .call(xAxis);

        // Cabeçalho "Cronograma"
        gRoot.append("rect")
            .attr("x", -200)
            .attr("y", -54)
            .attr("width", 200)
            .attr("height", 50)
            .attr("fill", "gray");

        gRoot.append("text")
            .attr("x", -100)
            .attr("y", -17)
            .attr("fill", "#FFFFFF")
            .style("text-anchor", "middle")
            .style("font-size", "30px")
            .text("Cronograma");

        const zooomlevel = this.zoom;

        // Customização dos ticks (faixas cinza e texto branco)
        axisGroup.selectAll(".tick")
            .each(function () {
                const tick = d3.select(this);
                tick.insert("rect", "text")
                    .attr("x", -40)
                    .attr("y", -24)
                    .attr("width", 120 * zooomlevel)
                    .attr("height", 50)
                    .attr("fill", "gray");

                tick.select("text")
                    .attr("fill", "white")
                    .attr("dy", 13)
                    .style("font-size", "20px")
                    .style("text-anchor", "middle")
                    .style("font-family", "Arial");
            });

        // Faixa com nome das sondas
        const sondaNames = gRoot.selectAll(".sonda-name")
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
            .attr("fill", "#FFFFFF")
            .each(function (d) {
                const textElement = d3.select(this);
                textElement.append("tspan")
                    .attr("x", 100)
                    .attr("dy", "0.2em")
                    .text(d)
                    .style("font-size", `${yScale.bandwidth() / 5}px`);

                textElement.append("tspan")
                    .attr("x", 100)
                    .attr("dy", "1.2em")
                    .text(sondas.filter(s => s.codigoSonda === d).map(s => s.nomeSonda)[0])
                    .style("font-size", `${yScale.bandwidth() / 6}px`);

                textElement.append("tspan")
                    .attr("x", 100)
                    .attr("dy", "1.2em")
                    .text(sondas.filter(s => s.codigoSonda === d).map(s => s.capacidade)[0])
                    .style("font-size", `${yScale.bandwidth() / 5}px`);
            })
            .style("font-size", `${yScale.bandwidth() / 5}px`)
            .style("font-weight", "bold");

        // Modais (HTML)
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
            .style("height", "500px")
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
                modalDetalhes.style("display", "none");
                modalSecundario.style("display", "none");
            });

        modalSecundario.append("button")
            .text("Fechar")
            .style("float", "right")
            .style("cursor", "pointer")
            .on("click", () => modalSecundario.style("display", "none"));

        const modalDetalhesContent = modalDetalhes.append("div");
        const modalSecundarioContent = modalSecundario.append("div");

        // Serviços no cronograma
        gRoot.selectAll(".servico")
            .data(servicos)
            .enter()
            .append("g")
            .attr("class", "servico")
            .each((d, i, nodes) => {
                const grupoServico = d3.select(nodes[i]);

                const anoAtual = Number(dataView.table.rows[0][mapping["Ano"]]);
                const inicioAno = new Date(anoAtual, 0, 1);
                const fimAno = new Date(anoAtual, 11, 31);

                const dataInicio = new Date(d.dtInicio) < inicioAno ? inicioAno : new Date(d.dtInicio);
                const dataFim = new Date(d.dtTermino) > fimAno ? fimAno : new Date(d.dtTermino);

                const xInicio = xScale(dataInicio);
                const xFim = xScale(dataFim);

                const yPos = yScale(d.sonda.codigoSonda)!;

                // Gradiente por serviço
                const defs = svg.append("defs");
                defs.append("linearGradient")
                    .attr("id", `gradiente${d.dtInicio}${d.dtTermino}`)
                    .attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%")
                    .selectAll("stop")
                    .data([
                        { offset: "0%", color: Servico.atribuirCor(d, 1) },
                        { offset: "100%", color: Servico.atribuirCor(d, 2) }
                    ])
                    .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);

                // Retângulo do serviço
                const widthRect = Math.max(1, (xFim - xInicio));
                let retangulo = grupoServico.append("rect")
                    .attr("x", xInicio)
                    .attr("y", yPos + 12)
                    .attr("width", widthRect)
                    .attr("height", yScale.bandwidth() * 0.8)
                    .attr("fill", `url(#gradiente${d.dtInicio}${d.dtTermino})`)
                    .attr("stroke", "#000000")
                    .attr("stroke-width", 1);

                // Tooltip simples (title) — pode evoluir para utils de tooltip
                retangulo.append("title")
                    .text(`${d.poco} • ${formatarTimestamp(d.dtInicio)} → ${formatarTimestamp(d.dtTermino)}`);

                // Context menu no datapoint
                this.attachContextMenu(grupoServico);

                // Círculo de reavaliação (canto superior direito)
                if (d.reavaliacao.projetistaPROJ.avaliacaoUtilizada || d.reavaliacao.projetistaPEP.avaliacaoUtilizada) {
                    grupoServico.append("circle")
                        .attr("cx", xInicio + widthRect - 13)
                        .attr("cy", yPos + 12 + 13)
                        .attr("r", 5)
                        .attr("fill", Servico.atribuirCorCirculo(d))
                        .attr("stroke", "white")
                        .attr("stroke-width", 1.5);
                }

                // Texto dentro do retângulo (até 4 linhas)
                const txt = grupoServico.append("text")
                    .attr("x", (xInicio + xFim) / 2)
                    .attr("y", yPos + yScale.bandwidth() / 2.5)
                    .attr("text-anchor", "middle")
                    .style("font-size", `${yScale.bandwidth() / 8}px`)
                    .style("fill", "#000000");

                txt.append("tspan")
                    .attr("x", (xInicio + xFim) / 2)
                    .attr("dy", "0em")
                    .text(
                        (widthRect > 30) ?
                            (widthRect > 80) ?
                                (d.projeto.projeto.length < 8) ? d.projeto.projeto : d.projeto.projeto.substring(0, 8)
                            : d.projeto.projeto.substring(0, 3)
                        : ""
                    )
                    .style("font-weight", "bold");

                txt.append("tspan")
                    .attr("x", (xInicio + xFim) / 2)
                    .attr("dy", "1.2em")
                    .text((widthRect > 30) ? (widthRect > 120) ? d.projeto.locacao : d.projeto.locacao.substring(0, 3) : "")
                    .style("font-weight", "bold");

                txt.append("tspan")
                    .attr("x", (xInicio + xFim) / 2)
                    .attr("dy", "1.2em")
                    .text(
                        (widthRect > 30) ?
                            (widthRect > 100) ?
                                (d.tipoServico == "Abandono Definitivo") ? "Abandono" : d.tipoServico
                            : d.tipoServico.substring(0, 3)
                        : ""
                    );

                txt.append("tspan")
                    .attr("x", (xInicio + xFim) / 2)
                    .attr("dy", "1.2em")
                    .text(
                        (widthRect > 30) ?
                            (widthRect > 150) ?
                                d.sonda.capacidadeAtual + " - " + d.duracao + " Dias"
                            : d.duracao + " D"
                        : ""
                    );
            })
            .on("click", (event, d: any) => {
                // Respeitar Allow Interactions (dashboard tiles podem desabilitar)
                if (!allowInteractions) return;

                // Exibe modal (fluxo atual)
                modalDetalhes.style("display", "block");
                modalSecundario.style("display", "none");
                modalDetalhesContent.html(`
                    <h2>Detalhes da Intervenção</h2>
                    <p><strong>Sonda:</strong> ${d.sonda.codigoSonda}</p>
                    <p><strong>Projeto:</strong> ${d.projeto.projeto}<p/>
                    <p><strong>Locação:</strong> ${d.projeto.locacao}</p>
                    <p><strong>Poço:</strong> ${d.poco ? d.poco : ""}</p>
                    <p><strong>Tipo de Serviço:</strong> ${d.tipoServico ? d.tipoServico : ""}</p>
                    ${d.descricao ? `<p><strong>Observação:</strong> ${d.descricao}</p>` : ""}
                    <p><strong>Início em:</strong> ${formatarTimestamp(d.dtInicio)}</p>
                    <p><strong>Término em:</strong> ${formatarTimestamp(d.dtTermino)}</p>
                    <p><strong>Valor Estimado em estoque:</strong> ${d.reavaliacao.valorEstoque ? formatToReal(d.reavaliacao.valorEstoque) : "Não Estimado"}</p>
                `);

                modalDetalhesContent.append("button")
                    .text("Reavaliação de Projeto")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        modalSecundario.style("display", "block");
                        modalSecundarioContent.html(`
                            <h3>Reavaliação do Projeto</h3>
                            <h4>O projeto foi reavaliado pelo PROJ com foco em otimização de estoque?</h4>
                            <label>
                              ${d.reavaliacao.projetistaPROJ.observacao
                                ? `<strong>Projetista: ${d.reavaliacao.projetistaPROJ.nome.split(" -")[0]} <br> Observação: </strong> ${d.reavaliacao.projetistaPROJ.observacao}`
                                : "Projeto não reavaliado pelo PROJ."}
                            </label>
                            <h4>${d.reavaliacao.projetistaPROJ.avaliacaoUtilizada ? "Observação do PROJ aplicada!" : ""}</h4>
                            <h4>O projeto foi reavaliado pelo PEP com foco em otimização de estoque?</h4>
                            <label>
                              ${d.reavaliacao.projetistaPEP.observacao
                                ? `<strong>Projetista: ${d.reavaliacao.projetistaPEP.nome.split(" -")[0]} <br> Observação:</strong> ${d.reavaliacao.projetistaPEP.observacao}`
                                : " Projeto não reavaliado pelo PEP."}
                            </label>
                            <h4>${d.reavaliacao.projetistaPEP.avaliacaoUtilizada ? "Observação do PEP aplicada!" : ""}</h4>
                        `);
                    });

                modalDetalhesContent.append("div");

                modalDetalhesContent.append("button")
                    .text("Motivação X Esforço")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        modalSecundario.style("display", "block");
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

        // (Opcional) Se quiser trazer o grupo principal para frente:
        // gRoot.raise();
    }
}

