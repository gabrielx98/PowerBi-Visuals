# Usando formattingHelper.ts em Outros Projetos

## Arquivo: `src/utilities/formattingHelper.ts`

Copie este arquivo para os outros projetos mantendo o mesmo caminho.

## No `src/settings.ts`

Crie as cores que você quer:

```typescript
class ColorSettings extends formattingSettings.SimpleCard {
    minhaCor1 = new formattingSettings.ColorPicker({
        name: "minhaCor1",
        displayName: "Cor Principal",
        value: { value: "#FF0000" }
    });

    minhaCor2 = new formattingSettings.ColorPicker({
        name: "minhaCor2",
        displayName: "Cor Secundária",
        value: { value: "#00FF00" }
    });

    name: string = "Cores";
    displayName: string = "Cores";
    slices: Array<formattingSettings.Slice> = [this.minhaCor1, this.minhaCor2];
}
```

## No `capabilities.json`

Adicione o objeto de cores:

```json
"objects": {
    "Cores": {
        "displayName": "Cores",
        "properties": {
            "minhaCor1": {
                "displayName": "Cor Principal",
                "type": { "fill": { "solid": { "color": true } } }
            },
            "minhaCor2": {
                "displayName": "Cor Secundária",
                "type": { "fill": { "solid": { "color": true } } }
            }
        }
    }
}
```

## No `src/visual.ts`

```typescript
import { syncFormattingSettingsFromMetadata, getColorValue } from "./utilities/formattingHelper";

export class Visual implements IVisual {
    private formattingSettings: VisualFormattingSettingsModel = new VisualFormattingSettingsModel();
    
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        // Sincronizar cores (obrigatório!)
        syncFormattingSettingsFromMetadata(
            this.dataView,
            this.formattingSettings,
            this.formattingSettings.colorCard,
            ['minhaCor1', 'minhaCor2']  // Lista das cores do seu projeto
        );
        
        return this.formattingSettingsService.buildFormattingModel(
            this.formattingSettings
        );
    }

    private render() {
        const colorCard = this.formattingSettings.colorCard;
        
        // Usar as cores
        const cor1 = getColorValue(colorCard.minhaCor1.value);
        const cor2 = getColorValue(colorCard.minhaCor2.value);
        
        // Aplicar no seu D3/SVG
        d3.select(this.target)
            .append("rect")
            .style("fill", cor1);
    }
}
```

## Resumo

1. Copie `src/utilities/formattingHelper.ts`
2. Importe as funções em visual.ts
3. Chame `syncFormattingSettingsFromMetadata()` em `getFormattingModel()`
4. Use `getColorValue()` para extrair hexadecimal das cores
5. Define cores em `settings.ts` e `capabilities.json`

É tudo!
