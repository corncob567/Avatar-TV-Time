class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _xval, _yval, _relevant_characters) {
    // Configuration object with defaults
    // Important: depending on your vis and the type of interactivity you need
    // you might want to use getter and setter methods for individual attributes
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 750,
      containerHeight: _config.containerHeight || 1800,
      margin: _config.margin || {top: 20, right: 10, bottom: 50, left: 110}
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

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
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

    // Append titles, legends and other static elements here
    // ...
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
        .attr('x', 0);



    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}