import columnMapping from "../utilities/columnMapping";
import Meta from "./meta";

export default class Projetista {
    Nome: string;
    Indicadores: {
        EmAndamento: number;
        NaoIniciadas: number;
        Finalizadas: number;
    }
    Metas: Meta[];
    NotaGD: number;

    static MontarLista(dataView: powerbi.DataView): Projetista[]{
        const mapping = columnMapping(dataView);

        let projetistas: Projetista[] = dataView.table?.rows?.map(row => {
            let projetista = row[mapping["Atribuido a"]] as string;
            let metas = Meta.montarMetas(dataView).filter( p => p.Projetista == projetista);
            let notaGD = metas.reduce((nota, meta) =>  nota + meta.Nota, 0) / metas.length;
            let emAndamento = metas.filter(meta => meta.Progresso == "Em Andamento").reduce((soma, meta) => soma + 1,0);
            let finalizada = metas.filter(meta => meta.Progresso == "Finalizada").reduce((soma, meta) => soma + 1,0);
            let naoIniciada = metas.filter(meta => meta.Progresso == "Não Iniciada").reduce((soma, meta) => soma + 1,0);
            
            return {
                Nome: projetista,
                Indicadores: {
                    EmAndamento: emAndamento,
                    NaoIniciadas: naoIniciada,
                    Finalizadas: finalizada
                },
                Metas: metas,
                NotaGD: notaGD
            }
        });

        const nomesVistos = new Set();
        const newProjetistas = projetistas.filter(projetista => {
            if(nomesVistos.has(projetista.Nome)){
                return false;
            }
            nomesVistos.add(projetista.Nome);
            return true;
        });

        return newProjetistas;
    }
}