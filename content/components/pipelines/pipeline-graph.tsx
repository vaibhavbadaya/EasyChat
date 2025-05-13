"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface Node {
  id: string
  name: string
  type: "source" | "transform" | "destination"
}

interface Link {
  source: string
  target: string
}

const nodes: Node[] = [
  { id: "postgres", name: "PostgreSQL", type: "source" },
  { id: "salesforce", name: "Salesforce API", type: "source" },
  { id: "s3", name: "S3 Files", type: "source" },
  { id: "clean", name: "Data Cleaning", type: "transform" },
  { id: "normalize", name: "Schema Normalization", type: "transform" },
  { id: "enrich", name: "Data Enrichment", type: "transform" },
  { id: "snowflake", name: "Snowflake DW", type: "destination" },
  { id: "customer360", name: "Customer 360", type: "destination" },
]

const links: Link[] = [
  { source: "postgres", target: "clean" },
  { source: "salesforce", target: "clean" },
  { source: "s3", target: "clean" },
  { source: "clean", target: "normalize" },
  { source: "normalize", target: "enrich" },
  { source: "enrich", target: "snowflake" },
  { source: "snowflake", target: "customer360" },
]

export default function PipelineGraph() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const width = svgRef.current.clientWidth
    const height = 300

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // Create a force simulation
    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(0, 0))
      .force("x", d3.forceX().strength(0.1))
      .force("y", d3.forceY().strength(0.1))

    // Create links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrowhead)")

    // Define arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999")

    // Create node groups
    const node = svg
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, Node>().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", 25)
      .attr("fill", (d) => {
        switch (d.type) {
          case "source":
            return "#3b82f6"
          case "transform":
            return "#10b981"
          case "destination":
            return "#8b5cf6"
          default:
            return "#64748b"
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)

    // Add text labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 35)
      .attr("fill", "#374151")
      .attr("font-size", "10px")
      .text((d) => d.name)

    // Set up simulation
    simulation.nodes(nodes as any).on("tick", ticked)

    simulation.force<d3.ForceLink<any, any>>("link")!.links(links as any)

    // Tick function to update positions
    function ticked() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
    }

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return () => {
      simulation.stop()
    }
  }, [])

  return (
    <div className="w-full h-[300px] border rounded-md bg-gray-50">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}
