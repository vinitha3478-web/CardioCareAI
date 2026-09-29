import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

const FeatureInfluenceChart = ({ data = [], height = 320 }) => {
  // Format data for Recharts
  const chartData = data.map(item => ({
    name: item.feature || item.name,
    weight: item.weight !== undefined ? item.weight : item.coefficient,
    impact: item.impact || (item.coefficient > 0 ? "Increases Risk" : "Decreases Risk")
  }));

  return (
    <div className="feature-chart-container" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d6f2" horizontal={false} />
          <XAxis type="number" stroke="#6e6785" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#2a2538" fontSize={12} width={70} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const row = payload[0].payload;
                return (
                  <div className="neu-card-flat tooltip-card">
                    <p style={{ fontWeight: 700, color: '#6c47ff' }}>{row.name}</p>
                    <p style={{ fontSize: '0.85rem' }}>Impact Weight: <b>{row.weight}</b></p>
                    <p style={{ fontSize: '0.8rem', color: '#6e6785' }}>{row.impact}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="#8884d8" />
          <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.weight > 0 ? "#e53e3e" : "#38a169"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureInfluenceChart;
