"use client";

import { AnalysisOutcome } from "@/components/home/analysis-outcome";
import { HomeGuide } from "@/components/home/home-guide";
import { HomeIntro } from "@/components/home/home-intro";
import { LoadingResult } from "@/components/home/loading-result";
import { RecipeInput } from "@/components/home/recipe-input";
import { useHomeAnalysis } from "@/hooks/use-home-analysis";

const HomePage = () => {
  const { pending, showOutcome, input, outcome } = useHomeAnalysis();

  return (
    <main className="container w-full flex-1 pb-section-end pt-section-input">
      {showOutcome ? (
        <AnalysisOutcome {...outcome} />
      ) : (
        <>
          {!pending && <HomeIntro />}
          <RecipeInput {...input} />
          {pending ? <LoadingResult /> : <HomeGuide />}
        </>
      )}
    </main>
  );
};

export default HomePage;
