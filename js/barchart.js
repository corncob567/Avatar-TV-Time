class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _xval, _yval, _relevant_characters, _infoText) {
    // Configuration object with defaults
    // Important: depending on your vis and the type of interactivity you need
    // you might want to use getter and setter methods for individual attributes
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 750,
      containerHeight: _config.containerHeight || 1800,
      margin: _config.margin || {top: 20, right: 80, bottom: 50, left: 130},
      infoText: _infoText
    }
    this.data = _data;
    this.xval = _xval;
    this.yval = _yval;
    this.relevant_characters = _relevant_characters

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

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .range([0, vis.height])
        .paddingInner(0.15);
      
    vis.charColorScale = d3.scaleOrdinal()
      //earth - #063, water - #039, fire - #e55, air - #FF9900
      .range(['#FF9900', '#039', '#039', '#e55', '#e55', '#063', '#e55', '#e55', '#063', '#e55', '#e55', '#039', '#e55', '#e55', '#039', '#063', '#063', '#039', '#039', '#9932cc', '#063', '#063', '#063', '#e55', '#063', '#063', '#039', '#e55', '#e55', '#063', '#039', '#063', '#e55', '#063', '#063', '#063', '#063', '#e55', '#e55', '#e55', '#063']) 
      .domain(['Aang', 'Sokka', 'Katara', 'Zuko', 'Iroh', 'Toph', 'Azula', 'Mai', 'Suki', 'Ozai', 'Ty Lee', 'Hakoda', 'Zhao', 'Roku', 'Pakku', 'Jet', 'Long Feng', 'Bato', 'Yue', 'Pathik', 'Teo', 'Haru', 'Bumi', 'Warden', 'Mechanist', 'Kuei', 'Arnook', 'Piandao', 'Jeong Jeong', 'Joo Dee', 'Hama', 'Chong', 'Sozin', 'Zhang leader', 'Zei', 'Fong', 'Wu', 'Sun Warrior chief', 'Shyu', 'Young Azula', 'Gan Jin leader']);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickPadding(20)
        .tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = d3.select("#top_characters_barchart_xaxis").append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(${vis.config.margin.left},30)`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Info Logo
    vis.xAxisG
    .append("svg:image")
    .attr("xlink:href", "../assets/info-logo.png")
    .attr('class', 'info-logo')
    .attr("transform", "translate(" + (570) + " ," + (0) + ")")
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

    vis.updateVis()
  }

  /**
   * This function contains all the code to prepare the data before we render it.
   * In some cases, you may not need this function but when you create more complex visualizations
   * you will probably want to organize your code in multiple functions.
   */
  updateVis() {
    let vis = this;

    // character word count to be written on bar
    vis.character_words_map = d3.rollups(vis.data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.character);
    vis.character_word_count = Array.from(vis.character_words_map, ([key, count]) => ({ key, count }));
    vis.character_word_count.sort((a,b) => b.count - a.count)

    // size of bars based on characters with lines 
    vis.characterAppearances = []
    let character_in_episodes_map = d3.group(vis.data, d => d.season, d => d.episode, d=>d.character);
    let character_in_episodes = Array.from(character_in_episodes_map, ([season, episodes]) => ({ season, episodes}));
    character_in_episodes.forEach(i => {
      i.episodes = Array.from(i.episodes, ([episodeNum, characters]) => ({ episodeNum, characters}));
      i.episodes.forEach(episode => {
        episode.characters = Array.from(episode.characters, ([name, lines]) => ({ name, lines}));
        episode.characters.forEach(character => {
          let name = character.name.replace(/:/g,'');
          if(!name.includes(" and ")){
            if (!vis.characterAppearances[name]) {
              vis.characterAppearances[name] = 1;
            }
            else{
            vis.characterAppearances[name] += 1;
            }
          }
        })
      });
    });

    vis.relevantCharacterAppearances = {}
    vis.relevant_characters.forEach(d => {
      if (d.key in vis.characterAppearances){
        vis.relevantCharacterAppearances[d.key] = vis.characterAppearances[d.key]
      }
    })

    vis.relevantCharacterAppearances = Array.from(Object.entries(vis.relevantCharacterAppearances), ([key, count]) => ({ key, count }))
    vis.relevantCharacterAppearances.sort((a, b) => b.count - a.count)
    // Specificy x- and y-accessor functions
    vis.xValue = d => d.count;
    vis.yValue = d => d.key;
 
    // Set the scale input domains
    vis.xScale.domain([0, d3.max(vis.relevantCharacterAppearances, vis.xValue)]);
    vis.yScale.domain(vis.relevantCharacterAppearances.map(vis.yValue));

    vis.renderVis();
  }

  /**
   * This function contains the D3 code for binding data to visual elements.
   * We call this function every time the data or configurations change 
   * (i.e., user selects a different year)
   */
  renderVis() {
    let vis = this;

    // Add rectangles
    let bars = vis.chart.selectAll('.bar')
        .data(vis.relevantCharacterAppearances)
        .enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('width', d => vis.xScale(vis.xValue(d)))
        .attr('height', vis.yScale.bandwidth())
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('x', 0)
        .attr('fill', d => vis.charColorScale(vis.yValue(d)));

    //Add word count to end
    vis.relevantCharacterAppearances.forEach(d =>{
      let text = vis.character_word_count.find(n => n.key === d.key).count
      //sy_snum.data = data.filter(d => planetFilter.includes(d.pl_name));
      vis.chart.append('text')
        .attr('y', vis.yScale(vis.yValue(d))+23 )//vis.height + 10)
        .attr('x', vis.xScale(vis.xValue(d))+5 )//vis.width/2)
        .attr('width', 20)
        .attr('height', 20)
        .text(text);
    })

    //Bender Logos
    vis.relevantCharacterAppearances.forEach(d =>{
      if (d.key == "Aang"){
        vis.chart.append('svg:image')
        .attr('y', vis.yScale(vis.yValue(d))+8 )
        .attr('x', -20)//vis.width/2)
        .attr('width', 20)
        .attr('height', 20)
        .attr("xlink:href", "assets/air_symbol.png");
      }
      else if(d.key == "Katara" || d.key == "Pakku" || d.key == "Hama"){
        vis.chart.append('svg:image')
        .attr('y', vis.yScale(vis.yValue(d))+8 )
        .attr('x', -20)//vis.width/2)
        .attr('width', 20)
        .attr('height', 20)
        .attr("xlink:href", "assets/water_symbol.png");
      }
      else if(d.key == "Zuko" || d.key == "Iroh" || d.key == "Azula" || d.key == "Ozai" || d.key == "Zhao" || d.key == "Roku" || d.key == "Jeong Jeong" || d.key == "Sozin" || d.key == "Sun Warrior chief" || d.key == "Shyu"){
        vis.chart.append('svg:image')
        .attr('y', vis.yScale(vis.yValue(d))+8 )
        .attr('x', -20)
        .attr('width', 20)
        .attr('height', 20)
        .attr("xlink:href", "assets/fire_symbol.png");
      }
      else if(d.key == "Toph" || d.key == "Long Feng" || d.key == "Haru" || d.key == "Bumi" || d.key == "Fong"){
        vis.chart.append('svg:image')
        .attr('y', vis.yScale(vis.yValue(d))+8 )
        .attr('x', -20)
        .attr('width', 20)
        .attr('height', 20)
        .attr("xlink:href", "assets/earth_symbol.png");
      }      
    })


    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}