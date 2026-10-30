import { useMemo } from "react";
import { formatDuration } from "../format";
import "./TimeSeriesChart.css";

const WIDTH = 600;
const HEIGHT = 170;
const MARGIN = { top: 12, right: 12, bottom: 26, left: 58 };

function TimeSeriesChart({ title, unit, times, values, duration, currentTime, color }) {
  const chart = useMemo(() => {
    if (!times.length || !values.length || !duration) {
      return null;
    }

    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    let min = Math.min(...values);
    let max = Math.max(...values);
    if (max - min < 1e-6) {
      min -= 1;
      max += 1;
    }
    const padding = (max - min) * 0.05;
    min -= padding;
    max += padding;

    const toX = (time) => MARGIN.left + (time / duration) * plotWidth;
    const toY = (value) => MARGIN.top + (1 - (value - min) / (max - min)) * plotHeight;

    const points = times
      .map((time, index) => `${toX(time).toFixed(1)},${toY(values[index]).toFixed(1)}`)
      .join(" ");

    return { points, min, max, plotWidth, plotHeight, toX };
  }, [times, values, duration]);

  if (!chart) {
    return null;
  }

  const playheadX = chart.toX(Math.min(currentTime, duration));

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
        <rect
          className="chart-frame"
          x={MARGIN.left}
          y={MARGIN.top}
          width={chart.plotWidth}
          height={chart.plotHeight}
        />
        <polyline className="chart-line" points={chart.points} stroke={color} />
        {currentTime > 0 && (
          <line
            className="chart-playhead"
            x1={playheadX}
            x2={playheadX}
            y1={MARGIN.top}
            y2={MARGIN.top + chart.plotHeight}
          />
        )}
        <text className="chart-label" x={MARGIN.left - 6} y={MARGIN.top + 4} textAnchor="end">
          {Math.round(chart.max)} {unit}
        </text>
        <text
          className="chart-label"
          x={MARGIN.left - 6}
          y={MARGIN.top + chart.plotHeight}
          textAnchor="end"
        >
          {Math.round(chart.min)} {unit}
        </text>
        <text className="chart-label" x={MARGIN.left} y={HEIGHT - 6}>
          0:00
        </text>
        <text className="chart-label" x={WIDTH - MARGIN.right} y={HEIGHT - 6} textAnchor="end">
          {formatDuration(duration)}
        </text>
      </svg>
    </figure>
  );
}

export default TimeSeriesChart;