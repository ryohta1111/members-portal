'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

interface MapViewProps {
  data: Array<{ country_code: string; count: number }>
  onCountryClick?: (code: string) => void
}

const numericToAlpha2: Record<number, string> = {
  392: 'JP', 840: 'US', 410: 'KR', 158: 'TW', 764: 'TH', 704: 'VN',
  608: 'PH', 360: 'ID', 458: 'MY', 702: 'SG', 356: 'IN', 156: 'CN',
  826: 'GB', 276: 'DE', 250: 'FR', 76: 'BR', 566: 'NG', 792: 'TR',
  784: 'AE', 36: 'AU', 124: 'CA', 643: 'RU', 380: 'IT', 724: 'ES',
  484: 'MX', 710: 'ZA', 682: 'SA', 818: 'EG', 404: 'KE',
}

const NAMES: Record<string, string> = {
  JP: '日本', US: '米国', KR: '韓国', TW: '台湾', TH: 'タイ', VN: 'ベトナム',
  PH: 'フィリピン', ID: 'インドネシア', MY: 'マレーシア', SG: 'SG',
  IN: 'インド', CN: '中国', GB: '英国', DE: '独', FR: '仏',
  BR: 'ブラジル', NG: 'ナイジェリア', TR: 'トルコ', AE: 'UAE', AU: '豪州', CA: 'カナダ',
  RU: 'ロシア', IT: '伊', ES: '西', MX: 'メキシコ', ZA: '南ア',
}

const FLAGS: Record<string, string> = {
  JP: '🇯🇵', US: '🇺🇸', KR: '🇰🇷', TW: '🇹🇼', TH: '🇹🇭', VN: '🇻🇳',
  PH: '🇵🇭', ID: '🇮🇩', MY: '🇲🇾', SG: '🇸🇬', IN: '🇮🇳', CN: '🇨🇳',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', AU: '🇦🇺', CA: '🇨🇦',
}

export function MapView({ data, onCountryClick }: MapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'asia' | 'world'>('asia')
  const zoomRef = useRef<any>(null)
  const gRef = useRef<any>(null)

  const totalPosts = data.reduce((s, d) => s + d.count, 0)

  const render = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return
    const container = containerRef.current
    const svg = d3.select(svgRef.current)
    const width = container.clientWidth
    const height = container.clientHeight

    const countMap = new Map<string, number>()
    for (const d of data) countMap.set(d.country_code, d.count)
    const maxCount = d3.max(data, d => d.count) || 1
    const colorScale = d3.scaleSequential().domain([0, maxCount]).interpolator(d3.interpolateRgb('#1E1D1A', '#C84B2F'))

    svg.attr('width', width).attr('height', height)
    svg.selectAll('*').remove()

    // Remove old tooltip
    d3.select(container).selectAll('.r-map-tooltip').remove()

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#161512')

    const projection = d3.geoNaturalEarth1()
      .center(view === 'asia' ? [120, 30] : [0, 20])
      .scale(view === 'asia' ? width * 0.8 : width / 6)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)
    const g = svg.append('g')
    gRef.current = g

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => { g.attr('transform', event.transform) })
    svg.call(zoom)
    zoomRef.current = zoom

    // Tooltip
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'r-map-tooltip')
      .style('position', 'absolute')
      .style('background', '#222119')
      .style('border', '0.5px solid rgba(200,75,47,0.3)')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('font-family', "'DM Sans', sans-serif")
      .style('font-size', '12px')
      .style('color', '#fff')
      .style('z-index', '10')
      .style('min-width', '120px')
      .style('transition', 'opacity 0.15s')

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world: any) => {
      const countries = topojson.feature(world, world.objects.countries) as any

      g.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const a2 = numericToAlpha2[+d.id]
          if (!a2) return '#1E1D1A'
          return colorScale(countMap.get(a2) || 0)
        })
        .attr('stroke', 'rgba(255,255,255,0.06)')
        .attr('stroke-width', 0.3)
        .style('cursor', (d: any) => {
          const a2 = numericToAlpha2[+d.id]
          return a2 && countMap.get(a2) ? 'pointer' : 'default'
        })
        .on('mouseover', function (event: any, d: any) {
          const a2 = numericToAlpha2[+d.id]
          if (!a2) return
          const count = countMap.get(a2) || 0
          if (count === 0) return
          const pct = totalPosts > 0 ? ((count / totalPosts) * 100).toFixed(1) : '0'
          const flag = FLAGS[a2] || ''
          const name = NAMES[a2] || a2

          d3.select(this).attr('stroke', 'rgba(200,75,47,0.6)').attr('stroke-width', 0.8)
          tooltip.style('opacity', '1').html(`
            <div style="font-weight:600;margin-bottom:4px">${flag} ${name}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:10px;border-top:0.5px solid rgba(255,255,255,0.08);padding-top:4px;margin-top:4px">
              <div style="display:flex;justify-content:space-between;gap:16px">
                <span>投稿数</span>
                <span style="color:#C84B2F;font-family:'DM Mono',monospace">${count.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;gap:16px;margin-top:2px">
                <span>シェア</span>
                <span style="font-family:'DM Mono',monospace">${pct}%</span>
              </div>
            </div>
          `)
        })
        .on('mousemove', function (event: any) {
          const [mx, my] = d3.pointer(event, container)
          tooltip.style('left', `${mx + 12}px`).style('top', `${my - 10}px`)
        })
        .on('mouseout', function () {
          tooltip.style('opacity', '0')
          d3.select(this).attr('stroke', 'rgba(255,255,255,0.06)').attr('stroke-width', 0.3)
        })
        .on('click', function (_: any, d: any) {
          const a2 = numericToAlpha2[+d.id]
          if (!a2 || !countMap.get(a2)) return
          // Click ripple
          const centroid = projection(d3.geoCentroid(d))
          if (centroid) {
            const ripple = g.append('circle')
              .attr('cx', centroid[0]).attr('cy', centroid[1])
              .attr('r', 6).attr('fill', 'none')
              .attr('stroke', '#C84B2F').attr('stroke-width', 1.5)
              .attr('opacity', 1)
            ripple.transition().duration(800).ease(d3.easeCubicOut)
              .attr('r', 40).attr('opacity', 0)
              .on('end', () => ripple.remove())
          }
          onCountryClick?.(a2)
        })

      // Country labels (only for countries with posts)
      g.selectAll('.r-map-label')
        .data(countries.features.filter((d: any) => {
          const a2 = numericToAlpha2[+d.id]
          return a2 && (countMap.get(a2) || 0) > 0
        }))
        .enter()
        .append('text')
        .attr('class', 'r-map-label')
        .attr('transform', (d: any) => {
          const c = d3.geoCentroid(d)
          const p = projection(c)
          return p ? `translate(${p[0]},${p[1]})` : ''
        })
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', (d: any) => {
          const a2 = numericToAlpha2[+d.id]
          const count = a2 ? (countMap.get(a2) || 0) : 0
          return count > 100 ? '10px' : '8px'
        })
        .style('fill', 'rgba(255,255,255,0.6)')
        .style('pointer-events', 'none')
        .style('font-family', "'DM Sans', sans-serif")
        .text((d: any) => {
          const a2 = numericToAlpha2[+d.id]
          return a2 ? (NAMES[a2] || a2) : ''
        })

      // Pulse animation on top 3 countries
      const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 3)
      sorted.forEach(({ country_code }) => {
        const feat = countries.features.find((f: any) => numericToAlpha2[+f.id] === country_code)
        if (!feat) return
        const centroid = projection(d3.geoCentroid(feat))
        if (!centroid) return
        const [cx, cy] = centroid;

        [0, 0.7, 1.4].forEach(delay => {
          const circle = g.append('circle')
            .attr('cx', cx).attr('cy', cy)
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', '#C84B2F')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6)
            .attr('pointer-events', 'none')

          function pulse() {
            circle
              .attr('r', 4).attr('opacity', 0.6)
              .transition().delay(delay * 1000).duration(2000).ease(d3.easeCubicOut)
              .attr('r', 20).attr('opacity', 0)
              .on('end', pulse)
          }
          pulse()
        })
      })

      // Flow lines from Japan to other countries
      const jpFeature = countries.features.find((f: any) => numericToAlpha2[+f.id] === 'JP')
      if (jpFeature) {
        const jpCenter = projection(d3.geoCentroid(jpFeature))
        if (jpCenter) {
          const flowTargets = [...data].sort((a, b) => b.count - a.count)
            .filter(c => c.country_code !== 'JP' && c.count > 0)
            .slice(0, 8)

          flowTargets.forEach(({ country_code, count }, idx) => {
            const feat = countries.features.find((f: any) => numericToAlpha2[+f.id] === country_code)
            if (!feat) return
            const targetCenter = projection(d3.geoCentroid(feat))
            if (!targetCenter) return

            const src = jpCenter
            const dst = targetCenter
            const cp: [number, number] = [(src[0] + dst[0]) / 2, Math.min(src[1], dst[1]) - 40]
            const pathD = `M${src[0]},${src[1]} Q${cp[0]},${cp[1]} ${dst[0]},${dst[1]}`
            const opacity = Math.min(0.15 + count / 300, 0.6)
            const strokeWidth = Math.min(0.5 + count / 200, 2)

            // Base line
            g.append('path')
              .attr('d', pathD)
              .attr('fill', 'none')
              .attr('stroke', `rgba(200,75,47,${opacity * 0.5})`)
              .attr('stroke-width', 0.4)
              .attr('pointer-events', 'none')

            // Animated line
            const animPath = g.append('path')
              .attr('d', pathD)
              .attr('fill', 'none')
              .attr('stroke', '#C84B2F')
              .attr('stroke-width', strokeWidth)
              .attr('stroke-linecap', 'round')
              .attr('opacity', opacity)
              .attr('pointer-events', 'none')

            const len = (animPath.node() as SVGPathElement).getTotalLength()
            animPath.attr('stroke-dasharray', `${len * 0.15} ${len}`).attr('stroke-dashoffset', len)

            function loopAnim() {
              animPath
                .attr('stroke-dashoffset', len)
                .transition()
                .delay(idx * 400 + Math.random() * 1000)
                .duration(2000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', -len * 0.15)
                .on('end', loopAnim)
            }
            loopAnim()

            // Glow at destination
            const glow = g.append('circle')
              .attr('cx', dst[0]).attr('cy', dst[1])
              .attr('r', 3).attr('fill', '#C84B2F').attr('opacity', 0)
              .attr('pointer-events', 'none')

            function glowLoop() {
              glow.transition()
                .delay(idx * 400 + 1800 + Math.random() * 1000)
                .duration(300).attr('opacity', 0.9).attr('r', 5)
                .transition()
                .duration(400).attr('opacity', 0).attr('r', 3)
                .on('end', glowLoop)
            }
            glowLoop()
          })
        }
      }
    })
  }, [data, view, totalPosts, onCountryClick])

  useEffect(() => {
    render()
    const observer = new ResizeObserver(() => render())
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [render])

  function resetZoom() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  return (
    <div className="r-panel">
      <div className="r-panel-header">
        <span className="r-panel-title">拡散マップ</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className={`r-map-btn ${view === 'world' ? 'r-map-btn--active' : ''}`} onClick={() => { setView('world'); resetZoom() }}>世界全体</button>
          <button className={`r-map-btn ${view === 'asia' ? 'r-map-btn--active' : ''}`} onClick={() => { setView('asia'); resetZoom() }}>アジア</button>
        </div>
      </div>
      <div className="r-map-container" ref={containerRef} style={{ position: 'relative' }}>
        <svg ref={svgRef} style={{ display: 'block' }} />
      </div>
    </div>
  )
}
