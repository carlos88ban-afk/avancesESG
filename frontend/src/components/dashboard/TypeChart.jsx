import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['hsl(215, 80%, 48%)', 'hsl(168, 76%, 42%)', 'hsl(262, 60%, 55%)'];

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const renderLabel = ({ cx, cy, midAngle, outerRadius, payload }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 32;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? 'start' : 'end';
  return (
    <text fontSize={11} textAnchor={anchor}>
      <tspan x={x} y={y - 7} fontWeight="600" fill="hsl(220, 9%, 30%)">{capitalize(payload.type)}</tspan>
      <tspan x={x} y={y + 8} fill="hsl(220, 9%, 46%)">{payload.percentage}% · {payload.completed}/{payload.total}</tspan>
    </text>
  );
};

export default function TypeChart({ data }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Avance por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={82}
                dataKey="completed"
                nameKey="type"
                paddingAngle={4}
                strokeWidth={0}
                label={renderLabel}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [`${value}/${props.payload.total} completados`, name]}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value) => <span className="text-sm capitalize">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
