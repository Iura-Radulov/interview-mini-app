import { Suspense } from 'react';
import SummaryView from './SummaryView';

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <SummaryView />
    </Suspense>
  );
}
