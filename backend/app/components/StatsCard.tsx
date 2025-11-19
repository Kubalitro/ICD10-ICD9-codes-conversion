'use client'

interface StatsCardProps {
  icon: string
  title: string
  value: string | number
  description: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export default function StatsCard({ icon, title, value, description, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
  }
  
  return (
    <div className="card hover-scale animate-scaleIn">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center text-3xl flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  )
}
