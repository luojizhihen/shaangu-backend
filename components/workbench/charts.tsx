'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  DEPT_POINTS,
  FEEDBACK_CLOSURE,
  FORUM_GOVERNANCE,
  POINTS_TREND,
  READ_TREND,
  READ_TREND_30,
  STAFF_TREND,
} from '@/lib/mock'

const axis = {
  stroke: '#5F6B78',
  fontSize: 12,
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #D8E0E8',
  fontSize: 12,
}

export type TrendRow = {
  date: string
  资讯阅读: number
  视听播放: number
  互动: number
}

export function ReadTrendChart({
  range = '7d',
  data: override,
}: {
  range?: '7d' | '30d'
  data?: TrendRow[]
}) {
  const data = override ?? (range === '30d' ? READ_TREND_30 : READ_TREND)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={axis}
          interval={range === '30d' ? 3 : 0}
        />
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

export function PointsChart({
  data = POINTS_TREND,
}: {
  data?: { month: string; 获取: number; 消耗: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
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

/** 员工变化：入职与离职为柱，在册人数为折线（右轴） */
export function StaffTrendChart({
  data = STAFF_TREND,
}: {
  data?: { month: string; 在册: number; 入职: number; 离职: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axis} />
        <YAxis tickLine={false} axisLine={false} tick={axis} width={44} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={axis}
          width={52}
          domain={['dataMin - 80', 'dataMax + 80']}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="入职" fill="#014081" radius={[2, 2, 0, 0]} barSize={14} />
        <Bar dataKey="离职" fill="#9FB3C2" radius={[2, 2, 0, 0]} barSize={14} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="在册"
          stroke="#008361"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/** 论坛治理：敏感词命中、删除与申诉三类处置量 */
export function ForumGovernanceChart({
  data = FORUM_GOVERNANCE,
}: {
  data?: { month: string; 敏感词命中: number; 删除: number; 申诉: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axis} />
        <YAxis tickLine={false} axisLine={false} tick={axis} width={44} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="敏感词命中" stackId="g" fill="#014081" barSize={18} />
        <Bar dataKey="删除" stackId="g" fill="#008361" barSize={18} />
        <Bar dataKey="申诉" stackId="g" fill="#C8801A" radius={[2, 2, 0, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** 反馈闭环率：新增与办结为柱，闭环率为折线（右轴百分比） */
export function FeedbackClosureChart({
  data = FEEDBACK_CLOSURE,
}: {
  data?: { month: string; 新增: number; 办结: number; 闭环率: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#E7EDF3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axis} />
        <YAxis tickLine={false} axisLine={false} tick={axis} width={40} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={axis}
          width={46}
          domain={[60, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, name) => (name === '闭环率' ? `${v}%` : v)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="新增" fill="#9FB3C2" radius={[2, 2, 0, 0]} barSize={14} />
        <Bar dataKey="办结" fill="#014081" radius={[2, 2, 0, 0]} barSize={14} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="闭环率"
          stroke="#008361"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function DeptPointsChart({
  data = DEPT_POINTS,
}: {
  data?: { dept: string; 积分: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-[13px] text-muted-foreground">
        当前筛选条件下暂无部门积分数据
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
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
