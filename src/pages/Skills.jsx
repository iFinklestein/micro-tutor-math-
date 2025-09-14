
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skill } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SkillsPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const allSkills = await Skill.list('sortOrder');
        setSkills(allSkills);
      } catch (error) {
        console.error("Failed to load skills", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSkills();
  }, []);

  const skillsByGrade = skills.reduce((acc, skill) => {
    const grade = skill.gradeBand;
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(skill);
    return acc;
  }, {});

  const gradeBands = ["K-2", "3-5", "6-8"];

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
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>All Skills</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse all available practice skills.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading skills...</p>
        </div>
      ) : (
        <Tabs defaultValue="3-5" className="w-full">
          <TabsList className="grid w-full grid-cols-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {gradeBands.map(grade => (
              <TabsTrigger key={grade} value={grade} style={{ color: 'var(--text-muted)' }}>Grade {grade}</TabsTrigger>
            ))}
          </TabsList>
          {gradeBands.map(grade => (
            <TabsContent key={grade} value={grade}>
              <Card className="rounded-xl shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--text)' }}>Grade {grade} Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(skillsByGrade[grade] || []).map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-3 rounded-md hover:opacity-80 transition-opacity" style={{ background: 'var(--surface-muted)' }}>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{skill.name}</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{skill.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(createPageUrl(`Practice?skill=${skill.id}`))}
                        style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                      >
                        Practice <Play className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ))}
                   {(skillsByGrade[grade] || []).length === 0 && (
                     <p style={{ color: 'var(--text-muted)' }} className="text-sm text-center py-4">No skills available for this grade band.</p>
                   )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
