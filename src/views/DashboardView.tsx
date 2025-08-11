import React, { useState, useEffect } from 'react';
import { HeartIcon, UsersIcon, ShieldIcon, SparkleIcon, TrendingUpIcon, BookIcon } from '../components/icons.dynamic';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.FC<any>;
  color: string;
  href: string;
  stats?: {
    label: string;
    value: string;
  };
}

const DashboardView: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    // Get time of day greeting
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Good morning');
    else if (hour < 17) setTimeOfDay('Good afternoon');
    else setTimeOfDay('Good evening');

    // Get user name (this would come from auth context in real app)
    setUserName('Friend');
  }, []);

  const dashboardCards: DashboardCard[] = [
    {
      id: 'crisis-support',
      title: 'Crisis Support',
      description: 'Immediate help and resources',
      icon: ShieldIcon,
      color: 'red',
      href: '/crisis',
      stats: {
        label: '24/7 Available',
        value: 'Always'
      }
    },
    {
      id: 'peer-support',
      title: 'Peer Support',
      description: 'Connect with others',
      icon: UsersIcon,
      color: 'blue',
      href: '/peer-support',
      stats: {
        label: 'Active Helpers',
        value: '200+'
      }
    },
    {
      id: 'wellness-tracking',
      title: 'Wellness Tracking',
      description: 'Monitor your mental health',
      icon: HeartIcon,
      color: 'pink',
      href: '/wellness',
      stats: {
        label: 'Current Streak',
        value: '5 days'
      }
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Talk to our AI companion',
      icon: SparkleIcon,
      color: 'purple',
      href: '/ai-assistant',
      stats: {
        label: 'Conversations',
        value: '12'
      }
    },
    {
      id: 'reflections',
      title: 'Reflections',
      description: 'Daily journaling and insights',
      icon: BookIcon,
      color: 'green',
      href: '/reflections',
      stats: {
        label: 'This Week',
        value: '3 entries'
      }
    },
    {
      id: 'progress',
      title: 'Progress Insights',
      description: 'View your wellness trends',
      icon: TrendingUpIcon,
      color: 'indigo',
      href: '/analytics',
      stats: {
        label: 'Overall Trend',
        value: '↗ Improving'
      }
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      pink: 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
      purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      indigo: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {timeOfDay}, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome to your mental wellness dashboard. How are you feeling today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Check-ins This Week
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">5</p>
            <p className="text-sm text-green-600 dark:text-green-400">+2 from last week</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Mood Average
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">7.2/10</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Stable trend</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Support Connections
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">18</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Active helpers</p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <button
                key={card.id}
                className={`border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left ${getColorClasses(card.color)}`}
                onClick={() => {
                  // In a real app, this would use React Router
                  console.log(`Navigate to ${card.href}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    console.log(`Navigate to ${card.href}`);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <IconComponent className="w-8 h-8" />
                  {card.stats && (
                    <div className="text-right">
                      <p className="text-xs opacity-75">{card.stats.label}</p>
                      <p className="text-sm font-semibold">{card.stats.value}</p>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {card.title}
                </h3>
                
                <p className="text-sm opacity-80">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <HeartIcon className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Wellness check-in completed
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <SparkleIcon className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  AI conversation: Stress management tips
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Yesterday</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <UsersIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Connected with new peer support helper
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">2 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Need Immediate Help?
              </h3>
              <p className="text-red-700 dark:text-red-300">
                Crisis support is available 24/7. You're not alone.
              </p>
            </div>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              onClick={() => console.log('Navigate to /crisis')}
            >
              Get Help Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
