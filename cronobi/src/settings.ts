"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Color Formatting Card
 */
class ColorSettings extends FormattingSettingsCard {
    /* showAllDataPoints = new formattingSettings.ToggleSwitch({
        name: "showAllDataPoints",
        displayName: "Show all",
        value: true
    }); */
    
    reavaliacaoCompleta = new formattingSettings.ColorPicker({
        name: "reavaliacaoCompleta",
        displayName: "Reavaliação Completa",
        value: { value: "#008000" }
    });


    naoReavaliado = new formattingSettings.ColorPicker({
        name: "naoReavaliado",
        displayName: "Não Reavaliado",
        value: { value: "#d3d3d3" }
    });

    reavaliacaoIniciada = new formattingSettings.ColorPicker({
        name: "reavaliacaoIniciada",
        displayName: "Reavaliação Iniciada",
        value: { value: "#ff5d27ff" }
    });
    
    motivacaoEsforco = new formattingSettings.ColorPicker({
        name: "motivacaoEsforco",
        displayName: "Motivação X Esforço",
        value: { value: "#0e1fa3ff" }
    });

    reavaliacaoAplicada = new formattingSettings.ColorPicker({
        name: "reavaliacaoAplicada",
        displayName: "Reavaliação Aplicada",
        value: { value: "#fb1403ff" }
    });

    name: string = "Cores";
    displayName: string = "Cores";
    slices: Array<FormattingSettingsSlice> = [this.reavaliacaoCompleta, this.naoReavaliado, this.reavaliacaoIniciada, this.motivacaoEsforco, this.reavaliacaoAplicada];
}

class TextSettings extends FormattingSettingsCard {
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        value: 12
    });

    name: string = "TextSettings";
    displayName: string = "Text Settings";
    slices: Array<FormattingSettingsSlice> = [this.fontSize];
}

/**
* visual settings model class
*
*/
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    colorCard = new ColorSettings();
    textCard = new TextSettings();

    cards = [this.colorCard, this.textCard];
}
