import { Suspense } from 'react';
import InterviewFlow from './InterviewFlow';

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <InterviewFlow />
    </Suspense>
  );
}
