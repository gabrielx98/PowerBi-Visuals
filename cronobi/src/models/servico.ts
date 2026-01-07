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

    static atribuirCor(servico: Servico,cor: number){
        if(cor == 1){
            if(
                servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado != null &&
                servico.reavaliacao.projetistaPEP.projetoFoiAvaliado != null &&
                servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado == true &&
                servico.reavaliacao.projetistaPEP.projetoFoiAvaliado == true &&
                servico.motivacaoEsforco.proposta != null &&
                servico.motivacaoEsforco.licoes != null &&
                servico.motivacaoEsforco.obstaculos != null && 
                servico.motivacaoEsforco.resultadoEsperado != null &&
                servico.motivacaoEsforco.resultadoObtido != null
            ){
                return "#008000"
            }
            else if(servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado != null &&
                servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado == true){
                return "#e8917cff";
            }else if(servico.reavaliacao.projetistaPEP.projetoFoiAvaliado != null&&
                servico.reavaliacao.projetistaPEP.projetoFoiAvaliado == true){
                return "#ff5d27ff";
            }else{
                return "#d3d3d3"
            }
        }else if(cor == 2){
            if(
                servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado != null &&
                servico.reavaliacao.projetistaPEP.projetoFoiAvaliado != null &&
                servico.reavaliacao.projetistaPROJ.projetoFoiAvaliado == true &&
                servico.reavaliacao.projetistaPEP.projetoFoiAvaliado == true &&
                servico.motivacaoEsforco.proposta != null &&
                servico.motivacaoEsforco.licoes != null &&
                servico.motivacaoEsforco.obstaculos != null &&
                servico.motivacaoEsforco.resultadoEsperado != null &&
                servico.motivacaoEsforco.resultadoObtido != null
            ){
                return "#008000"
            }
            else if(servico.motivacaoEsforco.proposta != null){
                return "#8694faff";
            }else if(servico.motivacaoEsforco.licoes != null){
                return "#5569fcff";
            }else if(servico.motivacaoEsforco.obstaculos != null){
                return "#3b52fdff";
            } 
            else if(servico.motivacaoEsforco.resultadoEsperado != null){
                return "#3848c6ff";
            } 
            else if(servico.motivacaoEsforco.resultadoObtido != null){
                return "#0e1fa3ff";
            }else{
                return "#d3d3d3"
            }
        }else{
            return "#d3d3d3"
        }
    }

    static atribuirCorCirculo(servico: Servico){
        if(servico.reavaliacao.projetistaPROJ.avaliacaoUtilizada && servico.reavaliacao.projetistaPEP.avaliacaoUtilizada){
            return "red";
        }else if(servico.reavaliacao.projetistaPROJ.avaliacaoUtilizada){
            return "yellow";
        }else if(servico.reavaliacao.projetistaPEP.avaliacaoUtilizada){
            return "green";
        }else{
            return "black";
        }
    }
    
}