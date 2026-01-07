import columnMapping from "../utilities/columnMapping";

export default class Meta{
    Projetista: string;
    Nota: number;
    Titulo: string;
    Setor: string;
    Prioridade: string;
    Progresso: string;
    Detalhes: string;

    static montarMetas(dataView: powerbi.DataView): Meta[] {
        const mapping = columnMapping(dataView);
        console.log(dataView.table)
        let metas: Meta[] = dataView.table?.rows?.map(row => {
            return {
                Projetista: row[mapping["Atribuido a"]] as string,
                Nota: row[mapping["Nota da Meta"]] as number,
                Titulo: row[mapping["Titulo"]] as string,
                Setor: row[mapping["Setor"]] as string,
                Prioridade: row[mapping["Prioridade"]] as string,
                Progresso: row[mapping["Progresso"]] as string,
                Detalhes: row[mapping["Anotações"]] as string,

            }
        })

        return metas;
    }
    
}