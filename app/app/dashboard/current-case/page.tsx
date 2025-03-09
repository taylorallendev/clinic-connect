import { Suspense } from "react";
import { CurrentCaseSkeleton } from "./current-case-skeleton";
import { CurrentCaseContent } from "./current-case-content";

export default function CurrentCasePage() {
  return (
    <Suspense fallback={<CurrentCaseSkeleton />}>
      <CurrentCaseContent />
    </Suspense>
  );
}
