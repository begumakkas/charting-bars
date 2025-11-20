
// wait until entire HTML doc has loaded
document.addEventListener("DOMContentLoaded", function() { 
  const input = document.getElementById("guess-input");
  const button = document.getElementById("guess-submit");
  const result = document.getElementById("guess-result");

  button.addEventListener("click", function() {
    const num = input.value;
    result.textContent = `You guessed: ${num}`;
  });
});


// load & clean data
// const data = await d3.csv("data/Billboard100_data.csv", d3.autoType);

// work with dummy data for now

const data = [
  { artist_gender: "Male",      songwriter_gender: "Male", race: "White"},
  { artist_gender: "Female",    songwriter_gender: "Male",race: "Non-White"},
  { artist_gender: "Male",      songwriter_gender: "Male",race: "Mixed"},
  { artist_gender: "Female",    songwriter_gender: "Female",race: "White"},
  { artist_gender: "Male",      songwriter_gender: "Male",race: "White"},
  { artist_gender: "Female",    songwriter_gender: "Female",race: "Mixed"},
  { artist_gender: "Male",      songwriter_gender: "Male", race: "White"},
  { artist_gender: "Male",      songwriter_gender: "Male", race: "White"}
];
console.log(data);


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
    race: d.race,
    radius: 5
}));
console.log(nodes)
console.log([...new Set(nodes.map(d => d.race))]);

const raceColor = d3.scaleOrdinal()
    .domain(['White', 'Non-White', 'Mixed'])
    .range(["red","blue","green"])


const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-5)) // simulate repulsion when strength is negative
    .force("collision", d3.forceCollide().radius(d => d.radius + 1)) // prevents nodes from overlapping
    .force("x", d3.forceX(width / 2).strength(0.02))
    .force("y", d3.forceY(height / 2).strength(0.02));

// functions

// create mapping for race category
let xCenterRace = {
    "White": svgWidth * 0.25,
    "Mixed": svgWidth * 0.5,
    "Non-White": svgWidth * 0.75
}

function clusterByRace() {
    simulation
        .force("x", d3.forceX(d => xCenterRace[d.race]).strength(0.02))
        .alpha(1) // restart simulation with full energy
        .restart();

    // update colors to race-based
    circles
        .attr("fill", d => raceColor(d.race));
}

// connect button to simulation
document.querySelector('button[data-role="race"]')
  .addEventListener("click", clusterByRace);


// svg

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
    .attr("fill", "blue");

simulation.on("tick", () => {
  circles
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
});



