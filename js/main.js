// GLOBAL VARIABLES
let data;
let descriptionWordCloud, pieChart, table;
let globalDataFilter = [];
let filterableVisualizations = [];
let stop_words = [];
let selectedCharacter = "any";
let selectedSeason = "any";
let selectedEpisode = "any";
let relevant_char_data = [];
let main_characters = ["Aang", "Katara", "Sokka", "Toph", "Zuko", "Azula", "Iroh", "Ozai", "Mai", "Ty Lee", "Jet", "Suki"]
let modal = document.getElementById("myModal");
span = document.getElementById("btnCloseModal");

let wikiArticles = {
  Any: "https://avatar.fandom.com/wiki/Category:Characters",
  Aang: "https://avatar.fandom.com/wiki/Aang",
  Zuko: "https://avatar.fandom.com/wiki/Zuko",
  Katara: "https://avatar.fandom.com/wiki/Katara",
  Sokka: "https://avatar.fandom.com/wiki/Sokka",
  Toph: "https://avatar.fandom.com/wiki/Toph_Beifong",
  Iroh: "https://avatar.fandom.com/wiki/Iroh",
  Ozai: "https://avatar.fandom.com/wiki/Ozai",
  Azula: "https://avatar.fandom.com/wiki/Azula",
  Mai: "https://avatar.fandom.com/wiki/Mai",
  Ty_Lee: "https://avatar.fandom.com/wiki/Ty_Lee",
  Suki: "https://avatar.fandom.com/wiki/Suki",
  Jet: "https://avatar.fandom.com/wiki/Jet",
  Zhao: "https://avatar.fandom.com/wiki/Zhao",
  Yue: "https://avatar.fandom.com/wiki/Yue",
  Hakoda: "https://avatar.fandom.com/wiki/Hakoda",
  Pakku: "https://avatar.fandom.com/wiki/Pakku",
  Long_Feng: "https://avatar.fandom.com/wiki/Long_Feng",
  Hama: "https://avatar.fandom.com/wiki/Hama",
  Roku: "https://avatar.fandom.com/wiki/Roku",
  Pathik: "https://avatar.fandom.com/wiki/Pathik",
  Bato: "https://avatar.fandom.com/wiki/Bato",
  Haru: "https://avatar.fandom.com/wiki/Haru",
  Chong: "https://avatar.fandom.com/wiki/Chong",
  Sozin: "https://avatar.fandom.com/wiki/Sozin",
  Bumi: "https://avatar.fandom.com/wiki/Bumi_(King_of_Omashu)",
}
//-------------------------//
d3.csv('/data/stop_words.csv', word => stop_words.push(word.words))
stop_words.push("wouldnt", "ill", "weve", "arent", "youll", "thatll", "whos", "im", "well", "cant", "happened", "theres", "shouldnt", "didnt", "tell", "dont", "youre", "theyre", "whats", "thats", "ive", "youve", "doesnt", "wont", "am", "hes", "shes", "gonna", "doing")
d3.csv("/data/avatar_transcripts.csv")
  .then(_data =>{
    data = _data;
    data.forEach(d => {
      // Derived properties
      d.filtered = false;
      d.season = parseInt(d.season);
      d.episode = parseInt(d.episode);
      d.benderType = getBenderType(d);
      // TODO: Consolidate similar names, "Young Azula" to just "Azula", etc.
      if (main_characters.includes(d.character)) {
        relevant_char_data.push(d)
      }
    })
    relevant_char_data.sort((a,b) => b.character - a.character)
    // console.log(relevant_char_data)
    console.log('Data loading complete. Work with dataset.');

    // Texts for info tool
    wordCloudText = "This word cloud shows words that are most commonly used by the specified character in the selected season(s).";
    pieChartText = "This pie chart shows the proportion of words spoken broken down by the type of bending discipline the speaker has.";
    barChartText = "This bar chart displays the number of episodes each of the main characters appeared in and how many words they said in those episodes. The characters with a logo next to their names are benders and the logo represents their bender type.";
    chordText = "This chord diagram depicts how frequently each of the main characters reference each other.";

    //gets word count of characters across all episodes
    let character_words_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.character);
    let character_word_count = Array.from(character_words_map, ([key, count]) => ({ key, count }));
    character_word_count.sort((a,b) => b.count - a.count)

    // populate character selector
    relevant_characters = character_word_count.slice(0, 41);
    // TODO this should probably be moved. no idea to where tho, just doesn't feel right here
    relevant_characters.forEach( (d) => {
      $('#selectedCharacter')
        .append($("<option></option>")
        .attr("value", d.key)
        .text(d.key));
    })

    //gets number of words per episode 
    let characters_words_per_episode_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.season, d => d.episode, d => d.character);
    let characters_words_per_episode = Array.from(characters_words_per_episode_map, ([season, episodes]) => ({ season, episodes}));
    //([season, [ep, [character, count]]]) => ({ season, ep, val: {character, count}})
    //console.log(characters_words_per_episode);

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
    // console.log(chord_char_lines)

    console.log("Populating table with values")
    table = new Table({
        'containerWidth': 800,
        'containerHeight': 400,
    }, data, "Katara"); //update with char
    table.updateVis();

    pieChart = new Piechart({
      parentElement: '#pieChart',
      containerWidth: 500,
      containerHeight: 600,
      }, data, "benderType", "Which bender type talks the most?", pieChartText);

    descriptionWordCloud = new WordCloud({parentElement: "#wordCloud"}, data, wordCloudText)
    wordCountBarChart = new Barchart({ parentElement: "#top_characters_barchart"},data,"character","episode", relevant_characters, barChartText)
    interactionDiagram = new Chord({parentElement: "#chord"}, relevant_char_data, main_characters, chordText);
    
    filterableVisualizations = [descriptionWordCloud, pieChart];
    filterData(); // initializes filteredData array (to show count on refresh)
    })
.catch(error => {
    console.log(error);
});

function updateSelectedCharacter(newCharacterSelection){
  selectedCharacter = newCharacterSelection;
  descriptionWordCloud.updateVis(selectedCharacter, selectedSeason);
  pieChart.updateVis(selectedCharacter, selectedSeason);
  d3.select(".characterTableSelected").text(newCharacterSelection)
  table.updateVis();
  newCharacterSelection = newCharacterSelection.charAt(0).toUpperCase() + newCharacterSelection.slice(1);
  document.getElementById("currentCharacter").textContent = newCharacterSelection;
  document.getElementById("currentCharacter").href = wikiArticles[newCharacterSelection.replace(/ /g,"_")];
}

function updateSelectedSeason(newSeasonSelection){
  selectedSeason = newSeasonSelection;
  selectedEpisode = "any";
  document.getElementById("currentEpisode").textContent = "All Episodes";
  descriptionWordCloud.updateVis(selectedCharacter, selectedSeason);
  pieChart.updateVis(selectedCharacter, selectedSeason);
  // interactionDiagram.updateVis()
  let element = document.getElementById("ep_button");
  switch(newSeasonSelection){
    case "any":
      document.getElementById("currentSeason").textContent = "All Seasons";
      element.setAttribute("hidden", "hidden");
      break;
    case "1":
      document.getElementById("currentSeason").textContent = "Book 1 - Water";
      element.removeAttribute("hidden");
      break;
    case "2":
      document.getElementById("currentSeason").textContent = "Book 2 - Earth";
      element.removeAttribute("hidden");
      break;
    case "3":
      document.getElementById("currentSeason").textContent = "Book 3 - Fire";
      element.removeAttribute("hidden");
      //add ep 21 dynamically
      document.getElementById("ep21").removeAttribute("hidden");
      break;
  }
}
function updateSelectedEpisode(newEpisodeSelection){
  selectedEpisode = newEpisodeSelection;
  if (selectedEpisode != "any") document.getElementById("currentEpisode").textContent = "Episode " + selectedEpisode;
  else document.getElementById("currentEpisode").textContent = "All Episodes";
  console.log(selectedEpisode)
  descriptionWordCloud.updateVis(selectedCharacter, selectedSeason, selectedEpisode);
  pieChart.updateVis(selectedCharacter, selectedSeason, selectedEpisode);
}

function getBenderType(d){
  let firebenders = ["azula", "zuko", "ozai", "iroh", "jeong jeong", "zhao", "roku", "warden", "sozin", "sun warrior", "shyu", "yon rha"];
  let airbenders = ["aang", "yang chen", "gyatso"];
  let earthbenders = ["toph", "bumi", "haru", "boulder", "long feng", "fong", "hippo", "xin fu", "kyoshi"];
  let waterbenders = ["katara", "pakku", "hama", "tho", "yu"];
  let nonbenders = ["tong", "sokka", "kanna", "yue", "hakoda", "suki", "mai", "ty lee", "pathik", "piandao", "jet", "smellerbee", "longshot", "duke", "song", "ursa",
   "pipsqueak", "mechanist", "koh", "kay-fon", "bato", "zei", "kuei", "chong", "wu", "arnook", "gan jin leader", "joo dee", "zhang leader", "teo", "xu", "june", "fisherman"];
  let char = d.character.toLowerCase();
  if(firebenders.some(v => char.includes(v))) {
    return "Firebender";
  }
  if(earthbenders.some(v => char.includes(v))) {
    return "Earthbender";
  }
  if(waterbenders.some(v => char.includes(v))) {
    return "Waterbender";
  }
  if(airbenders.some(v => char.includes(v))) {
    return "Airbender";
  }
  if(nonbenders.some(v => char.includes(v))) {
    return "Nonbender";
  }
  return "Unavailable";
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
	filterableVisualizations.forEach(v => {
		v.updateVis(resetBrush);
	})
}

function clearFilters(){
	globalDataFilter = [];
  updateSelectedSeason("any");
  updateSelectedEpisode("any");
  updateSelectedCharacter("any");
  d3.select("#phrase").selectAll('text').remove()
	filterData(resetBrush=true, fullReset=true);
}

/////////////////////////// Functions for Modal Browser window 
function openModalBrowser(selectedData) {
  modal.style.display = "flex";
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

/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function selectOtherCharacter() {
  document.getElementById("selectOtherCharacter").classList.toggle("show");
}

function selectSeason() {
  document.getElementById("selectSeason").classList.toggle("show");
}

function selectEpisode(){
  document.getElementById("selectEpisode").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}