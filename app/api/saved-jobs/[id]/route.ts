import { NextRequest, NextResponse } from 'next/server';
import { SavedJobEnhanced, StepStatus } from '@/lib/saved-jobs-types';

// In production, this would interact with a database
// For now, we simulate progress updates

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // In production: fetch job by ID from database
  // For now, return a mock response
  return NextResponse.json({
    message: `Job ${id} fetched successfully`,
    jobId: id,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  
  // Expected body: { step: 'cv' | 'coverLetter' | 'interview', status: StepStatus }
  const { step, status } = body as { step: keyof SavedJobEnhanced['stepProgress']; status: StepStatus };
  
  if (!step || !status) {
    return NextResponse.json(
      { error: 'Missing step or status' },
      { status: 400 }
    );
  }
  
  const validSteps = ['cv', 'coverLetter', 'interview'];
  const validStatuses: StepStatus[] = ['not_started', 'in_progress', 'done'];
  
  if (!validSteps.includes(step)) {
    return NextResponse.json(
      { error: `Invalid step. Must be one of: ${validSteps.join(', ')}` },
      { status: 400 }
    );
  }
  
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }
  
  // In production: update the database
  // For now, just acknowledge the update
  
  return NextResponse.json({
    success: true,
    jobId: id,
    updated: {
      step,
      status,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // In production: delete job from database
  // For now, just acknowledge
  
  return NextResponse.json({
    success: true,
    message: `Job ${id} removed successfully`,
  });
}
