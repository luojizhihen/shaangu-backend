'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DEPT_POINTS, POINTS_TREND, READ_TREND } from '@/lib/mock'

const axis = {
  stroke: '#5F6B78',
  fontSize: 12,
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #D8E0E8',
  fontSize: 12,
}

export function ReadTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={READ_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axis} />
        <YAxis tickLine={false} axisLine={false} tick={axis} width={52} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="资讯阅读"
          stroke="#014081"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="视听播放"
          stroke="#008361"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="互动"
          stroke="#9FB3C2"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PointsChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={POINTS_TREND} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axis} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axis}
          width={56}
          tickFormatter={(v: number) => `${v / 1000}k`}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="获取" fill="#014081" radius={[2, 2, 0, 0]} barSize={16} />
        <Bar dataKey="消耗" fill="#008361" radius={[2, 2, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DeptPointsChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={DEPT_POINTS}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke="#E7EDF3" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={axis}
          tickFormatter={(v: number) => `${v / 1000}k`}
        />
        <YAxis
          type="category"
          dataKey="dept"
          tickLine={false}
          axisLine={false}
          tick={axis}
          width={78}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="积分" fill="#014081" radius={[0, 2, 2, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}
