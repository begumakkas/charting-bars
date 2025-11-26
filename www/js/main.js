
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
const data = await d3.csv("../data/Billboard100_cleaned.csv", d3.autoType);

// set up force simulation
const nodes = data.map((d, i) => ({
    id: i,
    row: d, // store entire row from csv
    artistGender: d.Artist_Gender,
    songwriterGender: d.Songwriter_Gender,
    artistRace: d.Artist_Race,
    songwriterRace: d.Songwriter_Race,
    happiness: d.Happiness,
    radius: 5
}));
console.log(nodes)


// set up margins and dimensions
const svgWidth = 1200,
    svgHeight = 600,
    margin = { top: 50, right: 50, bottom: 50, left: 50},
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

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
    .force("y", d3.forceY(height / 2).strength(0.02))

// create function to run simulation multiple times with specified cool down time
// context: the circles do not separate enough with one run of the simulation,
// regardless of the parameters used to run the simulation. Therefore, what we
// really need is the simulation to cool down before running it multiple times to
// ensure the circles are fully separated by their categories. 

function oneReheat(reheatCount, N, cool_time) {
    if (reheatCount >= N) return;

    simulation.alpha(1).restart();

    const nextCount = reheatCount + 1;

    if (nextCount < N) {
        setTimeout(() => oneReheat(nextCount, N, cool_time), cool_time);
    }
}

function reheatManyTimes(N, cool_time) {
    oneReheat(0, N, cool_time); // start with reheatCount = 0

}


// default circle setting ("none")
function defaultCircles() {
    simulation
        .force("x", d3.forceX(width / 2).strength(0.02))
        .force("y", d3.forceY(height / 2).strength(0.02))
        .alpha(1) // restart simulation with full energy
        .restart();

    // update colors to race-based
    circles
        .attr("fill", "#B0B0B0");
}

// create x-center and color mappings for group categories
const xCenterRace = d3.scalePoint()
    .domain(["White","Mixed","Non-White"])
    .range([svgWidth * 0.1, svgWidth * 0.9])
    .padding(0.5);

const xCenterGender = d3.scalePoint()
    .domain(["All Male","All Female","Female-Male Mixed","At Least One Non-Binary"])
    .range([svgWidth * 0.1, svgWidth * 0.9])
    .padding(0.5);

const raceColor = d3.scaleOrdinal()
    .domain(['White', 'Non-White', 'Mixed'])
    .range(["#e8c8c8ff","#00B8A9","#9B5DE5"]);

const genderColor = d3.scaleOrdinal()
    .domain(["All Male","All Female","Female-Male Mixed","At Least One Non-Binary"])
    .range(["#E39D25","#2559A6","#6aa171ff", "#E36B5F"]);

const xHappiness = d3.scaleLinear()
    .domain([0, 100])
    .range([0,width]);


// function that updates simulation based on groups
function clusterByCategory(fieldName, xScale, colorScale) {
    simulation
        .force("x", d3.forceX(d => xScale(d[fieldName])).strength(0.05)) 
        .force("y", d3.forceY(height / 2).strength(0.05)); 

    reheatManyTimes(5, 300); // simulate N button clicks, 300ms apart

    // update circle colors 
    circles
        .attr("fill", d => colorScale(d[fieldName]));
}

function clusterByHappiness() {
    simulation 
        .force("x", d3.forceX(d => xHappiness(d.happiness)).strength(0.03))
        .force("y", d3.forceY(height / 2).strength(0.05));

    reheatManyTimes(3, 300); // simulate N button clicks, 300ms apart

    // update circle colors 
    circles
        .attr("fill", "#971b5fff");
}

// legend function
const legendContainer = document.getElementById("legend");

function createSingleLegend(labelText, color) {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = color;   

    const label = document.createElement("span");
    label.textContent = labelText;

    item.appendChild(swatch);
    item.appendChild(label);
    legendContainer.appendChild(item);
}

function renderLegend() {
  // wipe previous legend
  legendContainer.innerHTML = "";

  // create legend for "none"
  if (currentGroup === "none") {
    createSingleLegend("All Songs", "#B0B0B0");
    
    return;  
  }

  if (currentGroup === "happiness") {
    createSingleLegend("All Songs", "#971b5fff");

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

// create svg

// create empty svg
let CircleSvg = d3.select("#circles")
    .append("svg")
    .attr("width", "100%")
    .attr("height", svgHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`); 

const g = CircleSvg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// attach circles
let circles = g
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "song-dot")
    .attr("r", 5)
    .attr("fill", "#B0B0B0");

// join circles to simulation
simulation.on("tick", () => {
    circles
        .attr("cx", d => {
        // clamp x between nodeRadius and width - nodeRadius
        d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
        return d.x;
        })
        .attr("cy", d => {
        // clamp y between nodeRadius and height - nodeRadius
        d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
        return d.y;
        });
});

// create x-axis for other views
const xAxisHappiness = g.append("g")
    .attr("class", "happiness-axis")
    .attr("transform", `translate(0,${height + 20})`)
    .call(
        d3.axisBottom(xHappiness)     
        .tickValues([])
        .tickSize(0)
    );

// create manual labels for happiness x-axis
// left label
xAxisHappiness.append("text")
  .attr("class", "happiness-label")
  .attr("x", xHappiness(0))
  .attr("y", 25)              // a bit below the axis line
  .attr("text-anchor", "start")
  .text("Less Happy");        

// right label
xAxisHappiness.append("text")
  .attr("class", "happiness-label")
  .attr("x", xHappiness(100))
  .attr("y", 25)
  .attr("text-anchor", "end")
  .text("More Happy");        



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

    // happiness
    if (currentGroup === "happiness") {
        clusterByHappiness();
        updateLegendSmooth(); 
        xAxisHappiness.classed("visible", true); // display x-axis only for this group
    } else {
        xAxisHappiness.classed("visible", false)
    };
}


// add tooltip on hover
const tooltip = d3.select("#tooltip")

circles.on("mouseover", (event, d) => 
        {
        tooltip.style("visibility", "visible")
            .text("Song Title: " + d.row.Song + "\n"
                + "Artist: " + d.row.Artist
            );
        })
    .on("mousemove", (event) =>  {
        // Position the tooltip near the cursor
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px")})
    .on("mouseout", () =>  {
        tooltip.style("visibility", "hidden"); 
    })

// display legend on initial load of page
renderLegend();
