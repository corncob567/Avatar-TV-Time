class Piechart {
    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _mappedAttribute, _title, _infoText) {
      // Configuration object with defaults
      // Important: depending on your vis and the type of interactivity you need
      // you might want to use getter and setter methods for individual attributes
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 140,
        margin: _config.margin || {top: 20, right: 20, bottom: 20, left: 20},
        title: _title,
        infoText: _infoText
    }
        this.data = _data;
        this.radius = Math.min(this.config.containerWidth, this.config.containerHeight) / 2 - 40;
        this.mappedAttribute = _mappedAttribute;
        this.initVis();
    }
    
    /**
     * This function contains all the code that gets excecuted only once at the beginning.
     * (can be also part of the class constructor)
     * We initialize scales/axes and append static elements, such as axis titles.
     * If we want to implement a responsive visualization, we would move the size
     * specifications to the updateVis() function.
     */
    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append("g")
            .attr("transform", `translate(${vis.config.containerWidth / 2}, ${vis.config.containerHeight / 2})`);

        // Title
        vis.svg.append("text")
        .attr("x", 0)
        .attr("y", -250)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style('text-decoration', 'underline')
        .text(vis.config.title);

        // Info Logo
        vis.svg
        .append("svg:image")
        .attr("xlink:href", "../assets/info-logo.png")
        .attr('class', 'info-logo')
        .attr("transform", "translate(" + (200) + " ," + (-270) + ")")
        .on("mouseover mouseleave", function(d){ 
            if (!d3.select('#info-tooltip').classed("selected") ){
                d3.select(this).attr("xlink:href", "../assets/info-logo-blue.png");
                d3.select('#info-tooltip').classed("selected", true)
                .style('display', 'block')
                .style('left', (event.pageX + 5) + 'px')   
                .style('top', (event.pageY) + 'px')
                .html(`
                    <div class="tooltip-description">${vis.config.infoText}</div>
                    
                `);
            }else{
                d3.select(this).attr("xlink:href", "../assets/info-logo.png");
                d3.select('#info-tooltip').classed("selected", false);
                d3.select('#info-tooltip').style('display', 'none');
            }
        })
}
  
    updateVis() {
        let vis = this;
        let filteredData = vis.data.filter(d => !d.filtered && d.dialog !== undefined && (d.character.toLowerCase() === selectedCharacter.toLowerCase() || selectedCharacter === "any") && (d.season.toString() === selectedSeason || selectedSeason === "any"))
        const aggregatedDataMap = d3.rollups(filteredData, v => d3.sum(v, d => !d.filtered && d.benderType !== "Unavailable"), d => d[this.mappedAttribute]);
        vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));
        vis.aggregatedData = vis.aggregatedData.filter(d => d.count > 0);
        vis.totalLinesUsed = vis.aggregatedData.reduce((a, b) => a + (b["count"] || 0), 0);
        vis.renderVis();
    }
  
    renderVis() {
        let vis = this;
      
        let pie = d3.pie()
            .value(function(d) {return d[1]; });
        
        let dictionary = Object.fromEntries(vis.aggregatedData.map(x => [x.key, x.count]));
        let data_ready = pie(Object.entries(dictionary));

        let arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(vis.radius);
        
        let slices = vis.svg
            .selectAll('.slice')
            .data(data_ready)
            .join('path')
            .attr('class', 'slice')
            .transition()
            .duration(1000)
            .attr('d', arcGenerator)
            .attr('fill', function(d){
                switch(d.data[0].toLowerCase()){
                    case "airbender":
                        return "yellow";
                    case "earthbender":
                        return "green";
                    case "waterbender":
                        return "blue";
                    case "firebender":
                        return "red";
                    case "nonbender":
                        return "brown";
                }
             })
            .attr("stroke", "black");

        vis.svg.selectAll('.slice').on("mouseover mouseleave", function(d){ 
            if (!d3.select(this).classed("selected") ){
                d3.select(this).classed("selected", true);
            }else{
                d3.select(this).classed("selected", false);
            }
        })

        let labels = vis.svg
            .selectAll('.sliceLabel')
            .data(data_ready)
            .join('text')
                .attr('class', 'sliceLabel')
                .text(function(d){ return d.data[0]})
                .attr("transform", function(d) { return `translate(${arcGenerator.centroid(d)})`})
                .style("text-anchor", "middle")
                .style("color", "green")
                .style("font-size", 14);

        labels.append('tspan')
            .attr('y', '1.1em')
            .attr('x', 0)
            .text(d => `${d.data[1]} (${Math.round(d.data[1] / vis.totalLinesUsed * 100)}%)`);
    }
  }