
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Achievement } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Star, Target, Zap, Flame, Lock, Footprints, BrainCircuit, CalendarCheck, Trophy, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const achievementDefs = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first practice session.', badgeIcon: 'Footprints' },
  { id: 'daily-dedication', name: 'Daily Dedication', description: 'Complete your daily goal.', badgeIcon: 'CalendarCheck' },
  { id: 'perfect-practice', name: 'Perfect Practice', description: 'Get 100% accuracy in a session of 10+ questions.', badgeIcon: 'Target' },
  { id: 'hot-streak-3', name: 'Hot Streak', description: 'Reach a 3-day streak.', badgeIcon: 'Flame' },
  { id: 'hot-streak-7', name: 'Blazing Hot Streak', description: 'Reach a 7-day streak.', badgeIcon: 'Flame' },
  { id: 'sharp-shooter', name: 'Sharp Shooter', description: 'Answer 10 questions correctly in a row.', badgeIcon: 'Zap' },
  { id: 'centurion', name: 'Centurion', description: 'Answer 100 total questions.', badgeIcon: 'Star' },
  { id: 'master-of-1000', name: 'Master of 1000', description: 'Answer 1000 total questions.', badgeIcon: 'Trophy' },
  { id: 'skill-dabbler', name: 'Skill Dabbler', description: 'Practice 3 different skills.', badgeIcon: 'BrainCircuit' },
  { id: 'skill-master', name: 'Skill Master', description: 'Achieve 90% accuracy in a skill over 20+ attempts.', badgeIcon: 'Sparkles' },
];

const iconMap = {
  Footprints, Target, BrainCircuit, CalendarCheck, Flame, Zap, Trophy, Sparkles, Star, Lock
};

const AchievementCard = ({ def, unlocked }) => {
  const Icon = unlocked ? (iconMap[def.badgeIcon] || Star) : Lock;
  const isUnlocked = !!unlocked;
  
  return (
    <Card className="transition-all rounded-xl shadow-sm" style={{ 
      background: isUnlocked ? 'var(--surface)' : 'var(--surface-muted)', 
      borderColor: isUnlocked ? 'var(--primary)' : 'var(--border)' 
    }}>
      <CardContent className="p-4 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${isUnlocked ? 'bg-yellow-400/20' : ''}`} style={{ background: isUnlocked ? '#fbbf2420' : 'var(--surface-muted)' }}>
          <Icon className={`w-8 h-8 ${isUnlocked ? 'text-yellow-500' : ''}`} style={{ color: isUnlocked ? '#eab308' : 'var(--text-muted)' }} />
        </div>
        <div className="flex-grow">
          <p className="font-bold" style={{ color: isUnlocked ? 'var(--text)' : 'var(--text-muted)' }}>{def.name}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{def.description}</p>
          {isUnlocked && (
            <Badge variant="outline" className="mt-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Unlocked on {format(new Date(unlocked.unlockedDate), 'MMM d, yyyy')}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const unlocked = await Achievement.list('-unlockedDate');
        setUnlockedAchievements(unlocked);
      } catch (error) {
        console.error("Failed to load achievements", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAchievements();
  }, []);

  const unlockedMap = unlockedAchievements.reduce((map, ach) => {
    map[ach.name] = ach;
    return map;
  }, {});
  
  const allAchievements = achievementDefs.map(def => ({
    ...def,
    unlocked: unlockedMap[def.name] || null
  })).sort((a,b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>Achievements</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your accomplishments and milestones.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allAchievements.map(def => (
            <AchievementCard key={def.id} def={def} unlocked={def.unlocked} />
          ))}
        </div>
      )}
    </div>
  );
}
