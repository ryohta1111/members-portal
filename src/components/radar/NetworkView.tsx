'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

interface NetworkNode {
  id: string
  username: string
  display_name: string
  followers_count: number
  score: number
  isMe: boolean
  profile_image_url?: string
  rank?: number
}

interface NetworkLink {
  source: string
  target: string
  strength: number
  type?: string
}

interface NetworkViewProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  myXId?: string
  onNodeClick?: (node: NetworkNode) => void
  highlightNodeId?: string | null
}

interface SimNode extends NetworkNode {
  x: number
  y: number
  fx?: number | null
  fy?: number | null
}

interface SimLink {
  source: SimNode
  target: SimNode
  strength: number
  type?: string
}

function nodeRadius(d: NetworkNode): number {
  if (d.isMe) return 18
  const base = 6 + Math.sqrt(d.score / 50) * 2
  return Math.max(6, Math.min(base, 16))
}

export function NetworkView({ nodes, links, myXId, onNodeClick, highlightNodeId }: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  const render = useCallback(() => {
    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl || nodes.length === 0) return

    const width = container.clientWidth
    const height = container.clientHeight

    if (simulationRef.current) {
      simulationRef.current.stop()
      simulationRef.current = null
    }
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Remove old tooltip
    d3.select(container).selectAll('.r-net-tooltip').remove()

    // Background
    const defs = svg.append('defs')

    // Dot grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'net-dot-grid').attr('width', 20).attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse')
    pattern.append('circle').attr('cx', 10).attr('cy', 10).attr('r', 0.5).attr('fill', 'rgba(255,255,255,0.04)')
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#161512')
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#net-dot-grid)')

    // Radial gradient for depth
    const radGrad = defs.append('radialGradient').attr('id', 'net-vignette').attr('cx', '50%').attr('cy', '50%').attr('r', '50%')
    radGrad.append('stop').attr('offset', '50%').attr('stop-color', 'transparent')
    radGrad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0,0,0,0.3)')
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#net-vignette)')

    // Avatar clip paths
    nodes.forEach((n, i) => {
      defs.append('clipPath').attr('id', `avatar-clip-${i}`)
        .append('circle').attr('r', nodeRadius(n))
    })

    // Tooltip
    const tooltip = d3.select(container)
      .append('div').attr('class', 'r-net-tooltip')
      .style('position', 'absolute').style('background', '#222119')
      .style('border', '0.5px solid rgba(200,75,47,0.3)').style('border-radius', '6px')
      .style('padding', '8px 12px').style('pointer-events', 'none').style('opacity', '0')
      .style('font-family', "'DM Sans', sans-serif").style('font-size', '11px')
      .style('color', '#fff').style('z-index', '10').style('transition', 'opacity 0.15s')

    // Nodes setup
    const simNodes: SimNode[] = nodes.map(n => {
      const sn = { ...n, x: width / 2, y: height / 2 } as SimNode
      if (sn.isMe) { sn.fx = width / 2; sn.fy = height / 2 }
      return sn
    })
    const simLinks: SimLink[] = links.map(l => ({
      source: l.source as unknown as SimNode,
      target: l.target as unknown as SimNode,
      strength: l.strength,
      type: l.type,
    }))

    // Simulation with radial force
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(100).strength(0.2))
      .force('charge', d3.forceManyBody<SimNode>().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('radial', d3.forceRadial<SimNode>(
        d => d.isMe ? 0 : 60 + (1 - Math.min(d.score / 1500, 1)) * Math.min(width, height) * 0.3,
        width / 2, height / 2
      ).strength(0.3))
      .force('collide', d3.forceCollide<SimNode>().radius(d => nodeRadius(d) + 6))
      .alphaDecay(0.02).alphaMin(0.005).alphaTarget(0.005).velocityDecay(0.4)

    simulationRef.current = simulation

    // Zoom
    const zoomG = svg.append('g')
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => zoomG.attr('transform', event.transform))
    svg.call(zoom)

    // Default 1.5x zoom centered
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1.5)
      .translate(-width / 2, -height / 2)
    svg.call(zoom.transform, initialTransform)

    // Store zoom for external reset
    ;(svgEl as any).__zoom_ref = zoom
    ;(svgEl as any).__zoom_g = zoomG

    // Draw curved edges
    const linkSel = zoomG.append('g').attr('class', 'links')
      .selectAll<SVGPathElement, SimLink>('path')
      .data(simLinks).join('path')
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (d.type === 'reply') return 'rgba(200,75,47,0.25)'
        if (d.type === 'quote') return 'rgba(212,163,71,0.2)'
        return 'rgba(255,255,255,0.06)'
      })
      .attr('stroke-width', d => Math.min(0.5 + d.strength * 0.8, 3))
      .style('filter', 'drop-shadow(0 0 1px rgba(200,75,47,0.1))')

    // Draw nodes
    const nodeSel = zoomG.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes).join('g').attr('cursor', 'pointer')

    // Glow circle for high-score nodes
    nodeSel.filter(d => d.score >= 800 || d.isMe).append('circle')
      .attr('r', d => nodeRadius(d) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => d.isMe ? 'rgba(200,75,47,0.3)' : 'rgba(200,75,47,0.15)')
      .attr('stroke-width', 1)

    // Main circle
    nodeSel.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => {
        if (d.isMe) return '#C84B2F'
        if (d.score >= 1000) return 'rgba(200,75,47,0.6)'
        if (d.score >= 500) return 'rgba(255,255,255,0.4)'
        return 'rgba(255,255,255,0.2)'
      })
      .attr('stroke', d => d.isMe ? 'rgba(200,75,47,0.6)' : 'rgba(255,255,255,0.1)')
      .attr('stroke-width', d => d.isMe ? 2 : 1)

    // Avatar images for top 10
    nodeSel.filter(d => (d.rank || 99) <= 10 && !!d.profile_image_url)
      .append('image')
      .attr('href', d => d.profile_image_url || '')
      .attr('x', d => -nodeRadius(d))
      .attr('y', d => -nodeRadius(d))
      .attr('width', d => nodeRadius(d) * 2)
      .attr('height', d => nodeRadius(d) * 2)
      .attr('clip-path', (_, i) => {
        const nodeIdx = nodes.findIndex(n => (n.rank || 99) <= 10 && n.profile_image_url)
        return `circle(${nodeRadius(nodes[nodeIdx + i])}px)`
      })
      .style('border-radius', '50%')
      .attr('preserveAspectRatio', 'xMidYMid slice')

    // Pulse for top nodes
    nodeSel.filter(d => d.score >= 800 || d.isMe).each(function(d) {
      const glow = d3.select(this).select('circle:first-of-type')
      const r = nodeRadius(d) + 4
      function pulse() {
        glow.transition().duration(2000).ease(d3.easeSinInOut)
          .attr('r', r + 4).attr('opacity', 0.3)
          .transition().duration(2000).ease(d3.easeSinInOut)
          .attr('r', r).attr('opacity', 0.8)
          .on('end', pulse)
      }
      pulse()
    })

    // Username labels for top 5
    nodeSel.filter(d => (d.rank || 99) <= 5 || d.isMe).append('text')
      .text(d => d.isMe ? 'YOU' : (d.display_name || d.username).slice(0, 8))
      .attr('text-anchor', 'middle')
      .attr('dy', d => nodeRadius(d) + 14)
      .attr('font-size', '8px')
      .attr('fill', d => d.isMe ? '#C84B2F' : 'rgba(255,255,255,0.5)')
      .attr('pointer-events', 'none')

    // Hover
    nodeSel
      .on('mouseenter', function(event: any, d: any) {
        d3.select(this).raise()
        // Highlight connections
        const connIds = new Set<string>([d.id])
        simLinks.forEach(l => {
          const s = (l.source as SimNode).id, t = (l.target as SimNode).id
          if (s === d.id) connIds.add(t)
          if (t === d.id) connIds.add(s)
        })
        nodeSel.transition().duration(200).attr('opacity', n => connIds.has(n.id) ? 1 : 0.15)
        linkSel.transition().duration(200).attr('opacity', l => {
          const s = (l.source as SimNode).id, t = (l.target as SimNode).id
          return s === d.id || t === d.id ? 1 : 0.05
        })
        tooltip.style('opacity', '1').html(`
          <div style="font-weight:600;font-size:12px">${d.display_name || d.username}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5)">@${d.username}</div>
          <div style="font-size:11px;color:#C84B2F;margin-top:4px">Score: ${d.score?.toLocaleString()}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">フォロワー: ${d.followers_count?.toLocaleString()}</div>
        `)
        const [mx, my] = d3.pointer(event, container)
        tooltip.style('left', `${mx + 12}px`).style('top', `${my - 10}px`)
      })
      .on('mouseleave', function() {
        nodeSel.transition().duration(200).attr('opacity', 1)
        linkSel.transition().duration(200).attr('opacity', 1)
        tooltip.style('opacity', '0')
      })

    // Click
    nodeSel.on('click', function(_event, d) {
      if (onNodeClick) onNodeClick(d as SimNode)
    })

    // Background click reset
    svg.on('click', function(event) {
      if (event.target === svgEl) {
        nodeSel.attr('opacity', 1)
        linkSel.attr('opacity', 1)
      }
    })

    // Drag
    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0.005); if (!d.isMe) { d.fx = null; d.fy = null } })
    nodeSel.call(drag)

    // Tick — curved edges
    simulation.on('tick', () => {
      linkSel.attr('d', d => {
        const s = d.source as SimNode, t = d.target as SimNode
        const dx = t.x - s.x, dy = t.y - s.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
        return `M${s.x},${s.y} A${dr},${dr} 0 0,1 ${t.x},${t.y}`
      })
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Highlight from ranking
    if (highlightNodeId) {
      const targetNode = simNodes.find(n => n.id === highlightNodeId)
      if (targetNode) {
        const connIds = new Set<string>([highlightNodeId])
        simLinks.forEach(l => {
          const s = (l.source as SimNode).id || (l.source as any), t = (l.target as SimNode).id || (l.target as any)
          if (s === highlightNodeId) connIds.add(t)
          if (t === highlightNodeId) connIds.add(s)
        })
        setTimeout(() => {
          nodeSel.transition().duration(300).attr('opacity', n => connIds.has(n.id) ? 1 : 0.15)
          linkSel.transition().duration(300).attr('opacity', l => {
            const s = (l.source as SimNode).id, t = (l.target as SimNode).id
            return s === highlightNodeId || t === highlightNodeId ? 1 : 0.05
          })
        }, 500)
      }
    }

  }, [nodes, links, myXId, onNodeClick, highlightNodeId])

  useEffect(() => {
    render()
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => render())
    ro.observe(container)
    return () => {
      ro.disconnect()
      if (simulationRef.current) { simulationRef.current.stop(); simulationRef.current = null }
    }
  }, [render])

  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">ネットワーク図</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="r-map-btn" onClick={() => {
            const el = svgRef.current as any
            if (el?.__zoom_ref && el?.__zoom_g) {
              d3.select(el).transition().duration(500).call(el.__zoom_ref.transform, d3.zoomIdentity)
            }
          }}>全体表示</button>
          <button className="r-map-btn r-map-btn--active" onClick={() => {
            const el = svgRef.current as any
            if (el?.__zoom_ref) {
              const w = containerRef.current?.clientWidth || 600
              const h = containerRef.current?.clientHeight || 300
              const t = d3.zoomIdentity.translate(w / 2, h / 2).scale(1.5).translate(-w / 2, -h / 2)
              d3.select(el).transition().duration(500).call(el.__zoom_ref.transform, t)
            }
          }}>中心</button>
        </div>
      </div>
      <div className="r-network-container" ref={containerRef} style={{ position: 'relative' }}>
        <svg ref={svgRef} style={{ display: 'block' }} />
      </div>
    </div>
  )
}
