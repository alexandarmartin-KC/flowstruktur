import { NextRequest, NextResponse } from 'next/server';
import { StepStatus } from '@/lib/saved-jobs-types';

// Endpoint to update step progress for a saved job
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  
  const { step, status } = body as { 
    step: 'cv' | 'coverLetter' | 'interview'; 
    status: StepStatus;
  };
  
  if (!step || !status) {
    return NextResponse.json(
      { error: 'Missing step or status in request body' },
      { status: 400 }
    );
  }
  
  const validSteps = ['cv', 'coverLetter', 'interview'];
  const validStatuses: StepStatus[] = ['not_started', 'in_progress', 'done'];
  
  if (!validSteps.includes(step)) {
    return NextResponse.json(
      { error: `Invalid step: ${step}` },
      { status: 400 }
    );
  }
  
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status: ${status}` },
      { status: 400 }
    );
  }
  
  // In production: update database
  // For now, simulate success
  
  const updatedProgress = {
    step,
    status,
    updatedAt: new Date().toISOString(),
  };
  
  return NextResponse.json({
    success: true,
    jobId: id,
    progress: updatedProgress,
  });
}
