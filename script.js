// -------------------------------------------------------------
// Cargar datos y montar la visualización en #viz
// -------------------------------------------------------------
d3.json("genre_influence_graph.json").then(data => {
    const svgNode = renderInfluenceGraph({ nodes: data.nodes, links: data.links });
    document.getElementById("viz").appendChild(svgNode);
});


// -------------------------------------------------------------
// FUNCIÓN PRINCIPAL QUE DIBUJA LA VISUALIZACIÓN
// -------------------------------------------------------------
function renderInfluenceGraph(data) {

  // -------------------------------------------------------------
  // CONTENEDOR PRINCIPAL tipo "renderSecondaryVisualization"
  // -------------------------------------------------------------
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.background = "#0e0e0e";
  container.style.color = "white";
  container.style.border = "1px solid #333";
  container.style.borderRadius = "12px";
  container.style.padding = "25px 30px 40px 30px";
  container.style.boxShadow = "0px 0px 25px rgba(0,0,0,0.45)";
  container.style.marginTop = "40px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";

  // -------------------------------------------------------------
  // SVG ORIGINAL
  // -------------------------------------------------------------
  const width = 1200;
  const height = 700;

  const color = d3.scaleOrdinal([
    "#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D",
    "#6A4C93", "#F06595", "#2EC4B6", "#E36414",
    "#9B5DE5", "#00BBF9", "#F15BB5", "#00F5D4",
    "#A7C957", "#FF9F1C", "#5E60CE", "#48BFE3",
    "#56CFE1", "#64DFDF", "#80FFDB", "#FF5D8F",
    "#F4A261", "#E76F51", "#2A9D8F", "#8AB17D",
    "#B56576", "#6D597A", "#355070", "#588157",
    "#43AA8B", "#FFBD00", "#E63946", "#1D3557"
  ]);

  const sizeScale = d3.scaleSqrt()
    .domain(d3.extent(data.nodes, d => d.ArtistCount))
    .range([10, 45]);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#111")
      .style("border-radius", "12px")
      .style("border", "2px solid #555")
      .style("font-family", "SF Pro Rounded, sans-serif");

  container.appendChild(svg.node());

  let selectedNode = null;

  svg.on("click", (event) => {
    if (event.target === svg.node()) {
      resetHighlight();
      genreDropdown.value = "";
    }
  });

  svg.append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .text("Influenced By Network");

  const tooltip = d3.select(document.body)
      .append("div")
      .style("position", "absolute")
      .style("background", "#222")
      .style("color", "#fff")
      .style("padding", "10px 15px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-family", "SF Pro Rounded");

  const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(230)
            .strength(0.8))
      .force("charge", d3.forceManyBody().strength(-900))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => sizeScale(d.ArtistCount) + 12));

  const link = svg.append("g")
      .attr("stroke", "#888")
      .attr("stroke-opacity", 0.7)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.weight));

  const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => sizeScale(d.ArtistCount))
      .attr("fill", d => color(d.Genre))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("click", (event, d) => {
        event.stopPropagation();
        highlightReverse(d);
        selectNode(d);
        genreDropdown.value = d.Genre;
      })
      .call(drag(simulation));

  const labels = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("dy", 4)
      .style("font-size", "13px")
      .style("fill", "white")
      .style("pointer-events", "none")
      .text(d => d.Genre);

  node.on("mouseover", (event, d) => {
    tooltip.style("opacity", 1).html(`
      <strong>${d.Genre}</strong><br>
      Artists: ${d.ArtistCount}<br>
      Avg Influence: ${d.AvgInfluence.toFixed(3)}<br>
      Top Artist: ${d.TopArtistName}
    `);
  }).on("mousemove", (event) => {
    tooltip.style("left", event.pageX + 15 + "px")
           .style("top", event.pageY + 10 + "px");
  }).on("mouseout", () => tooltip.style("opacity", 0));

  function selectNode(d) {
    selectedNode = d;

    node
      .attr("stroke", n => n.id === d.id ? "lime" : "#fff")
      .attr("stroke-width", n => n.id === d.id ? 4 : 1.5);
  }

  function highlightReverse(selected) {
    node.transition().duration(300)
      .style("opacity", d =>
        d.id === selected.id ||
        data.links.some(l => l.target.id === selected.id && l.source.id === d.id)
          ? 1
          : 0.12
      );

    labels.transition().duration(300)
      .style("opacity", d =>
        d.id === selected.id ||
        data.links.some(l => l.target.id === selected.id && l.source.id === d.id)
          ? 1
          : 0.1
      );

    link.transition().duration(300)
      .style("stroke-opacity", d =>
        d.target.id === selected.id ? 1 : 0.05
      )
      .style("stroke", d =>
        d.target.id === selected.id ? "#fff" : "#444"
      );
  }

  function resetHighlight() {
    selectedNode = null;

    node.transition().duration(250)
      .style("opacity", 1)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    labels.transition().duration(250).style("opacity", 1);

    link.transition().duration(250)
        .style("stroke-opacity", 0.7)
        .style("stroke", "#888");
  }

  function drag(sim) {
    function dragstarted(event) {
      if (!event.active) sim.alphaTarget(0.2).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);

    labels.attr("x", d => d.x + sizeScale(d.ArtistCount) + 4)
          .attr("y", d => d.y);
  });

  // -------------------------------------------------------------
  // SELECTOR EXTERNO (como en la segunda gráfica)
  // -------------------------------------------------------------
  const dropdownTitle = document.createElement("div");
  dropdownTitle.textContent = "Select Genre";
  dropdownTitle.style.fontSize = "20px";
  dropdownTitle.style.marginTop = "25px";
  dropdownTitle.style.marginBottom = "10px";
  dropdownTitle.style.fontWeight = "600";
  dropdownTitle.style.color = "white";
  dropdownTitle.style.textAlign = "center";
  container.appendChild(dropdownTitle);

  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.style.display = "flex";
  dropdownWrapper.style.justifyContent = "center";

  const genreDropdown = document.createElement("select");
  genreDropdown.style.padding = "8px";
  genreDropdown.style.fontSize = "14px";
  genreDropdown.style.background = "#111";
  genreDropdown.style.color = "white";
  genreDropdown.style.border = "1px solid #555";
  genreDropdown.style.borderRadius = "6px";
  genreDropdown.style.minWidth = "200px";

  const allGenres = Array.from(new Set(data.nodes.map(d => d.Genre))).sort();

  genreDropdown.innerHTML = `
    <option value="">— All genres —</option>
    ${allGenres.map(g => `<option value="${g}">${g}</option>`).join("")}
  `;

  dropdownWrapper.appendChild(genreDropdown);
  container.appendChild(dropdownWrapper);

  genreDropdown.addEventListener("change", () => {
    const genre = genreDropdown.value;

    if (!genre) {
      resetHighlight();
      return;
    }

    const nodeObj = data.nodes.find(n => n.Genre === genre);
    if (nodeObj) {
      highlightReverse(nodeObj);
      selectNode(nodeObj);
    }
  });

  return container;
}





d3.json("simplified_graph.json").then(data => {
    const node = renderSecondaryVisualization({ nodes: data.nodes, links: data.links });
    document.getElementById("viz2").appendChild(node);
});


function renderSecondaryVisualization(data2) { 

  // Extraer nodos tipo Person y filtrar influencia > 0
  let artists = data2.nodes
    .filter(d => d["Node Type"] === "Person")
    .filter(d => d.Influence > 0)
    .filter(d => d.PrincipalGenre && d.PrincipalGenre !== "Unknown");

  // Lista de géneros
  const genres = Array.from(new Set(artists.map(d => d.PrincipalGenre))).sort();

  // Colores
  const color = d3.scaleOrdinal([
    "#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D",
    "#6A4C93", "#F06595", "#2EC4B6", "#E36414",
    "#9B5DE5", "#00BBF9", "#F15BB5", "#00F5D4",
    "#A7C957", "#FF9F1C", "#5E60CE", "#48BFE3",
    "#56CFE1", "#64DFDF", "#80FFDB", "#FF5D8F",
    "#F4A261", "#E76F51", "#2A9D8F", "#8AB17D",
    "#B56576", "#6D597A", "#355070", "#588157",
    "#43AA8B", "#FFBD00", "#E63946", "#1D3557"
  ]);

  // Contenedor principal
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.background = "#0e0e0e";
  container.style.color = "white";
  container.style.border = "2px solid #333";
  container.style.borderRadius = "12px";
  container.style.padding = "25px 30px 40px 30px";
  container.style.boxShadow = "0px 0px 25px rgba(0,0,0,0.45)";
  container.style.marginTop = "40px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";

  // SVG
  const width = 1100;
  const height = 550;
  const margin = { top: 70, right: 20, bottom: 150, left: 90 };

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#111")
    .style("border-radius", "12px")
    .style("border", "2px solid #555");;

  container.appendChild(svg.node());

  // Tooltip
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "#222";
  tooltip.style.color = "white";
  tooltip.style.padding = "10px 15px";
  tooltip.style.border = "1px solid #555";
  tooltip.style.borderRadius = "8px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.fontSize = "13px";
  tooltip.style.opacity = 0;
  tooltip.style.transition = "opacity 0.2s ease";
  tooltip.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.45)";
  document.body.appendChild(tooltip);

  // ───────────────────────────────────────────────
  // FUNCIÓN PARA DIBUJAR EL GRÁFICO
  // ───────────────────────────────────────────────
  function drawChart(genreFilter) {
    svg.selectAll("*").remove();

    let filtered = genreFilter === "All"
      ? [...artists]
      : artists.filter(d => d.PrincipalGenre === genreFilter);

    filtered.sort((a, b) => b.Influence - a.Influence);
    filtered = filtered.slice(0, 15);

    const x = d3.scaleBand()
      .domain(filtered.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.Influence)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Barras con animación
    svg.append("g")
      .selectAll("rect")
      .data(filtered)
      .join("rect")
      .attr("x", d => x(d.name))
      .attr("width", x.bandwidth())
      .attr("fill", d => color(d.PrincipalGenre))
      .attr("opacity", 0.9)
      .attr("y", y(0))               // INICIA DESDE CERO
      .attr("height", 0)             // ALTURA 0
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.Influence))
      .attr("height", d => y(0) - y(d.Influence));

    // Eventos del tooltip
    svg.selectAll("rect")
      .on("mouseover", (event, d) => {
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
          <strong>${d.name}</strong><br>
          Canciones exitosas: ${d.Influence}<br>
          Género: ${d.PrincipalGenre}
        `;
      })
      .on("mousemove", (event) => {
        tooltip.style.left = event.pageX + 12 + "px";
        tooltip.style.top = event.pageY + 12 + "px";
      })
      .on("mouseout", () => tooltip.style.opacity = 0);

    // Eje X
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("font-size", "11px")
        .style("fill", "white")
        .attr("transform", "rotate(-65)")
        .style("text-anchor", "end");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 100)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "16px")
      .style("text-anchor", "middle")
      .text("Artist");

    // Eje Y
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
        .style("fill", "white")
        .style("font-size", "11px");

    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", 30)
      .attr("transform", "rotate(-90)")
      .style("fill", "white")
      .style("font-size", "16px")
      .style("text-anchor", "middle")
      .text("Number of successful songs influenced");

    // Ejes blancos
    svg.selectAll(".domain, .tick line")
      .style("stroke", "#666");

    // Título del gráfico
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 35)
      .attr("text-anchor", "middle")
      .style("font-size", "26px")
      .style("font-weight", "600")
      .style("fill", "white")
      .text(`Top 15 Successful Songs Influenced By An Artist — ${genreFilter}`);
  }

  drawChart("All");

  // ───────────────────────────────────────────────
  // SELECTOR CON TÍTULO "Select artist"
  // ───────────────────────────────────────────────
  const dropdownTitle = document.createElement("div");
  dropdownTitle.textContent = "Select artist";
  dropdownTitle.style.fontSize = "20px";
  dropdownTitle.style.marginTop = "25px";
  dropdownTitle.style.marginBottom = "10px";
  dropdownTitle.style.fontWeight = "600";
  dropdownTitle.style.color = "white";
  dropdownTitle.style.textAlign = "center";
  container.appendChild(dropdownTitle);

  const dropdownWrapper = document.createElement("div");
  dropdownWrapper.style.display = "flex";
  dropdownWrapper.style.justifyContent = "center";

  const dropdown = document.createElement("select");
  dropdown.style.padding = "8px";
  dropdown.style.fontSize = "14px";
  dropdown.style.background = "#111";
  dropdown.style.color = "white";
  dropdown.style.border = "1px solid #555";
  dropdown.style.borderRadius = "6px";
  dropdown.style.minWidth = "200px";

  dropdown.innerHTML = `
    <option value="All">— All genres —</option>
    ${genres.map(g => `<option value="${g}">${g}</option>`).join("")}
  `;

  dropdownWrapper.appendChild(dropdown);
  container.appendChild(dropdownWrapper);

  dropdown.addEventListener("change", () => drawChart(dropdown.value));

  return container;
}
