import columnMapping from "../utilities/columnMapping";

export default class Sonda {
    codigoSonda: string;
    nomeSonda: string;
    capacidade: string;
    capacidadeAtual: string;
    posicionamento: string;

    static montarSondas(dataView: powerbi.DataView): Sonda[] {
        const mapping = columnMapping(dataView);

        let sondas: Sonda[] = dataView.table.rows.map(row => {
            return {
                codigoSonda: row[mapping["Sonda"]] as string,
                nomeSonda: row[mapping["Nome da Sonda"]] as string,
                capacidade: row[mapping["Capacidade Total"]] as string,
                posicionamento: row[mapping["Posicionamento"]] as string,
                capacidadeAtual: row[mapping["Capacidade Atual"]] as string
            };
        });

        sondas = sondas.filter((projeto, index, self) =>
            index === self.findIndex((p) => (
                p.codigoSonda === projeto.codigoSonda && p.nomeSonda === projeto.nomeSonda
            ))
        )

        sondas.sort((a, b) => {

            const [prefixA, numA] = a.codigoSonda.split('-');
            const [prefixB, numB] = b.codigoSonda.split('-');

            if (prefixA === prefixB) {
                return Number(numA) - Number(numB); // ordena numericamente
            } else {
                return prefixA.localeCompare(prefixB); // ordena alfabeticamente
            }

        })

        return sondas;
    }
}