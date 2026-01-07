import columnMapping from "../utilities/columnMapping";

export default class Meta {
    titulo: string;
    nota: number;
    detalhes: string;
    setor: string;
    projetistas: string[];

    static montarMetas(dataView: powerbi.DataView): Meta[] {
        const mapping = columnMapping(dataView);

        
        let metas = dataView.table.rows.map(row => {
           return {
                titulo: row[mapping["Nome da Meta"]] as string,
                nota: row[mapping["Nota da Meta"]] as number,
                detalhes: row[mapping["Anotações"]] as string,
                setor: row[mapping["Setor"]] as string,
                projetistas: row[mapping["Projetistas"]] as string
            };
        });

        const resultado: Meta[] = [];

        metas.forEach(item => {
            const existente = resultado.find(m => m.titulo === item.titulo);
            if(existente){
                if(!existente.projetistas.includes(item.projetistas)){
                    existente.projetistas.push(item.projetistas);
                }
            }else{
                resultado.push({
                    titulo: item.titulo,
                    nota: item.nota,
                    detalhes: item.detalhes,
                    setor: item.setor,
                    projetistas: [item.projetistas]
                })
            }
        })

        resultado.sort((a, b) => {

            const [prefixA, numA] = a.titulo.split('-');
            const [prefixB, numB] = b.titulo.split('-');

            if (prefixA === prefixB) {
                return Number(numA) - Number(numB); // ordena numericamente
            } else {
                return prefixA.localeCompare(prefixB); // ordena alfabeticamente
            }

        })

        return resultado;
    }
}