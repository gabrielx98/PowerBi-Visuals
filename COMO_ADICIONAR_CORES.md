# Como Adicionar Cores Dinâmicas em Power BI Visuals

## Passo 1: Atualizar `capabilities.json`

Adicione este objeto na seção `objects` (antes de `dataPoint`):

```json
"objects": {
    "Cores": {
        "displayName": "Cores",
        "properties": {
            "nomePropriedade1": {
                "displayName": "Label da Cor 1",
                "type": {
                    "fill": {
                        "solid": {
                            "color": true
                        }
                    }
                }
            },
            "nomePropriedade2": {
                "displayName": "Label da Cor 2",
                "type": {
                    "fill": {
                        "solid": {
                            "color": true
                        }
                    }
                }
            }
        }
    },
    "dataPoint": { ... }
}
```

## Passo 2: Criar Card de Cores em `settings.ts`

```typescript
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

class ColorSettings extends formattingSettings.SimpleCard {
    nomePropriedade1 = new formattingSettings.ColorPicker({
        name: "nomePropriedade1",
        displayName: "Label da Cor 1",
        value: { value: "#FF0000" }  // Cor padrão
    });

    nomePropriedade2 = new formattingSettings.ColorPicker({
        name: "nomePropriedade2",
        displayName: "Label da Cor 2",
        value: { value: "#00FF00" }
    });

    name: string = "Cores";
    displayName: string = "Cores";
    slices: Array<formattingSettings.Slice> = [this.nomePropriedade1, this.nomePropriedade2];
}

export class VisualFormattingSettingsModel extends formattingSettings.Model {
    colorCard = new ColorSettings();
    cards = [this.colorCard];
}
```

## Passo 3: Sincronizar Cores em `visual.ts`

### 3.1: Adicionar método privado
```typescript
private syncFormattingSettingsFromMetadata() {
    if (!this.dataView?.metadata?.objects) return;

    const objects = this.dataView.metadata.objects;
    if (!objects['Cores']) return;

    const colorObj = objects['Cores'] as any;
    const colorProperties = ['nomePropriedade1', 'nomePropriedade2'];

    colorProperties.forEach(prop => {
        if (colorObj[prop]?.solid?.color) {
            (this.formattingSettings.colorCard as any)[prop].value = { 
                value: colorObj[prop].solid.color 
            } as any;
        }
    });
}
```

### 3.2: Chamar sincronização em `getFormattingModel()`
```typescript
public getFormattingModel(): powerbi.visuals.FormattingModel {
    this.syncFormattingSettingsFromMetadata();
    
    return this.formattingSettingsService.buildFormattingModel(
        this.formattingSettings
    );
}
```

### 3.3: Usar cores no `render()`
```typescript
private render() {
    const colorCard = this.formattingSettings.colorCard;
    
    // Helper para extrair hex da cor
    const getColorValue = (colorValue: any): string => {
        if (!colorValue) return "#000000";
        if (typeof colorValue === 'string') return colorValue;
        if (colorValue.value && typeof colorValue.value === 'string') return colorValue.value;
        if (colorValue.solid?.color) return colorValue.solid.color;
        if (colorValue.color && typeof colorValue.color === 'string') return colorValue.color;
        return "#000000";
    };

    // Usar cores
    const cor1 = getColorValue(colorCard.nomePropriedade1.value);
    const cor2 = getColorValue(colorCard.nomePropriedade2.value);
    
    // Aplicar nas suas formas
    d3.select(this.target)
        .append("div")
        .style("background-color", cor1);
}
```

## Resumo

1. **capabilities.json**: Define que as cores existem
2. **settings.ts**: Cria os ColorPickers com valores padrão
3. **visual.ts**: 
   - Sincroniza cores via `syncFormattingSettingsFromMetadata()`
   - Extrai hex com `getColorValue()`
   - Aplica cores no D3

Isso é tudo o que você precisa!
