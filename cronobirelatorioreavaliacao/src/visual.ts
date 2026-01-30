
"use strict";

import * as d3 from "d3"
import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import { VisualFormattingSettingsModel } from "./settings";

import reavaliacao from "./models/reavaliacao";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: powerbi.extensibility.visual.IVisualHost;

    private dataView: DataView | undefined;
    private width: number = 0;
    private height: number = 0;

    private formattingSettings: VisualFormattingSettingsModel = new VisualFormattingSettingsModel();
    private formattingSettingsService: FormattingSettingsService = new FormattingSettingsService();

    private events: IVisualEventService;
    private selectionManager: powerbi.extensibility.ISelectionManager;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.target = options.element;

        this.events = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();

    }

    public update(options: VisualUpdateOptions) {
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

            this.render();

            // Rendering Events - fim ok
            this.events.renderingFinished(options);
        } catch (err) {
            // Rendering Events - falha
            this.events.renderingFailed(options);
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
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

    private render() {
        d3.select(this.target).selectAll("*").remove();

        const dataView = this.dataView!;
        const reavaliacoes = reavaliacao.montarReavaliacoes(dataView);

        let container = document.createElement("div");
        container.className = "container";
        this.target.appendChild(container);

        reavaliacoes.forEach(reavaliacao => {
            const card = this.createReavaliacaoCard(reavaliacao);
            container.appendChild(card);
        });
    }

    private createReavaliacaoCard(reavaliacao: any): HTMLElement {
        const card = document.createElement("div");
        card.className = "card";

        const blocos = [
            {
                title: "1. Informações Gerais",
                content: `
                    <strong>Sonda:</strong> ${reavaliacao.sonda}<br>
                    <strong>Poço:</strong> ${reavaliacao.poco}<br>
                    <strong>Locação:</strong> ${reavaliacao.locacao}<br>
                    <strong>PROJ:</strong> ${reavaliacao.projetistaPROJ ? reavaliacao.projetistaPROJ.split("-")[0] : "Não Informado"}<br>
                    <strong>PEP:</strong> ${reavaliacao.projetistaPEP ? reavaliacao.projetistaPEP.split("-")[0] : "Não Informado"}<br>
                `
            },
            {
                title: "2. Tipo de Atividade",
                content: `<strong>Tipo de Serviço:</strong> ${reavaliacao.tipoServico}<br>
                         <strong>Tipo de Tarefa:</strong> ${reavaliacao.tipoTarefa}<br>
                         <strong>Descrição:</strong> ${reavaliacao.tipoServicoDescricao}`
            },
            {
                title: "3. Reavaliação do PROJ",
                content: reavaliacao.observacaoPROJ || "Não informado"
            },
            {
                title: "4. Reavaliação do PEP",
                content: reavaliacao.observacaoPEP || "Não informado"
            },
            {
                title: "5. Avaliação de Eficácia",
                content: this.getAvaliacaoContent(reavaliacao)
            },
            {
                title: "6. Impacto em Custo",
                content: `<strong>Valor Estoque:</strong> ${reavaliacao.valorEstoque ? "R$ " + reavaliacao.valorEstoque.toFixed(2).replace(".", ",") : "Não informado"}`
            }
        ];

        blocos.forEach(bloco => {
            card.appendChild(this.createBloco(bloco.title, bloco.content));
        });

        return card;
    }

    private createBloco(title: string, content: string): HTMLElement {
        const bloco = document.createElement("div");
        bloco.className = "bloco";

        const titleElement = document.createElement("h3");
        titleElement.innerText = title;
        bloco.appendChild(titleElement);

        const contentElement = document.createElement("p");
        contentElement.innerHTML = content;
        bloco.appendChild(contentElement);

        return bloco;
    }

    private getAvaliacaoContent(reavaliacao: any): string {
        let content = `<strong>Avaliação PROJ:</strong> ${reavaliacao.avaliacaoPROJUtilizada ? "EFICAZ" : "INEFICAZ"}`;
        content += `<br><strong>Avaliação PEP:</strong> ${reavaliacao.avaliacaoPEPUtilizada ? "EFICAZ" : "INEFICAZ"}`;
        return content;
    }
}