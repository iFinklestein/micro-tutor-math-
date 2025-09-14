import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skill } from "@/api/entities";
import { Question } from "@/api/entities";
import { Attempt } from "@/api/entities";
import { ReviewItem } from "@/api/entities";
import { UserStats } from "@/api/entities";
import { UserPrefs } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Timer,
  Play,
  Pause,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AchievementManager } from '../components/gamification/AchievementManager';

const StatCard = ({ title, value, icon: Icon, iconColor }) => (
  <Card style={{ background: 'var(--surface-muted)' }}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium" style={{color: 'var(--text-muted)'}}>{title}</CardTitle>
      {Icon && <Icon className={`h-5 w-5 ${iconColor || 'text-[var(--text-muted)]'}`} />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold" style={{color: 'var(--text)'}}>
        {value}
      </div>
    </CardContent>
  </Card>
);

export default function Practice() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [sessionData, setSessionData] = useState({
    questions: [],
    currentIndex: 0,
    startTime: null,
    answers: [],
    sessionId: `session-${Date.now()}`
  });
  const [sessionSettings, setSessionSettings] = useState({
    skillId: null,
    level: 'medium',
    target: 20,
    timeLimit: null,
    isTimedSession: false
  });
  const [sessionActive, setSessionActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('medium');
  const [userPrefs, setUserPrefs] = useState(null);

  useEffect(() => {
    initializePractice();
  }, []);

  useEffect(() => {
    let interval;
    if (sessionActive && sessionData.startTime) {
      interval = setInterval(() => {
        setSessionTimer(Date.now() - sessionData.startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, sessionData.startTime]);

  const initializePractice = async () => {
    try {
      const prefs = await UserPrefs.list();
      const preferences = prefs[0] || { gradeBand: "3-5", dailyGoal: 20 };
      setUserPrefs(preferences);

      const allSkills = await Skill.filter({ gradeBand: preferences.gradeBand });
      setSkills(allSkills);

      const urlParams = new URLSearchParams(window.location.search);
      const skillParam = urlParams.get('skill');

      if (skillParam) {
        const targetSkill = allSkills.find(s => s.id === skillParam);
        if (targetSkill) {
          setSessionSettings(prev => ({
            ...prev,
            skillId: skillParam,
            target: preferences.dailyGoal
          }));
        }
      } else {
        setSessionSettings(prev => ({
          ...prev,
          target: preferences.dailyGoal
        }));
      }
    } catch (error) {
      console.error("Error initializing practice:", error);
    }
  };

  const startSession = async () => {
    try {
      let questionPool = [];

      if (sessionSettings.skillId) {
        const allQuestions = await Question.filter({ skillId: sessionSettings.skillId, level: currentLevel });
        questionPool = allQuestions;
      } else {
        const allQuestions = await Question.list();
        const skillIds = skills.map(s => s.id);
        questionPool = allQuestions.filter(q =>
          skillIds.includes(q.skillId) && q.level === currentLevel
        );
      }

      if (questionPool.length === 0) {
        toast({
          title: "No Questions Available",
          description: "No questions found for the selected criteria. Try a different level or skill.",
          variant: "destructive"
        });
        return;
      }

      const shuffledQuestions = questionPool.sort(() => Math.random() - 0.5);
      const sessionQuestions = shuffledQuestions.slice(0, sessionSettings.target);

      setSessionData({
        questions: sessionQuestions,
        currentIndex: 0,
        startTime: Date.now(),
        answers: [],
        sessionId: `session-${Date.now()}`
      });

      setCurrentQuestion(sessionQuestions[0]);
      setQuestionStartTime(Date.now());
      setSessionActive(true);
      setConsecutiveCorrect(0);
      setConsecutiveIncorrect(0);
      setCurrentLevel('medium');
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start practice session.",
        variant: "destructive"
      });
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const questionTime = Date.now() - questionStartTime;
    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);

    const attempt = {
      questionId: currentQuestion.id,
      skillId: currentQuestion.skillId,
      levelAtAttempt: currentLevel,
      answer: userAnswer.trim(),
      correct: isCorrect,
      timeMs: questionTime,
      sessionId: sessionData.sessionId
    };

    // Save attempt immediately
    await Attempt.create(attempt);

    // Dispatch event for dashboard to refresh
    window.dispatchEvent(new CustomEvent('attempt:saved', { 
      detail: { attempt, isCorrect } 
    }));

    const newAnswers = [...sessionData.answers, attempt];
    setSessionData(prev => ({
      ...prev,
      answers: newAnswers
    }));

    let newConsecutiveCorrect = consecutiveCorrect;
    if (isCorrect) {
      newConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutiveCorrect);
      setConsecutiveIncorrect(0);

      if (newConsecutiveCorrect >= 3 && currentLevel !== 'hard') {
        const newLevel = currentLevel === 'easy' ? 'medium' : 'hard';
        setCurrentLevel(newLevel);
        setConsecutiveCorrect(0);

        toast({
          title: "Level Up! 🎉",
          description: `Great job! Moving to ${newLevel} questions.`
        });
      }
    } else {
      setConsecutiveIncorrect(prev => prev + 1);
      setConsecutiveCorrect(0);
      newConsecutiveCorrect = 0;

      if (consecutiveIncorrect + 1 >= 2 && currentLevel !== 'easy') {
        const newLevel = currentLevel === 'hard' ? 'medium' : 'easy';
        setCurrentLevel(newLevel);
        setConsecutiveIncorrect(0);

        toast({
          title: "Adjusting Difficulty",
          description: `Let's try some ${newLevel} questions.`
        });
      }

      await addToReviewQueue(currentQuestion.id, currentQuestion.skillId);
    }

    const statsList = await UserStats.list();
    if(statsList.length > 0) {
      await AchievementManager.updateAchievements(null, statsList[0], { consecutiveCorrect: newConsecutiveCorrect });
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const addToReviewQueue = async (questionId, skillId) => {
    try {
      const existingReview = await ReviewItem.filter({ questionId });

      if (existingReview.length > 0) {
        await ReviewItem.update(existingReview[0].id, {
          nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          interval: 1,
          correctStreak: 0
        });
      } else {
        await ReviewItem.create({
          questionId,
          skillId,
          nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          interval: 1,
          correctStreak: 0,
          mastered: false
        });
      }
    } catch (error) {
      console.error("Error adding to review queue:", error);
    }
  };

  const nextQuestion = async () => {
    setShowFeedback(false);
    setUserAnswer("");

    const nextIndex = sessionData.currentIndex + 1;

    if (nextIndex >= sessionData.questions.length) {
      await endSession();
      return;
    }

    let nextQuestionData = sessionData.questions[nextIndex];

    if (nextQuestionData.level !== currentLevel) {
        let questionFilter = { level: currentLevel };
        if (sessionSettings.skillId) {
            questionFilter.skillId = sessionSettings.skillId;
        }
      const newLevelQuestions = await Question.filter(questionFilter);

      if (newLevelQuestions.length > 0) {
        const availableQuestions = newLevelQuestions.filter(q =>
          !sessionData.answers.some(a => a.questionId === q.id)
        );
        if(availableQuestions.length > 0) {
          nextQuestionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        }
      }
    }

    setCurrentQuestion(nextQuestionData);
    setQuestionStartTime(Date.now());
    setSessionData(prev => ({
      ...prev,
      currentIndex: nextIndex,
      questions: Object.assign([], prev.questions, {[nextIndex]: nextQuestionData})
    }));
  };

  const endSession = async () => {
    setSessionActive(false);

    const totalQuestions = sessionData.answers.length;
    const correctAnswers = sessionData.answers.filter(a => a.correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const totalTime = Math.round(sessionTimer / 1000);

    const statsList = await UserStats.list();
    let finalStats;

    const today = new Date().toISOString().split('T')[0];

    if (statsList.length > 0) {
      const currentStats = statsList[0];
      
      let newStreak = currentStats.currentStreak || 0;
      // Check if daily goal was met to increment streak
      if (totalQuestions > 0 && totalQuestions >= (userPrefs?.dailyGoal || 20)) {
        if (currentStats.lastAnsweredDate !== today) {
          if (isYesterday(currentStats.lastAnsweredDate)) {
            newStreak = (currentStats.currentStreak || 0) + 1;
          } else {
            newStreak = 1;
          }
        }
      }

      const updatedStats = {
        totalAnswers: (currentStats.totalAnswers || 0) + totalQuestions,
        correctAnswers: (currentStats.correctAnswers || 0) + correctAnswers,
        currentStreak: newStreak,
        bestStreak: Math.max(currentStats.bestStreak || 0, newStreak),
        lastAnsweredDate: today
      };

      await UserStats.update(currentStats.id, updatedStats);
      finalStats = { ...currentStats, ...updatedStats };
    } else {
      // Create new stats record if none exists
      let newStreak = 0;
      if (totalQuestions > 0 && totalQuestions >= (userPrefs?.dailyGoal || 20)) {
          newStreak = 1;
      }
      const newStats = {
          totalAnswers: totalQuestions,
          correctAnswers: correctAnswers,
          currentStreak: newStreak,
          bestStreak: newStreak,
          lastAnsweredDate: today
      };
      finalStats = await UserStats.create(newStats);
    }

    if (finalStats) {
      await AchievementManager.updateAchievements(null, finalStats, null);
    }

    toast({
      title: "Session Complete! 🎉",
      description: `${correctAnswers}/${totalQuestions} correct (${accuracy}%) in ${totalTime}s`
    });

    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 3000);
  };

  const isYesterday = (dateStr) => {
    if (!dateStr) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().split('T')[0];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback) {
      submitAnswer();
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (sessionData.questions.length === 0) return 0;
    return ((sessionData.currentIndex + 1) / sessionData.questions.length) * 100;
  };

  if (!sessionActive) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Math Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your practice settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card style={{ background: 'var(--surface)' }} className="backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Practice Settings
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Focus Skill (Optional)
                </label>
                <select
                  className="w-full p-3 rounded-lg"
                  style={{ 
                    background: 'var(--surface)', 
                    color: 'var(--text)', 
                    borderColor: 'var(--border)', 
                    border: '1px solid var(--border)' 
                  }}
                  value={sessionSettings.skillId || ''}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    skillId: e.target.value || null
                  }))}
                >
                  <option value="">Mixed Practice (All Skills)</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Number of Questions
                </label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={sessionSettings.target}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    target: parseInt(e.target.value) || 20
                  }))}
                  style={{ background: 'var(--surface-muted)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              <Button
                onClick={startSession}
                className="w-full h-12 text-lg"
                style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Practice Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSessionActive(false);
              navigate(createPageUrl("Dashboard"));
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Practice Session
            </h1>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {formatTime(sessionTimer)}
              </span>
              <Badge variant="outline" className={`border-none
                ${currentLevel === 'easy' ? 'bg-green-900/30 text-green-300' :
                  currentLevel === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                  'bg-red-900/30 text-red-300'}
              `}>
                {currentLevel}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{color: 'var(--text)'}}>
            Question {sessionData.currentIndex + 1} of {sessionData.questions.length}
          </span>
          <span className="text-sm" style={{color: 'var(--text-muted)'}}>
            {Math.round(getProgressPercentage())}%
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {currentQuestion && (
        <Card style={{ background: 'var(--surface)', border: 'none' }} className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold" style={{color: 'var(--text)'}}>
                {currentQuestion.prompt}
              </h2>
            </div>

            {showFeedback ? (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold mb-4 ${
                  lastAnswerCorrect
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-red-900/40 text-red-300'
                }`}>
                  {lastAnswerCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6" />
                      Not quite...
                    </>
                  )}
                </div>

                <div className="text-lg" style={{color: 'var(--text-muted)'}}>
                  {currentQuestion.explain}
                </div>

                {!lastAnswerCorrect && (
                  <div className="mt-3" style={{color: 'var(--text-muted)'}}>
                    The correct answer is: <span className="font-semibold text-[var(--text)]">{currentQuestion.correctAnswer}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                {currentQuestion.format === 'mc' && currentQuestion.choices ? (
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {currentQuestion.choices.map((choice, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-16 text-lg"
                        onClick={() => {
                          setUserAnswer(choice);
                          setTimeout(() => submitAnswer(), 100);
                        }}
                        style={{
                          background: 'var(--surface-muted)',
                          color: 'var(--text)',
                          borderColor: 'var(--border)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter your answer"
                      className="text-center text-xl h-16 rounded-md focus:outline-none focus:ring-2"
                      style={{ 
                        background: 'var(--surface-muted)', 
                        color: 'var(--text)', 
                        borderColor: 'var(--border)',
                        '--placeholder-color': 'var(--text-muted)'
                      }}
                      autoFocus
                    />
                    <style>
                      {`
                        input::placeholder {
                          color: var(--placeholder-color);
                        }
                        input:focus {
                          --tw-ring-color: var(--focus);
                          border-color: var(--focus);
                        }
                      `}
                    </style>
                    <Button
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim()}
                      className="w-full mt-4 h-12 text-lg rounded-md"
                      style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}
                    >
                      Check Answer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sessionData.answers.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <StatCard
            title="Answered"
            value={sessionData.answers.length}
            icon={Target}
          />
          <StatCard
            title="Correct"
            value={sessionData.answers.filter(a => a.correct).length}
            icon={CheckCircle}
            iconColor="text-green-500"
          />
          <StatCard
            title="Accuracy"
            value={`${Math.round((sessionData.answers.filter(a => a.correct).length / sessionData.answers.length) * 100)}%`}
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
        </div>
      )}
    </div>
  );
}