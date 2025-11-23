
// wait until entire HTML doc has loaded
document.addEventListener("DOMContentLoaded", function() { 
  const input = document.getElementById("guess-input");
  const button = document.getElementById("guess-submit");
  const result = document.getElementById("guess-result");

  button.addEventListener("click", function() {
    const num = input.value;
    result.textContent = `You guessed: ${num}%`;

    // reveal answer
    document.getElementById("gender-answer").classList.add("visible"); // adds class "visible" after submit is clicked
    // reveal viz w/ delay
    setTimeout(() => {
        document.getElementById("viz-container").classList.add("visible");}
    , 1500); // 1.5 seconds
  });
});


// load & clean data
// const data = await d3.csv("data/Billboard100_data.csv", d3.autoType);

// work with dummy data for now
const data = [
  { artist_gender: "Non-Binary",   songwriter_gender: "Male",   artist_race: "White",     songwriter_race: "White" },
  { artist_gender: "Female", songwriter_gender: "Male",   artist_race: "Non-White", songwriter_race: "Non-White" },
  { artist_gender: "Male",   songwriter_gender: "Male",   artist_race: "Mixed",     songwriter_race: "Mixed" },
  { artist_gender: "Female", songwriter_gender: "Female", artist_race: "White",     songwriter_race: "White" },
  { artist_gender: "Male",   songwriter_gender: "Male",   artist_race: "White",     songwriter_race: "White" },
  { artist_gender: "Female", songwriter_gender: "Female", artist_race: "Mixed",     songwriter_race: "Mixed" },
  { artist_gender: "Male",   songwriter_gender: "Male",   artist_race: "White",     songwriter_race: "White" },
  { artist_gender: "Mixed",   songwriter_gender: "Male",   artist_race: "Non-White", songwriter_race: "White" }
];


// create nodes and define data to use
// const nodes = data.map((d, i) => ({
//     id: i,
//     artistMale: d["Artist Male"],
//     artistWhite: d["Artist White"],
//     songwriterMale: d["Songwriter Male"],
//     songwriterWhite: d["Songwriter White"]
// }));

// set up margins and dimensions
const svgWidth = 900,
    svgHeight = 450,
    margin = { top: 30, right: 30, bottom: 60, left: 60},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

// set up force simulation
const nodes = data.map((d, i) => ({
    id: i,
    artistGender: d.artist_gender,
    songwriterGender: d.songwriter_gender,
    artistRace: d.artist_race,
    songwriterRace: d.songwriter_race,
    radius: 5
}));
console.log(nodes)


// define current state variables
let currentRole = "Songwriter(s)";
let currentGroup = "none";

// grab roles & update session states with selection
// role drop-down (artist v songwriter)
const roleSelect = document.getElementById("role-select");
roleSelect.addEventListener("change", e => {
    currentRole = e.target.value;
    console.log("current Role:", currentRole);

})

// buttons
const buttons = document.querySelectorAll('button[data-group]');

buttons.forEach(btn => {
    btn.addEventListener("click", e => {
        currentGroup = e.target.dataset.group;
        console.log("currentGroup:", currentGroup);

        updateLayout();
    });
});


// set up simulation
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-5)) // simulate repulsion when strength is negative
    .force("collision", d3.forceCollide().radius(d => d.radius + 1)) // prevents nodes from overlapping
    .force("x", d3.forceX(width / 2).strength(0.02))
    .force("y", d3.forceY(height / 2).strength(0.02));


// default circle setting ("none")
function defaultCircles() {
    simulation
        .force("x", d3.forceX(width / 2).strength(0.02))
        .force("y", d3.forceY(height / 2).strength(0.02))
        .alpha(1) // restart simulation with full energy
        .restart();

    // update colors to race-based
    circles
        .attr("fill", "grey");
}

// create x-center and color mappings for group categories
const xCenterRace = d3.scalePoint()
    .domain(["White","Mixed","Non-White"])
    .range([svgWidth * 0.1, svgWidth * 0.9])
    .padding(0.5);

const xCenterGender = d3.scalePoint()
    .domain(["Male","Female","Mixed","Non-Binary"])
    .range([svgWidth * 0.1, svgWidth * 0.9])
    .padding(0.5);

const raceColor = d3.scaleOrdinal()
    .domain(['White', 'Non-White', 'Mixed'])
    .range(["red","blue","green"]);

const genderColor = d3.scaleOrdinal()
    .domain(["Male","Female","Mixed","Non-Binary"])
    .range(["red","blue","green", "brown"]);


// function that updates simulation based on groups
function clusterByCategory(fieldName, xScale, colorScale) {
    simulation
        .force("x", d3.forceX(d => xScale(d[fieldName])).strength(0.02))
        .alpha(1) // restart simulation with full energy
        .restart();

    // update circle colors 
    circles
        .attr("fill", d => colorScale(d[fieldName]));
}

// legend function
const legendContainer = document.getElementById("legend");

function renderLegend() {
  // wipe previous legend
  legendContainer.innerHTML = "";

  // create legend for "none"
  if (currentGroup === "none") {

    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = "grey";   

    const label = document.createElement("span");
    label.textContent = "All Songs";

    item.appendChild(swatch);
    item.appendChild(label);
    legendContainer.appendChild(item);

    return;  
  }

  // create legend for all other categories
  // pick which scale & label to use
  const scale = currentGroup === "race" ? raceColor : genderColor; // if/else shorthand
  const titleText = currentGroup === "race" ? "Race" : "Gender";

  // small title
  const title = document.createElement("div");
  title.className = "legend-title";
  title.textContent = `${titleText}:`;
  legendContainer.appendChild(title);

  // categories from the scale domain
  const categories = scale.domain();

  categories.forEach(cat => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = scale(cat);

    const label = document.createElement("span");
    label.textContent = cat;

    item.appendChild(swatch);
    item.appendChild(label);
    legendContainer.appendChild(item);
  });
}

// wrap legend with fade in/out function
function updateLegendSmooth() {
    legendContainer.classList.add("fade"); 

  setTimeout(() => {
    renderLegend();                        
    legendContainer.classList.remove("fade"); 
  }, 800); // 0.8 second
}

// function that moves circles / updates layout
function updateLayout() {
    // console.log("updateLayout called with:", { currentRole, currentGroup });

    // default layout
    if (currentGroup === "none") {
        defaultCircles();
        updateLegendSmooth();
    }

    // artist & race
    if (currentRole === "Artist(s)" && currentGroup === "race") {
        clusterByCategory("artistRace", xCenterRace, raceColor);
        updateLegendSmooth();
    }

    // artist & gender
    if (currentRole === "Artist(s)" && currentGroup === "gender") {
        clusterByCategory("artistGender", xCenterGender, genderColor);
        updateLegendSmooth();
    }

    // songwriter & race
    if (currentRole === "Songwriter(s)" && currentGroup === "race") {
        clusterByCategory("songwriterRace", xCenterRace, raceColor);
        updateLegendSmooth();
    }

    // songwriter & gender
    if (currentRole === "Songwriter(s)" && currentGroup === "gender") {
        clusterByCategory("songwriterGender", xCenterGender, genderColor);
        updateLegendSmooth();
    }
}


// create svg

// create empty svg
let CircleSvg = d3.select("#circles")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);


// attach circles
let circles = CircleSvg
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", "grey");

simulation.on("tick", () => {
  circles
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
});

// display legend on initial load of page
renderLegend();
