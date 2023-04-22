// GLOBAL VARIABLES
let data;
let descriptionWordCloud, table;
let globalDataFilter = [];
let filterableVisualizations = [];
let stop_words = [];
let selectedCharacter = "any";
let selectedSeason = "any";
let relevant_char_data = [];
let main_characters = ["Aang", "Katara", "Sokka", "Toph", "Zuko", "Azula", "Iroh", "Ozai", "Mai", "Ty Lee", "Jet"]
let modal = document.getElementById("myModal");
span = document.getElementById("btnCloseModal");

//-------------------------//
d3.csv('/data/stop_words.csv', word => stop_words.push(word.words))
stop_words.push("ill", "arent", "youll", "thatll", "whos", "im", "well", "cant", "happened", "theres", "shouldnt", "didnt", "tell", "dont", "youre", "theyre", "whats", "thats", "ive", "youve", "doesnt", "wont", "am", "hes", "shes", "gonna", "doing")
d3.csv("/data/avatar_transcripts.csv")
  .then(_data =>{
    data = _data;
    data.forEach(d => {
      // Derived properties
      d.filtered = false;
      d.season = parseInt(d.season);
      d.episode = parseInt(d.episode);
      if (main_characters.includes(d.character)) {
        relevant_char_data.push(d)
      }
    })
    relevant_char_data.sort((a,b) => b.character - a.character)
    console.log(relevant_char_data)
    console.log('Data loading complete. Work with dataset.');

    // Texts for info tool
    wordCloudText = "This word cloud shows words that are most commonly used by the specified character in the selected season(s)."

    //gets word count of characters across all episodes
    let character_words_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.character);
    let character_word_count = Array.from(character_words_map, ([key, count]) => ({ key, count }));
    character_word_count.sort((a,b) => b.count - a.count)

    // populate character selector
    relevant_characters = character_word_count.slice(0,41)
    // TODO this should probably be moved. no idea to where tho, just doesn't feel right here
    relevant_characters.forEach( (d) => {
      $('#selectedCharacter')
        .append($("<option></option>")
        .attr("value",d.key)
        .text(d.key));
    })

    //gets number of words per episode 
    let characters_words_per_episode_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.season, d => d.episode, d => d.character);
    let characters_words_per_episode = Array.from(characters_words_per_episode_map, ([season, episodes]) => ({ season, episodes}));
    //([season, [ep, [character, count]]]) => ({ season, ep, val: {character, count}})
    //console.log(characters_words_per_episode)

    let charactersWithLines = [];
    let chordCharLines = [];

    //gets list of characters who were in each episode
    let character_in_episodes_map = d3.group(_data, d => d.season, d => d.episode, d=>d.character);
    let character_in_episodes = Array.from(character_in_episodes_map, ([season, episodes]) => ({ season, episodes}));
    character_in_episodes.forEach(i => {
      i.episodes = Array.from(i.episodes, ([episodeNum, characters]) => ({ episodeNum, characters}));
      i.episodes.forEach(episode => {
        episode.characters = Array.from(episode.characters, ([name, lines]) => ({ name, lines}));
        episode.characters.forEach(character => {
          let name = character.name.replace(/:/g,'');
          if(!name.includes(" and ")){
            if (!charactersWithLines[name]) {
              charactersWithLines[name] = 1;
            }
            else{
              charactersWithLines[name] += 1;
            }
          }
          if (main_characters.includes(name)) {
             chordCharLines.push(character.lines);
          }
        })
      });
    });
    //console.log(character_in_episodes);
    //console.log(charactersWithLines);

    let chord_char_lines = Array.from(character_in_episodes_map, ([season, episodes]) => ({ season, episodes}));
    console.log(chord_char_lines)

    console.log("Populating table with values")
    table = new Table({
        'containerWidth': 800,
        'containerHeight': 400,
    }, data, "Katara"); //update with char
    table.updateVis();

    descriptionWordCloud = new WordCloud({parentElement: "#wordCloud"}, data, wordCloudText)
    wordCountBarChart = new Barchart({ parentElement: "#top_characters_barchart"},data,"character","episode", relevant_characters)
    //descriptionWordCloud.updateVis()
    filterableVisualizations = [descriptionWordCloud];

    interactionDiagram = new Chord({parentElement: "#chord"}, relevant_char_data, main_characters);

    filterData(); // initializes filteredData array (to show count on refresh)
    })
.catch(error => {
    console.log(error);
});

function updateSelectedCharacter(newCharacterSelection){
  selectedCharacter = newCharacterSelection;
  descriptionWordCloud.updateVis(selectedCharacter, selectedSeason);
  d3.select(".characterTableSelected").text(newCharacterSelection)
  table.updateVis();
}

function updateSelectedSeason(newSeasonSelection){
  selectedSeason = newSeasonSelection;
  descriptionWordCloud.updateVis(selectedCharacter, selectedSeason);
}

function filterData(resetBrush = false, fullReset = false) {
	let filteredData = data;
	if (fullReset) {
		filterableVisualizations.forEach(v => {
			v.data = data;
		})
	} else {
		filterableVisualizations.forEach(v => {
			filteredData = data.map(d => {
        if(d.insidePolygon === false && leafletMap.drawnFeatures.getLayers().length > 0){
          return {...d, filtered: true};
        }
				for (i in globalDataFilter){
					let attrFilter = globalDataFilter[i]
					if(attrFilter[0] === "requested_date"){
            let parseTime = d3.timeParse("%m/%d/%Y");
						if((parseTime(d[attrFilter[0]]) > attrFilter[1][1] || parseTime(d[attrFilter[0]]) < attrFilter[1][0]) && attrFilter[1][1] !== attrFilter[1][0]){
              return {...d, filtered: true}
						}
					}else{
						if(!attrFilter[1].includes(d[attrFilter[0]]) && attrFilter[1].length > 0){
              return {...d, filtered: true}
						}
					}
				}
				return {...d, filtered: false};
			})
			v.data = filteredData;
		})
	}
	d3.select(".dataCount").text(filteredData.filter(d => !d.filtered).length + " / " + data.length)
	filterableVisualizations.forEach(v => {
		v.updateVis(resetBrush);
	})
}

function clearFilters(){
  leafletMap.drawnFeatures.clearLayers()
	globalDataFilter = [];
	filterData(resetBrush=true, fullReset=true);
}

/////////////////////////// Functions for Modal Browser window 
function openModalBrowser(selectedData) {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  console.log("User clicked (x), close modal")
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  console.log("User clicked out, close modal")
  if (event.target == modal) {
  modal.style.display = "none";
  }
}