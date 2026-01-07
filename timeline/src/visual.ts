import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;

import "./../style/visual.less";

interface ProjectPhaseData {
    projectName: string;
    phaseName: string;
    phaseStartDate: Date;
    phaseEndDate: Date;
}

interface MilestoneData {
    projectName: string;
    milestoneName: string;
    milestoneDate: Date;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private zoomLevel: number;
    private dataView: DataView;
    private width: number;
    private height: number;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.zoomLevel = 1;
    }

    public update(options: VisualUpdateOptions) {
        this.dataView = options.dataViews[0];
        this.width = options.viewport.width;
        this.height = options.viewport.height;

        this.render();
    }

    private render() {
        const dataView = this.dataView;

        const minDateBI = dataView.table.rows.map(row => new Date(row[7] as string))[0];
        const maxDateBI = dataView.table.rows.map(row => new Date(row[8] as string))[0];

        // Clear previous content
        d3.select(this.target).html("");

        dataView.table.rows.sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

        // Extract data from the dataView
        let projectPhaseData: ProjectPhaseData[] = dataView.table.rows.map(row => ({
            projectName: row[0] as string,
            phaseName: row[1] as string,
            phaseStartDate: new Date(row[2] as string),
            phaseEndDate: new Date(row[3] as string)
        }));

        const milestoneData: MilestoneData[] = dataView.table.rows.map(row => ({
            projectName: row[4] as string,
            milestoneName: row[5] as string,
            milestoneDate: new Date(row[6] as string)
        }));

        // Filter out projects with empty start dates
        projectPhaseData = projectPhaseData.filter(project => project.phaseStartDate !== null && project.phaseStartDate.getFullYear() >= 2000 && milestoneData.some((miles) => miles.projectName === project.projectName));

        // Combine the data
        let data = projectPhaseData.map(project => ({
            ...project,
            milestones: milestoneData.filter(milestone => milestone.projectName === project.projectName)
        }));


        // Set up dimensions
        const margin = { top: 100, right: 30, bottom: 40, left: 150 }; // Increase bottom margin for spacing
        const width = this.width - margin.left - margin.right;
        const height = this.height - margin.top - margin.bottom;

        // Create a container for the SVG with overflow
        const container = d3.select(this.target)
            .append("div")
            .style("width", `${this.width}px`)
            .style("height", `${this.height}px`)
            .style("overflow-x", "auto")
            .style("overflow-y", "hidden");

        // Create SVG container
        const svg = container.append("svg")
            .attr("width", (width + margin.left + margin.right) * this.zoomLevel)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define scales
        const minDateProject = d3.min(projectPhaseData, d => d.phaseStartDate)!;
        const maxDateProject = d3.max(projectPhaseData, d => d.phaseEndDate)!;

        const minDate = minDateBI > minDateProject ? minDateBI : minDateProject;
        const maxDate = maxDateBI;

        data =
            data.map(project => {
                if (project.phaseStartDate < minDate) {
                    project.phaseStartDate = minDate;
                }
                if (project.phaseEndDate > maxDate) {
                    project.phaseEndDate = maxDate;
                }
                return project;
            });

        data.sort((a,b) => a.projectName.localeCompare(b.projectName));
        
        const xScale = d3.scaleTime()
            .domain([minDate, maxDate])
            .range([0, width * this.zoomLevel]);

        const yScale = d3.scaleBand()
            .domain(projectPhaseData.map(d => d.projectName))
            .range([0, height])
            .padding(0.01);

        // Create axes
        const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
        const yAxis = d3.axisLeft(yScale);

        // Append the bottom x-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dx", "1em");

        // Append the top x-axis with year and month split into two lines
        const xAxisTop = d3.axisTop(xScale).ticks(d3.timeMonth.every(1));

        const xAxisTopGroup = svg.append("g")
            .call(xAxisTop);

        xAxisTopGroup.selectAll("text").remove();

        const xMonths = d3.axisTop(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
        const xYears = d3.axisTop(xScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y"));

        // Append years with rectangles
        const yearsGroup = xAxisTopGroup.append("g")
            .call(xYears)
            .selectAll(".tick")
            .data(xScale.ticks(d3.timeYear.every(1)))
            .enter()
            .append("g");

        yearsGroup.append("rect")
            .attr("x", -25)
            .attr("y", -30)
            .attr("width", 50)
            .attr("height", 20)
            .attr("fill", "darkgray");

        yearsGroup.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => (d as Date).getFullYear());

        // Add grid lines
        const gridLines = svg.append("g")
            .attr("class", "grid")
            .selectAll("line")
            .data(xScale.ticks(d3.timeMonth.every(1)))
            .enter()
            .append("line")
            .attr("x1", d => xScale(d as Date))
            .attr("x2", d => xScale(d as Date))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);

        // Add zoom buttons
        const zoomButtons = d3.select(this.target)
            .append("div")
            .attr("class", "zoom-buttons")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px");

        zoomButtons.append("button")
            .text("+")
            .on("click", () => {
                this.zoomLevel = Math.min(this.zoomLevel + 0.1, 10); // Limit maximum zoom level
                this.render();
            });

        zoomButtons.append("button")
            .text("-")
            .on("click", () => {
                this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5); // Limit minimum zoom level
                this.render();
            });

        // Create groups for each project
        const projectGroups = svg.selectAll(".project")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "project")
            .attr("id", data => `project-${data}`)
            .attr("transform", d => `translate(0, ${yScale(d.projectName)})`);

        // Add tooltip div
        const tooltip = d3.select(this.target).append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("padding", "5px")
            .style("box-shadow", "0px 0px 2px 0px #a9a9a9")
            .style("pointer-events", "none")
            .style("opacity", 0);

            projectGroups.each(function (project) {
            const projectGroup = d3.select(this);

            // Create timeline bars for phases
            projectGroup.selectAll(".phase-bar")
                .data([project])
                .enter()
                .append("rect")
                .attr("class", "phase-bar")
                .attr("x", d => xScale(d.phaseStartDate))
                .attr("y", (d, i) => i * (yScale.bandwidth() / 2)) // Adjust height to half
                .attr("y", d => yScale.bandwidth() / 2) // Start from the base and go to the middle
                .attr("width", d => xScale(d.phaseEndDate) - xScale(d.phaseStartDate))
                .attr("height", yScale.bandwidth() / 2) // Adjust height to half
                .attr("fill", "green");

            // Add phase names inside the timeline bars
            projectGroup.selectAll(".phase-name")
                .data([project])
                .enter()
                .append("text")
                .attr("class", "phase-name")
                .attr("x", d => xScale(d.phaseStartDate) + (xScale(d.phaseEndDate) - xScale(d.phaseStartDate)) / 2)
                .attr("y", (d, i) => yScale.bandwidth() / 1.3)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .text(d => d.phaseName);

            // Add milestones
            projectGroup.selectAll(".milestone")
                .data(project.milestones)
                .enter()
                .append("path")
                .attr("class", "milestone")
                .attr("d", d3.symbol().type(d3.symbolTriangle).size(80))
                .attr("transform", d => `translate(${xScale(d.milestoneDate)}, ${(yScale.bandwidth() / 2.5)}) rotate(180)`)
                .attr("fill", "yellow")
                .on("mouseover", function (event, d) {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Marco: ${d.milestoneName}<br>Data: ${d3.timeFormat("%d-%m-%Y")(d.milestoneDate)}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", function () {
                    tooltip.transition().duration(500).style("opacity", 0);
                });

            // Add milestone names
            projectGroup.selectAll(".milestone-name")
                .data(project.milestones)
                .enter()
                .append("text")
                .attr("class", "milestone-name")
                .attr("x", d => xScale(d.milestoneDate))
                .attr("y", (d, i) => (yScale.bandwidth() / 2.5) - 15)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(d => d.milestoneName);
        });

        // Add project names with background rectangle
        const projectNames = svg.selectAll(".project-name")
            .data(Array.from(new Set(projectPhaseData.map(d => d.projectName))).sort((a, b) => a.localeCompare(b)))
            .enter()
            .append("g")
            .attr("class", "project-name")
            .attr("id", data => `project-name-${data}`)
            .attr("transform", d => `translate(-150, ${yScale(d)})`);
        
        projectNames.append("rect")
            .attr("width", 140)
            .attr("height", yScale.bandwidth())
            .attr("fill", "gray");

        projectNames.append("text")
            .attr("x", 70)
            .attr("y", yScale.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => d);
    }
}