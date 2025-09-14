
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  FileText,
  Database,
  Loader2,
  Trash2,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const [userPrefs, setUserPrefs] = useState({
    theme: "dark",
    dailyGoal: 20,
    soundOn: true,
    gradeBand: "3-5",
    timezone: "America/New_York"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const { UserPrefs } = await import("@/api/entities");
        const prefs = await UserPrefs.list();

        if (prefs.length > 0) {
          setUserPrefs({ ...prefs[0], theme: "dark" });
        } else {
          const defaultPrefs = {
            theme: "dark",
            dailyGoal: 20,
            soundOn: true,
            gradeBand: "3-5",
            timezone: "America/New_York"
          };
          const newPrefs = await UserPrefs.create(defaultPrefs);
          setUserPrefs(newPrefs);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      setIsSaving(true);
      const { UserPrefs } = await import("@/api/entities");
      const settingsToPersist = { ...newSettings, theme: "dark" };

      let updatedPrefs;
      if (userPrefs && userPrefs.id) {
        updatedPrefs = await UserPrefs.update(userPrefs.id, settingsToPersist);
      } else {
        updatedPrefs = await UserPrefs.create(settingsToPersist);
      }
      setUserPrefs(updatedPrefs);

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    const updatedPrefs = { ...userPrefs, [field]: value, theme: 'dark' };
    setUserPrefs(updatedPrefs);
    saveSettings(updatedPrefs);
  };
  
  // Stubs for functions that were removed but might be called
  const exportData = async (format) => {
    toast({ title: `Exporting ${format}...`, description: "This feature is being implemented." });
  };
  const importData = async (event) => {
    toast({ title: "Importing...", description: "This feature is being implemented." });
  };
  const seedDemoData = async () => {
    toast({ title: "Seeding...", description: "This feature is being implemented." });
  };
  const resetContent = async () => {
    toast({ title: "Resetting...", description: "This feature is being implemented." });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto" style={{ background: '#0f172a', color: '#f9fafb' }}>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          style={{ borderColor: '#374151', color: '#f9fafb', background: '#111827' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f9fafb' }}>
            Settings
          </h1>
          <p style={{ color: '#9ca3af' }}>
            Customize your learning experience
          </p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2" style={{ background: '#111827', borderColor: '#374151' }}>
          <TabsTrigger value="preferences" style={{ color: '#9ca3af' }}>Preferences</TabsTrigger>
          <TabsTrigger value="data" style={{ color: '#9ca3af' }}>Data & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#f9fafb' }}>
                <Brain className="w-5 h-5" />
                Learning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="dailyGoal" style={{ color: '#f9fafb' }}>Daily Goal (Questions)</Label>
                <Input
                  id="dailyGoal"
                  type="number"
                  min="5"
                  max="100"
                  value={userPrefs.dailyGoal}
                  onChange={(e) => handleInputChange('dailyGoal', parseInt(e.target.value) || 20)}
                  style={{ background: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
                />
              </div>
              <div>
                <Label htmlFor="gradeBand" style={{ color: '#f9fafb' }}>Grade Band</Label>
                <Select
                  value={userPrefs.gradeBand}
                  onValueChange={(value) => handleInputChange('gradeBand', value)}
                >
                  <SelectTrigger id="gradeBand" style={{ background: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}>
                    <SelectItem value="K-2">Grade K-2</SelectItem>
                    <SelectItem value="3-5">Grade 3-5</SelectItem>
                    <SelectItem value="6-8">Grade 6-8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="soundOn" className="flex flex-col">
                  <span style={{ color: '#f9fafb' }}>Sound On</span>
                  <span className="text-xs" style={{color: '#9ca3af'}}>For audio feedback and text-to-speech (if available)</span>
                </Label>
                <Switch
                  id="soundOn"
                  checked={userPrefs.soundOn}
                  onCheckedChange={(checked) => handleInputChange('soundOn', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="rounded-xl shadow-sm" style={{ background: '#111827', borderColor: '#374151' }}>
            <CardHeader>
              <CardTitle style={{ color: '#f9fafb' }}>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm" style={{ color: '#9ca3af' }}>Data import/export is temporarily disabled.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
