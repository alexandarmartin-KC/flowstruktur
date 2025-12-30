'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type JobStatus = 'SAVED' | 'IN_PROGRESS' | 'APPLIED';

export interface SavedJob {
  id: string;
  title: string;
  company?: string;
  description?: string;
  location?: string;
  type?: string;
  source?: string;
  status: JobStatus;
  savedAt: string;
  // Full job data for later use
  fullData?: any;
}

interface SavedJobsContextType {
  savedJobs: SavedJob[];
  saveJob: (job: Omit<SavedJob, 'status' | 'savedAt'>) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  getJobById: (jobId: string) => SavedJob | undefined;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
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

  const saveJob = (job: Omit<SavedJob, 'status' | 'savedAt'>) => {
    setSavedJobs((prev) => {
      // Check if already saved
      if (prev.some((j) => j.id === job.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...job,
          status: 'SAVED',
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

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    setSavedJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status } : job))
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
