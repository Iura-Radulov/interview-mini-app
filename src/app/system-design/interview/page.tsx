import { Suspense } from 'react';
import SdInterviewChat from './SdInterviewChat';

export default function SdInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <SdInterviewChat />
    </Suspense>
  );
}
