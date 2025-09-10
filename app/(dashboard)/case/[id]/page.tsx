import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCase } from "@/app/actions/cases/actions";
import { CaseSkeleton } from "./case-skeleton";
import { CaseView } from "./case-view";

interface CasePageProps {
  params: {
    id: string;
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const result = await getCase(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Suspense fallback={<CaseSkeleton />}>
          <CaseView caseData={result.data} />
        </Suspense>
      </div>
    </div>
  );
}
