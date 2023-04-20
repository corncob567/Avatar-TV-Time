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

      this.updateVis();
    }
  
    /**
     * This function contains all the code to prepare the data before we render it.
     * In some cases, you may not need this function but when you create more complex visualizations
     * you will probably want to organize your code in multiple functions.
     */
    updateVis() {
        let vis = this;
        const aggregatedDataMap = d3.rollups(vis.data, v => d3.sum(v, d => !d.filtered && d.benderType !== "Unavailable"), d => d[this.mappedAttribute]);
        vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));
        vis.aggregatedData = vis.aggregatedData.filter(d => d.count > 0);
        vis.totalLinesUsed = vis.aggregatedData.reduce((a, b) => a + (b["count"] || 0), 0);
        vis.renderVis();
    }
  
    /**
     * This function contains the D3 code for binding data to visual elements.
     * We call this function every time the data or configurations change 
     * (i.e., user selects a different year)
     */
    renderVis() {
        let vis = this;
      
        // Compute the position of each group on the pie:
        let pie = d3.pie()
            .value(function(d) {return d[1]; });
        
        let dictionary = Object.fromEntries(vis.aggregatedData.map(x => [x.key, x.count]));
        let data_ready = pie(Object.entries(dictionary));
        console.log(data_ready);

        let arcGenerator = d3.arc()
            .innerRadius(0)
            .outerRadius(vis.radius);
        
        // Build the pie chart: Each part of the pie is a path that built using the arc function
        vis.svg
            .selectAll('mySlices')
            .data(data_ready)
            .enter()
            .append('path')
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
            .attr("stroke", "black")
            .style("stroke-width", "2px")
            .style("opacity", 0.3);

        // Now add the annotation. Use the centroid method to get the best coordinates
        let labels = vis.svg
            .selectAll('mySlices')
            .data(data_ready)
            .join('text')
                .text(function(d){ return d.data[0]})
                .attr("transform", function(d) { return `translate(${arcGenerator.centroid(d)})`})
                .style("text-anchor", "middle")
                .style("font-size", 14);

        labels.append('tspan')
            .attr('y', '1em')
            .attr('x', 0)
            .text(d => `${d.data[1]} (${Math.round(d.data[1] / vis.totalLinesUsed * 100)}%)`);
    }
  }