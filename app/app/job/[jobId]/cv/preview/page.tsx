'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CVPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  useEffect(() => {
    // Redirect to CV editor - it has built-in preview and print functionality
    router.replace(`/app/job/${jobId}/cv`);
  }, [jobId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Omdirigerer til CV editor...</p>
      </div>
    </div>
  );
}
