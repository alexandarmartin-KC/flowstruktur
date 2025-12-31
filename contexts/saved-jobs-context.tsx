'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type JobStatus = 'SAVED' | 'IN_PROGRESS' | 'APPLIED';
export type SubStatus = 'NOT_STARTED' | 'DRAFT' | 'FINAL';

export interface SavedJob {
  id: string;
  title: string;
  company?: string;
  description?: string;
  location?: string;
  type?: string;
  source?: string;
  jobStatus: JobStatus;
  cvStatus: SubStatus;
  applicationStatus: SubStatus;
  previousStatus?: 'SAVED' | 'IN_PROGRESS';
  savedAt: string;
  // Full job data for later use
  fullData?: any;
}

interface SavedJobsContextType {
  savedJobs: SavedJob[];
  saveJob: (job: Omit<SavedJob, 'jobStatus' | 'cvStatus' | 'applicationStatus' | 'savedAt'>) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  getJobById: (jobId: string) => SavedJob | undefined;
  updateJobStatus: (jobId: string, jobStatus: JobStatus) => void;
  toggleApplied: (jobId: string) => void;
  updateSubStatus: (jobId: string, type: 'cv' | 'application', status: SubStatus) => void;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

const STORAGE_KEY = 'flowstruktur_saved_jobs';

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedJobs(parsed);
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
      } catch (error) {
        console.error('Error saving jobs:', error);
      }
    }
  }, [savedJobs, isLoaded]);

  const saveJob = (job: Omit<SavedJob, 'jobStatus' | 'cvStatus' | 'applicationStatus' | 'savedAt'>) => {
    setSavedJobs((prev) => {
      // Check if already saved
      if (prev.some((j) => j.id === job.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...job,
          jobStatus: 'SAVED',
          cvStatus: 'NOT_STARTED',
          applicationStatus: 'NOT_STARTED',
          savedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const unsaveJob = (jobId: string) => {
    setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const isJobSaved = (jobId: string) => {
    return savedJobs.some((job) => job.id === jobId);
  };

  const getJobById = (jobId: string) => {
    return savedJobs.find((job) => job.id === jobId);
  };

  const updateJobStatus = (jobId: string, jobStatus: JobStatus) => {
    setSavedJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, jobStatus } : job))
    );
  };

  const updateSubStatus = (jobId: string, type: 'cv' | 'application', status: SubStatus) => {
    setSavedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        
        const updated = { ...job };
        if (type === 'cv') {
          updated.cvStatus = status;
        } else {
          updated.applicationStatus = status;
        }
        
        // Auto-update jobStatus to IN_PROGRESS if working on CV or application
        if (updated.jobStatus === 'SAVED' && status !== 'NOT_STARTED') {
          updated.jobStatus = 'IN_PROGRESS';
        }
        
        return updated;
      })
    );
  };

  const toggleApplied = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;

        // If currently APPLIED, revert to previous status
        if (job.jobStatus === 'APPLIED') {
          const newStatus = job.previousStatus || 
            (job.cvStatus !== 'NOT_STARTED' || job.applicationStatus !== 'NOT_STARTED'
              ? 'IN_PROGRESS'
              : 'SAVED');
          
          return {
            ...job,
            jobStatus: newStatus,
            previousStatus: undefined,
          };
        }

        // If not APPLIED, mark as APPLIED and save current status
        return {
          ...job,
          previousStatus: job.jobStatus as 'SAVED' | 'IN_PROGRESS',
          jobStatus: 'APPLIED',
        };
      })
    );
  };

  return (
    <SavedJobsContext.Provider
      value={{
        savedJobs,
        saveJob,
        unsaveJob,
        isJobSaved,
        getJobById,
        updateJobStatus,
        toggleApplied,
        updateSubStatus,
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error('useSavedJobs must be used within a SavedJobsProvider');
  }
  return context;
}
