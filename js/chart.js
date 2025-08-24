$(document).ready(function(){
    $('input[type=radio]').click(function(){
        alert(this.value);
        displayDataCharts(this.value);
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

function displayBubbleChart(data) {
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
}

function displayTable(data) {
    var margin = {top: 10, right: 30, bottom: 90, left: 40},
        width = 2000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        
    const min = parsedData.reduce((a, b) => (a.value < b.value ? a : b)).value;
    const max = parsedData.reduce((a, b) => (a.value > b.value ? a : b)).value;


    var svg = d3.select("#data_table")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(data.map(function(d) { return d.name; }))
        .padding(1);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
    
    var y = d3.scaleLinear()
        .domain([min, max])
        .range([ height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("myline")
        .data(data)
        .enter()
        .append("line")
            .attr("x1", function(d) { return x(d.name); })
            .attr("x2", function(d) { return x(d.name); })
            .attr("y1", function(d) { return y(d.value); })
            .attr("y2", y(0))
            .attr("stroke", "grey")

    svg.selectAll("mycircle")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function(d) { return x(d.name); })
            .attr("cy", function(d) { return y(d.value); })
            .attr("r", "4")
            .style("fill", "#69b3a2")
            .attr("stroke", "black")
}

function displayDataCharts(option) {
    $("#bubble_chart").html("");
    $("#data_table").html("");
    d3.json("/data/countries.json").then(function(data) {
        parsedData = getOptionData(option, data);

        displayBubbleChart(parsedData)
        displayTable(parsedData)
        
    });
}