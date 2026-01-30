import Sonda from "./sonda";
import Projeto from "./projeto";
import columnMapping from "../utilities/columnMapping";
import Reavaliacao from "./reavaliacao";
import MotivacaoEsforco from "./motivacaoEsforco";

export default class Servico {
    sonda: Sonda;
    projeto: Projeto;
    poco: string;
    dtInicio: Date;
    dtTermino: Date;
    duracao: Number;
    tipoServico: string;
    descricao: string;
    reavaliacao: Reavaliacao;
    motivacaoEsforco: MotivacaoEsforco;

    static montarServicos(dataView: powerbi.DataView): Servico[] {
        const mapping = columnMapping(dataView);

        let anoAtual = Number(dataView.table.rows[0][mapping["Ano"]]);

        let servicos: Servico[] = dataView.table.rows.map(row => ({
            sonda: {
                codigoSonda: row[mapping["Sonda"]] as string,
                nomeSonda: row[mapping["Nome da Sonda"]] as string,
                capacidade: row[mapping["Capacidade Total"]] as string,
                capacidadeAtual: row[mapping["Capacidade Atual"]] as string,
                posicionamento: row[mapping["Posicionamento"]] as string
            },
            projeto: {
                projeto: row[mapping["Projeto"]] as string,
                locacao: row[mapping["Locação"]] as string
            },
            poco: row[mapping["Poço"]] as string,
            dtInicio: row[mapping["Data de Início"]] as Date,
            dtTermino: row[mapping["Data de Término"]] as Date,
            duracao: row[mapping["Duração"]] as Number,
            tipoServico: row[mapping["Tipo Serviço"]] as string,
            descricao: row[mapping["Descrição"]] as string,
            reavaliacao: {
                projetistaPROJ: {
                    nome: row[mapping["Projetista PROJ"]] as string,
                    projetoFoiAvaliado: row[mapping["Avaliaçao Generalista"]] as boolean,
                    avaliacaoUtilizada: row[mapping["Avaliação Generalista Utilizada"]] as boolean,
                    observacao: row[mapping["Observação Generalista"]] as string
                },
                projetistaPEP: {
                    nome: row[mapping["Projetista PEP"]] as string,
                    projetoFoiAvaliado: row[mapping["Avaliaçao Especialista"]] as boolean,
                    avaliacaoUtilizada: row[mapping["Avaliação Generalista Utilizada"]]as boolean,
                    observacao: row[mapping["Observação Especialista"]] as string
                },
                valorEstoque: row[mapping["Valor estoque"]] as number 
            },
            motivacaoEsforco: {
                proposta: row[mapping["Proposta"]] as string,
                obstaculos: row[mapping["Obstaculos"]] as string,
                licoes: row[mapping["Lições aprendidas"]] as string,
                resultadoEsperado: row[mapping["Resultado esperado"]] as string,
                resultadoObtido: row[mapping["Resultado obtido"]] as string,
                motivador: row[mapping["Checado por"]] as string
            }

        }))

        servicos = servicos.filter(servico => {
            const inicio = new Date(servico.dtInicio);
            const fim = new Date(servico.dtTermino);
           return inicio.getFullYear() <= anoAtual && fim.getFullYear() >= anoAtual;
        })

        return servicos;
    }

    static atribuirCor(servico: Servico, cor: number, colors?: any) {
        const defaultColors = {
            reavaliacaoCompleta: "#008000",
            naoReavaliado: "#d3d3d3",
            reavaliacaoIniciada: "#ff5d27ff",
            motivacaoEsforco: "#0e1fa3ff"
        };

        const colorScheme = colors || defaultColors;

        // Verificar se reavaliação está completa (aplica para ambos cor === 1 e cor === 2)
        if (this.isReavaliacaoCompleta(servico)) {
            return colorScheme.reavaliacaoCompleta;
        }

        // Lógica específica por tipo de cor
        if (cor === 1) {
            return this.isReavaliacaoIniciada(servico) 
                ? colorScheme.reavaliacaoIniciada 
                : colorScheme.naoReavaliado;
        } else if (cor === 2) {
            return this.temMotivaçaoEsforço(servico) 
                ? colorScheme.motivacaoEsforco 
                : colorScheme.naoReavaliado;
        }

        return colorScheme.naoReavaliado;
    }

    private static isReavaliacaoCompleta(servico: Servico): boolean {
        const { projetistaPROJ, projetistaPEP } = servico.reavaliacao;
        const { proposta, licoes, obstaculos, resultadoEsperado, resultadoObtido } = servico.motivacaoEsforco;

        return (
            projetistaPROJ.projetoFoiAvaliado === true &&
            projetistaPEP.projetoFoiAvaliado === true &&
            proposta !== null &&
            licoes !== null &&
            obstaculos !== null &&
            resultadoEsperado !== null &&
            resultadoObtido !== null
        );
    }

    private static isReavaliacaoIniciada(servico: Servico): boolean {
        const { projetistaPROJ, projetistaPEP } = servico.reavaliacao;
        return projetistaPROJ.projetoFoiAvaliado === true || projetistaPEP.projetoFoiAvaliado === true;
    }

    private static temMotivaçaoEsforço(servico: Servico): boolean {
        const { proposta, obstaculos, licoes, resultadoEsperado, resultadoObtido } = servico.motivacaoEsforco;
        return (
            proposta !== null ||
            obstaculos !== null ||
            licoes !== null ||
            resultadoEsperado !== null ||
            resultadoObtido !== null
        );
    }

    static atribuirCorCirculo(servico: Servico, colors?: any){
        const defaultColors = {
            ambas: "red",
            proj: "yellow",
            pep: "green",
            nenhuma: "black"
        };

        const colorScheme = colors || defaultColors;

        if(servico.reavaliacao.projetistaPROJ.avaliacaoUtilizada && servico.reavaliacao.projetistaPEP.avaliacaoUtilizada){
            return colorScheme.ambas;
        }else if(servico.reavaliacao.projetistaPROJ.avaliacaoUtilizada){
            return colorScheme.proj;
        }else if(servico.reavaliacao.projetistaPEP.avaliacaoUtilizada){
            return colorScheme.pep;
        }else{
            return colorScheme.nenhuma;
        }
    }
    
}