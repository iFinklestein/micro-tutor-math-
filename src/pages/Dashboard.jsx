
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  Play, Repeat, Check, Trophy, Star, TrendingUp, Sparkles, BookOpen, Loader2,
  Footprints, Target, BrainCircuit, CalendarCheck, Flame, Zap, AlertCircle, Settings
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatsManager } from '../components/utils/StatsManager';

const iconMap = {
  Footprints,
  Target,
  BrainCircuit,
  TrendingUp,
  Sparkles,
  CalendarCheck,
  Flame,
  Trophy,
  Zap,
  Star
};

const StatCard = ({ title, value, icon: Icon, color, suffix }) => (
  <Card style={{ background: '#111827', borderColor: '#374151', color: '#f9fafb' }} className="rounded-xl shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium" style={{ color: '#9ca3af' }}>{title}</CardTitle>
      {Icon && <Icon className="h-5 w-5" style={{ color: color || '#9ca3af' }} />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
        {String(value)}{suffix || ''}
      </div>
    </CardContent>
  </Card>
);

const AchievementBadge = ({ achievement }) => {
  const Icon = iconMap[achievement.badgeIcon] || Star;
  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg" style={{ background: '#1f2937' }}>
      <div className="p-2 bg-yellow-400/20 rounded-full">
        <Icon className="w-6 h-6 text-yellow-500" />
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: '#f9fafb' }}>{achievement.name}</p>
        <p className="text-xs" style={{ color: '#9ca3af' }}>{achievement.description}</p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardWithRetries = useCallback(async (retries = 10) => {
    if (retries === 10) {
      setIsLoading(true);
      setError(null);
    }

    if (retries <= 0) {
      console.error("Failed to load Dashboard data after multiple retries.");
      setError("Could not connect to the data service. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      const { Skill } = await import("@/api/entities");
      if (!Skill || typeof Skill.list !== 'function') {
        throw new Error("Entities not yet initialized.");
      }

      const { UserPrefs } = await import("@/api/entities");
      const { UserStats } = await import("@/api/entities");
      const { Attempt } = await import("@/api/entities");
      const { ReviewItem } = await import("@/api/entities");
      const { Achievement } = await import("@/api/entities");

      const skills = await Skill.list();
      if (skills.length === 0) {
        setNeedsSetup(true);
        setIsLoading(false);
        return;
      }

      const prefsList = await UserPrefs.list();
      let prefs = prefsList[0] || await UserPrefs.create({ gradeBand: '3-5', dailyGoal: 20, theme: 'auto' });

      const statsList = await UserStats.list();
      let userStats = statsList[0] || await UserStats.create({ currentStreak: 0, bestStreak: 0, totalAnswers: 0, correctAnswers: 0 });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      const [
        todayAttempts,
        allAttempts,
        dueReviews,
        allAchievements
      ] = await Promise.all([
        Attempt.filter({ created_date: { $gte: startOfToday } }),
        Attempt.list('-created_date', 500),
        ReviewItem.filter({ nextDueDate: { $lte: new Date().toISOString() }, mastered: false }),
        Achievement.list('-unlockedDate')
      ]);

      const topSkills = skills.slice(0, 6);
      
      const statsResult = StatsManager.recalcStats(allAttempts, prefs);
      const todayProgress = statsResult.attemptsToday;
      const dailyGoal = prefs.dailyGoal;

      const accuracyData = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.toISOString().split('T')[0];
        const dayAttempts = allAttempts.filter(a => a.created_date && a.created_date.startsWith(day));
        const accuracy = dayAttempts.length > 0
          ? (dayAttempts.filter(a => a.correct).length / dayAttempts.length) * 100
          : 0;
        return { name: day.slice(5), accuracy: Math.round(accuracy) };
      }).reverse();

      const skillStats = skills.map(skill => {
        const skillAttempts = allAttempts.filter(a => a.skillId === skill.id);
        const accuracy = skillAttempts.length > 0
          ? (skillAttempts.filter(a => a.correct).length / skillAttempts.length) * 100
          : 0;
        return { name: skill.name, accuracy: Math.round(accuracy), attempts: skillAttempts.length };
      });

      setDashboardData({
        prefs,
        userStats,
        topSkills,
        todayProgress,
        dailyGoal,
        dueReviewsCount: dueReviews.length,
        accuracyData,
        skillStats,
        achievements: allAchievements, // Fix: Changed 'achievements' to 'allAchievements'
        realTimeStats: statsResult
      });

      setIsLoading(false);
    } catch (e) {
      console.warn(`Dashboard loading attempt failed (retries left: ${retries - 1}):`, e.message);
      setTimeout(() => loadDashboardWithRetries(retries - 1), 1500);
    }
  }, []);

  useEffect(() => {
    loadDashboardWithRetries();
    
    const handleAttemptSaved = () => {
      loadDashboardWithRetries();
    };
    
    window.addEventListener('attempt:saved', handleAttemptSaved);
    return () => window.removeEventListener('attempt:saved', handleAttemptSaved);
  }, [loadDashboardWithRetries]);

  const setupInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { DataSeeder } = await import("../components/data/DataSeeder");

      await DataSeeder.seedSkills();
      await DataSeeder.seedQuestions();

      await loadDashboardWithRetries();
    } catch (error) {
      console.error("Error setting up initial data:", error);
      setError("Failed to set up initial learning content. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0f172a', color: '#f9fafb' }}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#60a5fa'}} />
          <p style={{ color: '#9ca3af' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="container mx-auto p-4 md:p-8" style={{ background: '#0f172a', color: '#f9fafb' }}>
        <div className="max-w-2xl mx-auto text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription style={{ color: '#f9fafb' }}>
              Welcome to Micro Tutor! Let's set up your learning environment with some initial content.
            </AlertDescription>
          </Alert>

          <div className="mt-8">
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#f9fafb' }}>Welcome to Micro Tutor!</h1>
            <p className="mb-8" style={{ color: '#9ca3af' }}>
              Click the button below to set up your math skills and questions.
            </p>
            <Button onClick={setupInitialData} size="lg" style={{ background: '#60a5fa', color: '#0b1220' }}>
              <Play className="h-5 w-5 mr-2" />
              Set Up Learning Content
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8" style={{ background: '#0f172a', color: '#f9fafb' }}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription style={{ color: '#f9fafb' }}>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-4 md:p-8" style={{ background: '#0f172a', color: '#f9fafb' }}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription style={{ color: '#f9fafb' }}>
            Unable to load dashboard data. Please refresh the page or check your connection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    prefs,
    userStats,
    topSkills,
    todayProgress,
    dailyGoal,
    dueReviewsCount,
    accuracyData,
    skillStats,
    achievements,
    realTimeStats
  } = dashboardData;

  // Cap daily progress display at the goal
  const shownToday = Math.min(realTimeStats?.attemptsToday || todayProgress, dailyGoal);
  const progressPercentage = dailyGoal > 0 ? Math.min((shownToday / dailyGoal) * 100, 100) : 0;

  return (
    <div className="container mx-auto p-4 md:p-8" style={{ background: '#0f172a', color: '#f9fafb' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold" style={{ color: '#f9fafb' }}>Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Settings"))}
            className="ml-4"
            style={{ color: '#f9fafb' }}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate(createPageUrl('Practice'))} style={{ background: '#60a5fa', color: '#0b1220' }}>
            <Play className="h-5 w-5 mr-2" /> Start Practice
          </Button>
          {dueReviewsCount > 0 && (
            <Button variant="outline" onClick={() => navigate(createPageUrl('Review'))} style={{ borderColor: '#374151', color: '#f9fafb', background: '#111827' }}>
              <Repeat className="h-5 w-5 mr-2" /> Review ({dueReviewsCount})
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Daily Goal"
          value={shownToday}
          suffix={`/${dailyGoal}`}
          icon={Check}
          color="#22c55e"
        />
        <StatCard
          title="Current Streak"
          value={userStats.currentStreak || 0}
          icon={TrendingUp}
          color="#60a5fa"
        />
        <StatCard
          title="Best Streak"
          value={userStats.bestStreak || 0}
          icon={Trophy}
          color="#facc15"
        />
        <StatCard
          title="Total Attempts"
          value={realTimeStats?.totalAttempts || userStats.totalAnswers || 0}
          icon={Sparkles}
          color="#a78bfa"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2 rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
          <CardHeader>
            <CardTitle style={{ color: '#f9fafb' }}>Daily Progress</CardTitle>
            <CardDescription style={{ color: '#9ca3af' }}>Your progress towards today's goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Progress value={progressPercentage} className="flex-grow" />
              <span className="text-sm font-medium">{shownToday}/{dailyGoal}</span>
            </div>
            {shownToday >= dailyGoal && (
              <p className="text-sm text-green-600 mt-2">Goal achieved for today! 🎉</p>
            )}
            <div className="mt-4 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ background: '#111827', borderColor: '#374151', color: '#f9fafb' }}
                    itemStyle={{ color: '#f9fafb' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#60a5fa" name="Accuracy (%)" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-sm" style={{ color: '#9ca3af' }}>Accuracy over last 14 days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
          <CardHeader>
            <CardTitle style={{ color: '#f9fafb' }}>Achievements</CardTitle>
            <CardDescription style={{ color: '#9ca3af' }}>Recent achievements you've unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="grid gap-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af' }} className="text-sm">No achievements unlocked yet. Keep practicing!</p>
            )}
            {achievements.length > 0 && (
              <Button variant="link" className="mt-4 p-0 h-auto" onClick={() => navigate(createPageUrl('Achievements'))} style={{ color: '#60a5fa' }}>
                View all achievements
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
          <CardHeader>
            <CardTitle style={{ color: '#f9fafb' }}>Top Skills to Practice</CardTitle>
            <CardDescription style={{ color: '#9ca3af' }}>Skills based on your current grade band.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {topSkills.length > 0 ? (
                topSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 rounded-md hover:opacity-80 transition-opacity" style={{ background: '#1f2937' }}>
                    <span className="font-medium" style={{ color: '#f9fafb' }}>{skill.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl(`Practice?skill=${skill.id}`))}
                      style={{ borderColor: '#374151', color: '#f9fafb', background: '#111827' }}
                    >
                      Practice <Play className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#9ca3af' }} className="text-sm">No skills found for your grade band.</p>
              )}
            </div>
            <Button variant="link" className="mt-4 p-0 h-auto" onClick={() => navigate(createPageUrl('Skills'))} style={{ color: '#60a5fa' }}>
              Browse all skills
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
          <CardHeader>
            <CardTitle style={{ color: '#f9fafb' }}>Skill Mastery Overview</CardTitle>
            <CardDescription style={{ color: '#9ca3af' }}>Accuracy across your practiced skills.</CardDescription>
          </CardHeader>
          <CardContent>
            {skillStats.filter(s => s.attempts > 0).length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={skillStats.filter(s => s.attempts > 0).sort((a, b) => b.accuracy - a.accuracy)}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{ background: '#111827', borderColor: '#374151', color: '#f9fafb' }}
                      itemStyle={{ color: '#f9fafb' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="accuracy" fill="#60a5fa" name="Accuracy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: '#9ca3af' }} className="text-sm">Practice some skills to see your mastery overview here!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
