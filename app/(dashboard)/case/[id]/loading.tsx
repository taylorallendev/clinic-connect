import { CaseSkeleton } from "./case-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <CaseSkeleton />
      </div>
    </div>
  );
}
