import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Globe, Play, Trash2, Flag, User, Settings, ChevronRight, 
  Activity, BarChart3, Clock, Star, FileText, Shield, Bell
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { listWorlds, deleteWorld, type WorldMetadata } from '@/utils/worldStorage';
import { getWorldActivity, recordWorldEvent } from '@/utils/worldActivity';
import CustomButton from '@/components/CustomButton';
import MenuOverlayController from '@/components/MenuOverlayController';

type TabId = 'account' | 'worlds' | 'activity' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof User;
}

const tabs: Tab[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'worlds', label: 'Worlds', icon: Globe },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [worlds, setWorlds] = useState<WorldMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('worlds');

  useEffect(() => {
    const loadWorlds = async () => {
      setIsLoading(true);
      try {
        const data = await listWorlds();
        setWorlds(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorlds();

    const handleWorldsUpdated = () => loadWorlds();
    window.addEventListener('questly:worlds-updated', handleWorldsUpdated);

    return () => {
      window.removeEventListener('questly:worlds-updated', handleWorldsUpdated);
    };
  }, []);

  const handleDelete = async (worldId: string) => {
    if (!confirm('Delete this world? This cannot be undone.')) return;
    await deleteWorld(worldId);
    recordWorldEvent(worldId, 'deleted');
    const data = await listWorlds();
    setWorlds(data);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const accountLabel = isAuthenticated ? user?.displayName || user?.email || 'Creator' : 'Guest';
  const accountEmail = isAuthenticated ? user?.email || 'No email' : 'Guest account';

  // Calculate activity stats
  const activityStats = useMemo(() => {
    const totalPlays = worlds.reduce((sum, world) => {
      const activity = getWorldActivity(world.id);
      return sum + (activity?.plays || 0);
    }, 0);
    
    const recentlyPlayed = worlds.filter(world => {
      const activity = getWorldActivity(world.id);
      if (!activity?.lastPlayedAt) return false;
      const daysSince = (Date.now() - activity.lastPlayedAt) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    const totalReports = worlds.filter(world => {
      const activity = getWorldActivity(world.id);
      return !!activity?.reportedAt;
    }).length;

    return {
      totalPlays,
      recentlyPlayed,
      totalReports,
      totalWorlds: worlds.length,
    };
  }, [worlds]);

  const worldCards = useMemo(() => {
    if (worlds.length === 0) {
      return (
        <div className="text-slate-400 text-center py-12">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No worlds saved yet</p>
          <p className="text-sm">Create one to see it here.</p>
          <CustomButton
            onClick={() => navigate('/quest-type')}
            className="mt-4"
          >
            Create New Quest
          </CustomButton>
        </div>
      );
    }

    return worlds.map((world) => {
      const activity = getWorldActivity(world.id);
      const playedLabel = activity?.lastPlayedAt ? formatDate(activity.lastPlayedAt) : 'Not played yet';
      const deletedLabel = activity?.deletedAt ? formatDate(activity.deletedAt) : null;
      const reportedLabel = activity?.reportedAt ? formatDate(activity.reportedAt) : null;

      return (
        <motion.div
          key={world.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex gap-4 items-center hover:border-slate-600 transition"
        >
          <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            {world.thumbnail ? (
              <img src={world.thumbnail} alt={world.name} className="w-full h-full object-cover" />
            ) : (
              <Globe className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <h3 className="text-white font-bold truncate">{world.name}</h3>
                <p className="text-xs text-slate-400">
                  Updated {formatDate(world.updatedAt)} • {world.worldType || 'openWorld'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/quest-builder?worldId=${world.id}`)}
                className="text-slate-300 hover:text-white text-sm flex items-center gap-1 flex-shrink-0 ml-2"
              >
                Open <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {activity?.plays ?? 0} plays
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {playedLabel}
              </span>
              {deletedLabel && (
                <span className="text-red-400 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  Deleted: {deletedLabel}
                </span>
              )}
              {reportedLabel && (
                <span className="text-amber-300 flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  Reported: {reportedLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                recordWorldEvent(world.id, 'played');
                navigate(`/quest-builder?worldId=${world.id}`);
              }}
              className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition"
              title="Play world"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => recordWorldEvent(world.id, 'reported')}
              className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
              title="Report feedback"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(world.id)}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              title="Delete world"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      );
    });
  }, [navigate, worlds]);

  // Activity timeline
  const activityTimeline = useMemo(() => {
    const activities: Array<{
      id: string;
      worldId: string;
      worldName: string;
      type: 'played' | 'created' | 'updated' | 'deleted' | 'reported';
      timestamp: number;
    }> = [];

    worlds.forEach((world) => {
      const activity = getWorldActivity(world.id);
      
      if (world.createdAt) {
        activities.push({
          id: `${world.id}-created`,
          worldId: world.id,
          worldName: world.name,
          type: 'created',
          timestamp: world.createdAt,
        });
      }

      if (world.updatedAt && world.updatedAt !== world.createdAt) {
        activities.push({
          id: `${world.id}-updated`,
          worldId: world.id,
          worldName: world.name,
          type: 'updated',
          timestamp: world.updatedAt,
        });
      }

      if (activity?.lastPlayedAt) {
        activities.push({
          id: `${world.id}-played`,
          worldId: world.id,
          worldName: world.name,
          type: 'played',
          timestamp: activity.lastPlayedAt,
        });
      }

      if (activity?.deletedAt) {
        activities.push({
          id: `${world.id}-deleted`,
          worldId: world.id,
          worldName: world.name,
          type: 'deleted',
          timestamp: activity.deletedAt,
        });
      }

      if (activity?.reportedAt) {
        activities.push({
          id: `${world.id}-reported`,
          worldId: world.id,
          worldName: world.name,
          type: 'reported',
          timestamp: activity.reportedAt,
        });
      }
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }, [worlds]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Account Information</h2>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{accountLabel}</h3>
                    <p className="text-slate-400">{accountEmail}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account Type</span>
                    <span className="text-white font-medium">
                      {isAuthenticated ? 'Authenticated' : 'Guest'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Worlds</span>
                    <span className="text-white font-medium">{worlds.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Plays</span>
                    <span className="text-white font-medium">{activityStats.totalPlays}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-400 text-sm">Worlds</span>
                  </div>
                  <p className="text-2xl font-bold">{activityStats.totalWorlds}</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Play className="w-5 h-5 text-emerald-400" />
                    <span className="text-slate-400 text-sm">Total Plays</span>
                  </div>
                  <p className="text-2xl font-bold">{activityStats.totalPlays}</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-slate-400 text-sm">Recent Activity</span>
                  </div>
                  <p className="text-2xl font-bold">{activityStats.recentlyPlayed}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'worlds':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Worlds</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Manage and play your created worlds
                </p>
              </div>
              <CustomButton onClick={() => navigate('/quest-type')}>
                Create New Quest
              </CustomButton>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-slate-400 mt-4">Loading worlds...</p>
              </div>
            ) : (
              <div className="space-y-3">{worldCards}</div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Activity Timeline</h2>
              <p className="text-slate-400 text-sm mb-6">
                Recent activity across all your worlds
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              {activityTimeline.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityTimeline.map((activity) => {
                    const Icon = {
                      played: Play,
                      created: Globe,
                      updated: Clock,
                      deleted: Trash2,
                      reported: Flag,
                    }[activity.type];

                    const color = {
                      played: 'text-emerald-400',
                      created: 'text-blue-400',
                      updated: 'text-amber-400',
                      deleted: 'text-red-400',
                      reported: 'text-orange-400',
                    }[activity.type];

                    const label = {
                      played: 'Played',
                      created: 'Created',
                      updated: 'Updated',
                      deleted: 'Deleted',
                      reported: 'Reported',
                    }[activity.type];

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 pb-4 border-b border-slate-700 last:border-0 last:pb-0"
                      >
                        <div className={`p-2 rounded-lg bg-slate-700/60 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium truncate">
                              {label}: {activity.worldName}
                            </p>
                            <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                              {formatDateTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-slate-400 text-sm mb-6">
                Manage your dashboard preferences
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Data Storage</h3>
                  <p className="text-slate-400 text-sm">All data is stored locally in your browser</p>
                </div>
                <Shield className="w-5 h-5 text-slate-400" />
              </div>

              <div className="pt-4 border-t border-slate-700">
                <CustomButton
                  onClick={() => navigate('/settings')}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Open Full Settings
                </CustomButton>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">About</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Questly Player Dashboard</p>
                <p>Version 1.0.0</p>
                <p className="pt-2">
                  Your worlds and activity are stored locally in your browser. 
                  To sync across devices, sign in with an account.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif">Player Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage your worlds, track activity, and customize your experience
              </p>
            </div>
            <div className="flex gap-2">
              <CustomButton onClick={() => navigate('/menu')} variant="secondary">
                Back to Menu
              </CustomButton>
            </div>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-help-id={`${tab.id}-tab`}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                        ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Avatar Controller */}
      <MenuOverlayController />
    </div>
  );
}
