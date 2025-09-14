import { Achievement } from '@/api/entities';
import { UserStats } from '@/api/entities';
import { toast } from "@/components/ui/use-toast";
import { Award, Zap, Flame, Target } from 'lucide-react';
import React from 'react';

const achievementDefs = {
  'first-100': { name: 'First 100', description: 'Completed 100 practice questions', badgeIcon: 'Target' },
  'ten-in-a-row': { name: '10 in a Row', description: 'Answered 10 questions correctly in a row', badgeIcon: 'Zap' },
  'seven-day-grind': { name: '7-Day Grind', description: 'Reached daily goal for 7 consecutive days', badgeIcon: 'Flame' },
};

const iconMap = {
    Target: <Target className="w-4 h-4 mr-2" />,
    Zap: <Zap className="w-4 h-4 mr-2" />,
    Flame: <Flame className="w-4 h-4 mr-2" />,
}

export class AchievementManager {
    static async checkAndUnlock(achievementId, existingAchievements) {
        if (existingAchievements.some(a => a.name === achievementDefs[achievementId].name)) {
            return; // Already unlocked
        }
        
        const newAchievement = await Achievement.create({
            ...achievementDefs[achievementId],
            unlockedDate: new Date().toISOString()
        });

        toast({
            title: "Achievement Unlocked! 🎉",
            description: (
                <div className="flex items-center">
                    {iconMap[newAchievement.badgeIcon]}
                    <span>{newAchievement.name}</span>
                </div>
            )
        });
    }

    static async updateAchievements(userId, userStats, sessionData) {
        if (!userStats) return;
        const existingAchievements = await Achievement.list();

        // Check for 'First 100'
        if (userStats.totalAnswers >= 100) {
            await this.checkAndUnlock('first-100', existingAchievements);
        }

        // Check for '10 in a row'
        if (sessionData && sessionData.consecutiveCorrect >= 10) {
             await this.checkAndUnlock('ten-in-a-row', existingAchievements);
        }
        
        // Check for '7-Day Grind'
        if (userStats.currentStreak >= 7) {
            await this.checkAndUnlock('seven-day-grind', existingAchievements);
        }
    }
}