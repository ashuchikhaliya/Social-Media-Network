// Set up the D3.js graph
// Select the graph container
const container = d3.select("#graph-container");

// Append an SVG element to the container
const svg = container
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .append("g");

// Append a background rectangle to fill the SVG
svg
  .append("rect")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("fill", "none")
  .attr("pointer-events", "all"); // Ensure that events are captured on this element

// Enable zoom behavior
const zoom = d3.zoom().scaleExtent([0.1, Infinity]).on("zoom", zoomed);

// Apply zoom behavior to SVG
svg.call(zoom);

// Define the zoom function
function zoomed(event) {
  contentGroup.attr("transform", event.transform);
}

// Append another group for the actual content, inside the main SVG group
const contentGroup = svg.append("g");

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
        .distance(200)
        .strength(0.1)
    )
    .force("charge", d3.forceManyBody().strength(-1000))
    .force("center", d3.forceCenter(0, 0)); // Initial force center

  // Add links to the graph
  const link = contentGroup
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");
  link.attr("stroke-width", 4);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Add nodes (circles) to the graph
  const node = contentGroup
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
    )
    .on("mouseover", handleMouseOver) // Add mouseover event handler
    .on("mouseout", handleMouseOut); // Add mouseout event handler

  // Append circles to the node group with size based on degree
  node
    .append("circle")
    .attr("r", (d) => 30 + (nodeDegrees.get(d.id) || 0))
    .attr("fill", (d) => colorScale(d.id)); // Use the color scale for different colors

  // Append text to the node group
  node
    .append("text")
    .attr("text-anchor", "middle") // Center the text horizontally
    .attr("dy", 4)
    .text((d) => d.name)
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  // Set up the tick function to update positions
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => {
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

  // Mouseover event handler to highlight connected nodes and edges, and show tooltip
  function handleMouseOver(event, d) {
    const connectedNodeIds = new Set();
    const connectedEdgeIds = new Set();
    const hoveredNodeId = d.id;

    // Find connected nodes and edges
    links.forEach((link) => {
      if (link.source.id === d.id) {
        connectedNodeIds.add(link.target.id);
        connectedEdgeIds.add(link.id);
      }
      if (link.target.id === d.id) {
        connectedNodeIds.add(link.source.id);
        connectedEdgeIds.add(link.id);
      }
    });

    // Smoothly increase size for hovered node
    node
      .selectAll("circle")
      .transition()
      .delay(100)
      .duration(500) // Smooth transition duration
      .attr("r", (node) =>
        connectedNodeIds.has(node.id) || node.id === d.id
          ? 45 + (nodeDegrees.get(node.id) || 0)
          : 20
      ); // Adjust size for nodes

    // Smoothly decrease size for non-connected nodes
    node
      .selectAll("circle")
      .filter((node) => !connectedNodeIds.has(node.id) && node.id !== d.id)
      .transition()
      .duration(500) // Smooth transition duration
      .attr("r", 20) // Set smaller size for non-connected nodes
      .style("opacity", (node) =>
        connectedNodeIds.has(node.id) || node.id === d.id ? 1 : 0.2
      );

    // Highlight connected edges and bring them to the front
    link
      .transition()
      .delay(100)
      .duration(500)
      .style("stroke", (d) =>
        d.source.id === hoveredNodeId || d.target.id === hoveredNodeId
          ? "#12ec07"
          : "rgba(183, 180, 180, 0.457)"
      )
      .style("stroke-opacity", (d) =>
        d.source.id === hoveredNodeId || d.target.id === hoveredNodeId ? 1 : 0.2
      )
      .style("stroke-width", (d) =>
        d.source.id === hoveredNodeId || d.target.id === hoveredNodeId ? 6 : 1
      )
      .style("pointer-events", "auto")

      // Set higher z-index for highlighted edges
      .style("z-index", (d) => (connectedEdgeIds.has(d.id) ? 10000 : 0));

    // Show tooltip
    d3.select("#tooltip")
      .style("visibility", "visible")
      .html(`Name: ${d.name} <br> Degree: ${nodeDegrees.get(d.id) || 0}`)
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 15 + "px");

    // Select the user details card
    const card = d3.select("#user-details-card");

    // Populate the card with user details
    card.select("#name").text(`Name: ${d.name}`);
    card.select("#user-id").text(`User ID: ${d.id}`);
    card.select("#username").text(`Username: ${d.profile.username}`);
    card.select("#email").text(`Email: ${d.profile.email}`);
    card.select("#bio").text(`Bio: ${d.profile.bio}`);
    card.select("#other-info").text(`Other Info: ${d.profile.otherInfo}`);

    // Display the card
    card.style("visibility", "visible");
  }

  // Mouseout event handler to reset node and edge sizes, and hide tooltip
  function handleMouseOut() {
    // Reset node sizes
    node
      .selectAll("circle")
      .transition()
      .attr("dy", 4)
      .duration(100) // Smooth transition duration
      .attr("r", (d) => 30 + (nodeDegrees.get(d.id) || 0))
      .style("opacity", 1); // Reset size for nodes

    // Reset edge opacity
    link
      .transition()
      .duration(10) // Smooth transition duration
      .style("opacity", 1)
      .style("stroke", "rgba(183, 180, 180, 0.457)")
      .style("stroke-opacity", 1)
      .style("stroke-width", 4); // Reset opacity for edges

    // Hide tooltip
    d3.select("#tooltip").style("visibility", "hidden");
    // Hide the user details card
    d3.select("#user-details-card").style("visibility", "hidden");
  }
});
