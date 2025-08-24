$(document).ready(function(){
    $('input[type=radio]').click(function(){
        alert(this.value);
        displayChart(this.value);
    });
});

function countByRegion(data) {
    const counts = data.reduce((acc, country) => {
        const region = country.region || "Unknown";
        acc[region] = (acc[region] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
        name,
        value
    }));
}

function countUniqueTimezonesByRegion(data) {
    const tzByRegion = data.reduce((acc, country) => {
        const region = country.region || "Unknown";

        if (!acc[region]) {
            acc[region] = new Set();
        }

        (country.timezones || []).forEach(tz => acc[region].add(tz));

        return acc;
    }, {});


    return Object.entries(tzByRegion).map(([name, tzSet]) => ({
        name,
        value: tzSet.size
    }));
}


function getOptionData(option, data) {
    switch(option) {
        case "1":
            return data.map(d => ({name: d.name, value: d.population}));
        case "2":
            return data.map(d => ({name: d.name, value: d.borders.length}));
        case "3":
            return data.map(d => ({name: d.name, value: d.timezones.length}));
        case "4":
            return data.map(d => ({name: d.name, value: d.languages.length}));
        case "5":
            return countByRegion(data);
        case "6":
            return countUniqueTimezonesByRegion(data);
    }
}

function displayChart(option) {
    $("#bubble_chart").html("");
    d3.json("/data/countries.json").then(function(data) {
        parsedData = getOptionData(option, data);
        console.log(parsedData);
        const width = 800
        const height = 800

        const svg = d3.select("#bubble_chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        const min = parsedData.reduce((a, b) => (a.value < b.value ? a : b)).value;
        const max = parsedData.reduce((a, b) => (a.value > b.value ? a : b)).value;

        console.log(min);
        console.log(max);

        const size = d3.scaleLinear()
            .domain([min, max])
            .range([5,70])

        const Tooltip = d3.select("#bubble_chart")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        const mouseover = function(event, d) {
            Tooltip
                .style("opacity", 1)
        }
        const mousemove = function(event, d) {
            Tooltip
                .html('<u>' + d.name + '</u>' + "<br>" + d.value)
                .style("left", (event.x/2+20) + "px")
                .style("top", (event.y/2-30) + "px")
        }
        var mouseleave = function(event, d) {
            Tooltip
                .style("opacity", 0)
        }

        var node = svg.append("g")
            .selectAll("circle")
            .data(parsedData)
            .join("circle")
                .attr("class", "node")
                .attr("r", d => size(d.value))
                .attr("cx", width / 2)
                .attr("cy", height / 2)
                .style("fill", "black")
                .style("fill-opacity", 0.8)
                .attr("stroke", "black")
                .style("stroke-width", 1)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)

        const simulation = d3.forceSimulation()
            .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(.2).radius(function(d){ return (size(d.value)+3) }).iterations(1)) // Force that avoids circle overlapping

        simulation
            .nodes(parsedData)
            .on("tick", function(d){
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
            });
    });
}