import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

/**
 * Sincroniza cores de metadata.objects para formattingSettings
 * @param dataView DataView do Power BI
 * @param formattingSettings Objeto de configurações de formatting
 * @param colorCard Card de cores (ex: this.formattingSettings.colorCard)
 * @param colorProperties Array com nomes das propriedades de cor
 * 
 * Exemplo:
 * syncFormattingSettingsFromMetadata(
 *   this.dataView,
 *   this.formattingSettings,
 *   this.formattingSettings.colorCard,
 *   ['reavaliacaoCompleta', 'naoReavaliado', 'reavaliacaoIniciada']
 * );
 */
export function syncFormattingSettingsFromMetadata(
    dataView: DataView | undefined,
    formattingSettings: any,
    colorCard: any,
    colorProperties: string[]
) {
    if (!dataView?.metadata?.objects) return;

    const objects = dataView.metadata.objects;
    if (!objects['Cores']) return;

    const colorObj = objects['Cores'] as any;

    colorProperties.forEach(prop => {
        if (colorObj[prop]?.solid?.color) {
            (colorCard as any)[prop].value = { 
                value: colorObj[prop].solid.color 
            } as any;
        }
    });
}

/**
 * Extrai valor hex de cor em diferentes formatos
 * @param colorValue Valor da cor (pode ser string, { value: "#hex" }, { solid: { color: "#hex" } }, etc)
 * @returns Hex string da cor ou "#000000" como fallback
 * 
 * Suporta formatos:
 * - String diretamente: "#FF0000"
 * - ThemeColorData: { value: "#FF0000" }
 * - Power BI format: { solid: { color: "#FF0000" } }
 * - Objeto simples: { color: "#FF0000" }
 */
export function getColorValue(colorValue: any): string {
    if (!colorValue) return "#000000";
    
    // String diretamente
    if (typeof colorValue === 'string') return colorValue;
    
    // ThemeColorData com value.value
    if (colorValue.value && typeof colorValue.value === 'string') return colorValue.value;
    
    // Formato solid.color do Power BI
    if (colorValue.solid?.color) return colorValue.solid.color;
    
    // Objeto simples com color
    if (colorValue.color && typeof colorValue.color === 'string') return colorValue.color;
    
    return "#000000";
}
