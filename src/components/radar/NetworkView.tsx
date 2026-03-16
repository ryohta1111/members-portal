'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NetworkNode {
  id: string;
  username: string;
  display_name: string;
  followers_count: number;
  score: number;
  isMe: boolean;
  profile_image_url?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  strength: number;
}

interface NetworkViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  myXId?: string;
  onNodeClick?: (node: NetworkNode) => void;
}

// ---------------------------------------------------------------------------
// D3 internal types (after simulation mutates data)
// ---------------------------------------------------------------------------

interface SimNode extends NetworkNode {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
  strength: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nodeRadius(d: NetworkNode): number {
  if (d.isMe) return 12;
  const r = 6 + Math.sqrt(d.followers_count / 500) * 2;
  return Math.max(6, Math.min(18, r));
}

function edgeWidth(strength: number): number {
  return Math.min(3, 0.5 + strength * 0.5);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NetworkView({
  nodes,
  links,
  myXId,
  onNodeClick,
}: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  // -----------------------------------------------------------------------
  // Main D3 effect
  // -----------------------------------------------------------------------
  const render = useCallback(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl || nodes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clean previous render
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Deep-copy data so D3 can mutate freely
    const simNodes: SimNode[] = nodes.map((n) => {
      const sn = { ...n, x: width / 2, y: height / 2 } as SimNode;
      if (sn.isMe) {
        sn.fx = width / 2;
        sn.fy = height / 2;
      }
      return sn;
    });

    const simLinks: SimLink[] = links.map((l) => ({
      source: l.source as unknown as SimNode,
      target: l.target as unknown as SimNode,
      strength: l.strength,
    }));

    // ----- Simulation --------------------------------------------------
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(120)
          .strength(0.3),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 8),
      )
      .alphaDecay(0.02)
      .alphaMin(0.005)
      .alphaTarget(0.008)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    // ----- Draw edges --------------------------------------------------
    const linkGroup = svg.append('g').attr('class', 'links');

    const linkSel = linkGroup
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => {
        const src = d.source as unknown as SimNode | string;
        const tgt = d.target as unknown as SimNode | string;
        const srcId = typeof src === 'string' ? src : src.id;
        const tgtId = typeof tgt === 'string' ? tgt : tgt.id;
        const meNode = simNodes.find((n) => n.isMe);
        if (meNode && (srcId === meNode.id || tgtId === meNode.id)) {
          return 'rgba(200,75,47,0.3)';
        }
        return 'rgba(255,255,255,0.08)';
      })
      .attr('stroke-width', (d) => edgeWidth(d.strength));

    // ----- Draw nodes --------------------------------------------------
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const nodeSel = nodeGroup
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer');

    // Circle
    nodeSel
      .append('circle')
      .attr('r', (d) => nodeRadius(d))
      .attr('fill', (d) => (d.isMe ? '#C84B2F' : 'rgba(255,255,255,0.25)'))
      .attr('stroke', '#1A1916')
      .attr('stroke-width', (d) => (d.isMe ? 2 : 1.5));

    // Label (hidden by default, shown on hover)
    nodeSel
      .append('text')
      .attr('class', 'r-net-label')
      .text((d) => d.display_name || d.username)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => nodeRadius(d) + 12)
      .attr('font-size', '9px')
      .attr('fill', 'rgba(255,255,255,0.7)')
      .attr('pointer-events', 'none')
      .style('opacity', 0);

    // ----- Hover: show label -------------------------------------------
    nodeSel
      .on('mouseenter', function () {
        d3.select(this).attr('opacity', 1.0);
        d3.select(this).select('.r-net-label').style('opacity', 1);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', null);
        d3.select(this).select('.r-net-label').style('opacity', 0);
      });

    // ----- Click: focus ------------------------------------------------
    nodeSel.on('click', function (_event, d) {
      const clicked = d as SimNode;

      // Find connected node ids
      const connectedIds = new Set<string>();
      connectedIds.add(clicked.id);
      simLinks.forEach((l) => {
        const src = l.source as SimNode;
        const tgt = l.target as SimNode;
        if (src.id === clicked.id) connectedIds.add(tgt.id);
        if (tgt.id === clicked.id) connectedIds.add(src.id);
      });

      // Dim unconnected nodes
      nodeSel.attr('opacity', (n) =>
        connectedIds.has(n.id) ? 1.0 : 0.1,
      );

      // Dim unconnected edges
      linkSel.attr('opacity', (l) => {
        const src = l.source as SimNode;
        const tgt = l.target as SimNode;
        if (src.id === clicked.id || tgt.id === clicked.id) return 1.0;
        return 0.1;
      });

      // External callback
      if (onNodeClick) onNodeClick(clicked);
    });

    // Click on svg background to reset
    svg.on('click', function (event) {
      if (event.target === svgEl) {
        nodeSel.attr('opacity', null);
        linkSel.attr('opacity', null);
      }
    });

    // ----- Drag --------------------------------------------------------
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (_event, d) => {
        d.fx = _event.x;
        d.fy = _event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!d.isMe) {
          d.fx = null;
          d.fy = null;
        }
      });

    nodeSel.call(drag);

    // ----- Tick --------------------------------------------------------
    simulation.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x)
        .attr('y1', (d) => (d.source as SimNode).y)
        .attr('x2', (d) => (d.target as SimNode).x)
        .attr('y2', (d) => (d.target as SimNode).y);

      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  }, [nodes, links, myXId, onNodeClick]);

  // -----------------------------------------------------------------------
  // Initial render + ResizeObserver
  // -----------------------------------------------------------------------
  useEffect(() => {
    render();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      render();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [render]);

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------
  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">ネットワーク図</span>
        <span className="r-panel-sub">クリックでフォーカス — ドラッグで移動</span>
      </div>
      <div className="r-network-container" ref={containerRef}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
