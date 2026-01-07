import powerbi from "powerbi-visuals-api";

export default function columnMapping(dataView: powerbi.DataView){
    return dataView.table?.columns.reduce((map, column, index) => {
            map[column.displayName] = index; // Usa o `displayName` como chave e o índice como valor
            return map;
        }, {} as Record<string, number>);
}