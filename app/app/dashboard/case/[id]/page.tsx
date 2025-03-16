import { Suspense } from "react";
import { CaseWrapper } from "../../shared/case-wrapper";
import { CurrentCaseSkeleton } from "../../current-case/current-case-skeleton";

interface CasePageProps {
  params: {
    id: string;
  };
}

export default function CasePage({ params }: CasePageProps) {
  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-950 to-indigo-950">
      <Suspense fallback={<CurrentCaseSkeleton />}>
        <CaseWrapper appointmentId={params.id} />
      </Suspense>
    </div>
  );
}
