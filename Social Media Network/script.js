// Set up the D3.js graph
// Select the graph container

const container = d3.select("#graph-container");

const svg = container
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%");

// Load data from a JSON file
d3.json("social_network_data.json").then(function (data) {
  const nodes = data.nodes;
  const links = data.links;

  // Calculate node degrees
  const nodeDegrees = new Map();
  links.forEach((link) => {
    nodeDegrees.set(link.source, (nodeDegrees.get(link.source) || 0) + 1);
    nodeDegrees.set(link.target, (nodeDegrees.get(link.target) || 0) + 1);
  });

  // Create a simulation with forces (link, charge, center)
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(120)
    )
    .force("charge", d3.forceManyBody().strength(-2000))
    .force(
      "center",
      d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2)
    ); // Initial force center

  // Add links to the graph
  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");
  link.attr("stroke-width", 4);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  // Add nodes (circles) to the graph
  const node = svg
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  // Append circles to the node group with size based on degree
  node
    .append("circle")
    .attr("r", (d) => 30 + (nodeDegrees.get(d.id) || 0))
    .attr("fill", (d) => colorScale(d.id)) // Use the color scale for different colors
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Append text to the node group
  node
    .append("text")
    //.attr("dx", 12)
    .attr("text-anchor", "middle") // Center the text horizontally
    .attr("dy", 4)
    .text((d) => d.name);

  // Set up the tick function to update positions
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => {
      // Ensure nodes stay within the visible portion of the screen
      d.x = Math.max(80, Math.min(window.innerWidth - 60, d.x));
      d.y = Math.max(60, Math.min(window.innerHeight - 60, d.y));
      return `translate(${d.x},${d.y})`;
    });

    // Adjust the force center based on the average position of nodes
    const avgX = d3.mean(nodes, (d) => d.x);
    const avgY = d3.mean(nodes, (d) => d.y);
    simulation.force("center", d3.forceCenter(700, 400));
  });

  // Drag functions to enable node dragging
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Tooltip functions
  function handleMouseOver(event, d) {
    d3.select("#tooltip")
      .style("visibility", "visible")
      .html(`Node: ${d.name} <br> Degree: ${nodeDegrees.get(d.id) || 0}`)
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 15 + "px");
  }

  function handleMouseOut() {
    d3.select("#tooltip").style("visibility", "hidden");
  }
});
