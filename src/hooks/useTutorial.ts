import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("tutorial_completed, tutorial_step")
      .eq("id", user.id)
      .single();

    if (profile && !profile.tutorial_completed) {
      setCurrentStep(profile.tutorial_step || 0);
      setShowTutorial(true);
    }

    setLoading(false);
  };

  const saveProgress = useCallback(async (step: number) => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ tutorial_step: step })
      .eq("id", userId);
  }, [userId]);

  const completeTutorial = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ tutorial_completed: true, tutorial_step: 0 })
      .eq("id", userId);
    setShowTutorial(false);
  }, [userId]);

  const nextStep = useCallback((totalSteps: number) => {
    const next = currentStep + 1;
    if (next >= totalSteps) {
      completeTutorial();
    } else {
      setCurrentStep(next);
      saveProgress(next);
    }
  }, [currentStep, completeTutorial, saveProgress]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveProgress(prev);
    }
  }, [currentStep, saveProgress]);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  const restartTutorial = useCallback(() => {
    setCurrentStep(0);
    setShowTutorial(true);
    saveProgress(0);
  }, [saveProgress]);

  return {
    showTutorial,
    currentStep,
    loading,
    nextStep,
    prevStep,
    skipTutorial,
    restartTutorial,
    setShowTutorial,
  };
}
