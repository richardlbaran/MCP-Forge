import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Scissors,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Video,
  ArrowRight,
  Zap,
  BarChart3,
  Upload,
  CheckCircle,
  Flame,
  Youtube,
  Instagram,
} from 'lucide-react';

// Platform icon component
function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, { icon: typeof Youtube; color: string }> = {
    youtube: { icon: Youtube, color: 'text-red-500' },
    tiktok: { icon: Video, color: 'text-white' },
    instagram: { icon: Instagram, color: 'text-pink-500' },
    shorts: { icon: Play, color: 'text-red-400' },
  };
  
  const config = icons[platform] || { icon: Video, color: 'text-forge-text-muted' };
  const Icon = config.icon;
  
  return <Icon className={`w-4 h-4 ${config.color}`} />;
}

// Quick action button
function QuickAction({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: typeof Play; 
  label: string; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="forge-card-hover p-4 flex flex-col items-center justify-center gap-2 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-forge-surface flex items-center justify-center">
        <Icon className="w-6 h-6 text-forge-text-muted" />
      </div>
      <span className="text-sm text-forge-text">{label}</span>
    </button>
  );
}

// Pipeline stage component
function PipelineStage({ 
  label, 
  count, 
  color 
}: { 
  label: string; 
  count: number; 
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-2`}>
        <span className="text-xl font-bold text-white">{count}</span>
      </div>
      <span className="text-xs text-forge-text-muted">{label}</span>
    </div>
  );
}

// Platform performance bar
function PlatformBar({ 
  platform, 
  views, 
  maxViews, 
  change 
}: { 
  platform: string; 
  views: number; 
  maxViews: number; 
  change: number;
}) {
  const percentage = (views / maxViews) * 100;
  const colors: Record<string, string> = {
    youtube: 'bg-red-500',
    tiktok: 'bg-white',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    shorts: 'bg-red-400',
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 flex items-center gap-2">
        <PlatformIcon platform={platform} />
        <span className="text-sm text-forge-text-secondary capitalize">{platform}</span>
      </div>
      <div className="flex-1 h-2 bg-forge-bg rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${colors[platform] || 'bg-forge-accent'}`}
        />
      </div>
      <div className="w-24 text-right">
        <span className="text-sm text-forge-text">{formatViews(views)}</span>
        <span className={`text-xs ml-2 ${change >= 0 ? 'text-forge-success' : 'text-forge-error'}`}>
          {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

// Format large numbers
function formatViews(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Trending item
function TrendingItem({ rank, text }: { rank: number; text: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-forge-accent font-mono">#{rank}</span>
      <span className="text-sm text-forge-text truncate">{text}</span>
    </div>
  );
}

export function CreatorDashboard() {
  // Mock data - in real app, this would come from stores/APIs
  const [stats] = useState({
    subscribers: 42847,
    subscriberChange: 2.3,
    weeklyGrowth: 12.4,
    revenue: 4892,
    revenueChange: 18,
    videosPerMonth: 23,
  });
  
  const [pipeline] = useState({
    filming: 2,
    processing: 3,
    scheduled: 8,
    posted: 45,
    total: 156,
  });
  
  const [platformStats] = useState([
    { platform: 'youtube', views: 847000, change: 23 },
    { platform: 'tiktok', views: 1200000, change: 45 },
    { platform: 'instagram', views: 234000, change: -8 },
    { platform: 'shorts', views: 2100000, change: 67 },
  ]);
  
  const [trending] = useState([
    '"Day in my life" format',
    'Sound: "original audio xyz"',
    'Competitor @xyz posted 500K',
    'Rising hashtag: #techsetup',
  ]);
  
  const [suggestions] = useState([
    'Your "how-to" videos get 3x more saves. Consider a tutorial series.',
    'Best posting time for your audience: Tue/Thu 6pm EST',
  ]);
  
  const maxViews = Math.max(...platformStats.map(p => p.views));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-forge-text">Creator Command Center</h1>
          <p className="text-sm text-forge-text-secondary mt-1">
            Your content empire at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="forge-btn-secondary">
            <BarChart3 className="w-4 h-4" />
            Full Analytics
          </button>
          <button className="forge-btn-primary">
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="forge-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-forge-text">
                {formatViews(stats.subscribers)}
              </p>
              <p className="text-sm text-forge-text-secondary">Subscribers</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center">
              <Users className="w-5 h-5 text-forge-text-muted" />
            </div>
          </div>
          <div className="mt-3 text-xs text-forge-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{stats.subscriberChange}k this week
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="forge-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-forge-text">+{stats.weeklyGrowth}%</p>
              <p className="text-sm text-forge-text-secondary">This Week</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-forge-text-muted" />
            </div>
          </div>
          <div className="mt-3 text-xs text-forge-text-muted">
            vs +8.1% last week
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="forge-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-forge-text">${stats.revenue.toLocaleString()}</p>
              <p className="text-sm text-forge-text-secondary">Revenue</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-forge-text-muted" />
            </div>
          </div>
          <div className="mt-3 text-xs text-forge-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{stats.revenueChange}% MoM
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="forge-card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-forge-text">{stats.videosPerMonth}</p>
              <p className="text-sm text-forge-text-secondary">Videos/Mo</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-forge-surface flex items-center justify-center">
              <Video className="w-5 h-5 text-forge-text-muted" />
            </div>
          </div>
          <div className="mt-3 text-xs text-forge-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            ↑ from 6
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-medium text-forge-text-secondary uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-6 gap-3">
          <QuickAction icon={Play} label="Process Video" />
          <QuickAction icon={Scissors} label="Create Clips" />
          <QuickAction icon={BarChart3} label="Weekly Report" />
          <QuickAction icon={Calendar} label="Schedule" />
          <QuickAction icon={Flame} label="Trending" />
          <QuickAction icon={MessageSquare} label="Comments" />
        </div>
      </motion.div>

      {/* Content Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="forge-card p-6"
      >
        <h3 className="font-medium text-forge-text mb-6">Content Pipeline</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PipelineStage label="Filming" count={pipeline.filming} color="bg-yellow-500" />
            <ArrowRight className="w-4 h-4 text-forge-text-muted" />
            <PipelineStage label="Processing" count={pipeline.processing} color="bg-blue-500" />
            <ArrowRight className="w-4 h-4 text-forge-text-muted" />
            <PipelineStage label="Scheduled" count={pipeline.scheduled} color="bg-purple-500" />
            <ArrowRight className="w-4 h-4 text-forge-text-muted" />
            <PipelineStage label="Posted" count={pipeline.posted} color="bg-green-500" />
            <ArrowRight className="w-4 h-4 text-forge-text-muted" />
            <PipelineStage label="Total" count={pipeline.total} color="bg-forge-accent" />
          </div>
        </div>
      </motion.div>

      {/* Platform Performance & Trending */}
      <div className="grid grid-cols-3 gap-6">
        {/* Platform Performance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-2 forge-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-forge-text">Platform Performance (7 days)</h3>
            <span className="text-xs text-forge-text-muted">Views</span>
          </div>
          <div className="space-y-4">
            {platformStats.map((stat) => (
              <PlatformBar
                key={stat.platform}
                platform={stat.platform}
                views={stat.views}
                maxViews={maxViews}
                change={stat.change}
              />
            ))}
          </div>
        </motion.div>

        {/* Trending & Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          {/* Trending */}
          <div className="forge-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-forge-error" />
              <h3 className="font-medium text-forge-text text-sm">Trending in Your Niche</h3>
            </div>
            <div className="space-y-1">
              {trending.map((item, i) => (
                <TrendingItem key={i} rank={i + 1} text={item} />
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="forge-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-forge-accent" />
              <h3 className="font-medium text-forge-text text-sm">AI Suggestions</h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <p key={i} className="text-sm text-forge-text-secondary">{suggestion}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fleet Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="forge-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-forge-success" />
              <span className="text-sm text-forge-text">42 servers</span>
            </div>
            <div className="w-px h-4 bg-forge-border" />
            <span className="text-sm text-forge-text-secondary">40 healthy</span>
            <span className="text-sm text-forge-text-secondary">2 processing</span>
            <div className="w-px h-4 bg-forge-border" />
            <span className="text-sm text-forge-text-secondary">$23.45/mo</span>
            <span className="text-sm text-forge-text-secondary">156K tokens today</span>
          </div>
          <Link to="/fleet" className="text-sm text-forge-accent hover:underline flex items-center gap-1">
            Manage Fleet <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
