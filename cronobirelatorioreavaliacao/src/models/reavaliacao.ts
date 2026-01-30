import columnMapping from "../utilities/columnMapping";

export default class Reavaliacao {
    sonda: string;
    poco: string;
    locacao: string;
    projetistaPROJ: string;
    projetistaPEP: string;
    tipoServico: string;
    tipoTarefa: string;
    tipoServicoDescricao: string;
    observacaoPROJ: string;
    avaliacaoPROJUtilizada: boolean;
    observacaoPEP: string;
    avaliacaoPEPUtilizada: boolean;
    valorEstoque: number;

    static montarReavaliacoes(dataView: powerbi.DataView): Reavaliacao[] {
        const mapping = columnMapping(dataView);
        let reavaliacoes: Reavaliacao[] = dataView.table.rows.map(row => {
        return {
            sonda: row[mapping["Sonda"]] as string,
            poco: row[mapping["Poço"]] as string,
            locacao: row[mapping["Locação"]] as string,
            projetistaPROJ: row[mapping["Projetista PROJ"]] as string,
            projetistaPEP: row[mapping["Projetista PEP"]] as string,
            tipoServico: row[mapping["Tipo de Serviço"]] as string,
            tipoTarefa: row[mapping["Tipo Tarefa"]] as string,
            tipoServicoDescricao: row[mapping["Descrição"]] as string,
            observacaoPROJ: row[mapping["Observação Generalista"]] as string,
            avaliacaoPROJUtilizada: row[mapping["Avaliação Generalista Utilizada"]] as boolean,
            observacaoPEP: row[mapping["Observação especialista"]] as string,
            avaliacaoPEPUtilizada: row[mapping["Avaliação Especialista Utilizada"]] as boolean,
            valorEstoque: row[mapping["Valor do Estoque"]] as number
        }});

        reavaliacoes.sort((a, b) => {
            const [prefixA, numA] = a.sonda.split('-');
            const [prefixB, numB] = b.sonda.split('-');

            if (prefixA !== prefixB) {
                return prefixA.localeCompare(prefixB);
            }

            return parseInt(numA, 10) - parseInt(numB, 10);
        });

        return reavaliacoes;
    
    }
}