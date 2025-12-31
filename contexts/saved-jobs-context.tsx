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
  createdAt: string;
  updatedAt: string;
  // Full job data for later use
  fullData?: any;
}

interface SavedJobsContextType {
  savedJobs: SavedJob[];
  saveJob: (job: Omit<SavedJob, 'jobStatus' | 'cvStatus' | 'applicationStatus' | 'createdAt' | 'updatedAt'>) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  getJobById: (jobId: string) => SavedJob | undefined;
  updateJobStatus: (jobId: string, jobStatus: JobStatus) => void;
  toggleApplied: (jobId: string) => void;
  markInProgress: (jobId: string) => void;
  setCvStatus: (jobId: string, status: SubStatus) => void;
  setApplicationStatus: (jobId: string, status: SubStatus) => void;
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
        
        // Migrate old data format to new format
        const migrated = parsed.map((job: any) => {
          const now = new Date().toISOString();
          
          return {
            ...job,
            // Migrate savedAt to createdAt if needed
            createdAt: job.createdAt || job.savedAt || now,
            updatedAt: job.updatedAt || job.savedAt || now,
            // Ensure status fields exist
            jobStatus: job.jobStatus || job.status || 'SAVED',
            cvStatus: job.cvStatus || 'NOT_STARTED',
            applicationStatus: job.applicationStatus || 'NOT_STARTED',
            // Remove old fields
            savedAt: undefined,
            status: undefined,
          };
        });
        
        setSavedJobs(migrated);
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

  const saveJob = (job: Omit<SavedJob, 'jobStatus' | 'cvStatus' | 'applicationStatus' | 'createdAt' | 'updatedAt'>) => {
    setSavedJobs((prev) => {
      // Check if already saved
      if (prev.some((j) => j.id === job.id)) {
        return prev;
      }
      const now = new Date().toISOString();
      return [
        ...prev,
        {
          ...job,
          jobStatus: 'SAVED',
          cvStatus: 'NOT_STARTED',
          applicationStatus: 'NOT_STARTED',
          createdAt: now,
          updatedAt: now,
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
      prev.map((job) => 
        job.id === jobId 
          ? { ...job, jobStatus, updatedAt: new Date().toISOString() } 
          : job
      )
    );
  };

  const markInProgress = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.map((job) =>
        job.id === jobId && job.jobStatus === 'SAVED'
          ? { ...job, jobStatus: 'IN_PROGRESS', updatedAt: new Date().toISOString() }
          : job
      )
    );
  };

  const setCvStatus = (jobId: string, status: SubStatus) => {
    setSavedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        
        const updated = { 
          ...job, 
          cvStatus: status,
          updatedAt: new Date().toISOString()
        };
        
        // Auto-update jobStatus to IN_PROGRESS if working on CV (only when saving draft or final)
        if (updated.jobStatus === 'SAVED' && status !== 'NOT_STARTED') {
          updated.jobStatus = 'IN_PROGRESS';
        }
        
        return updated;
      })
    );
  };

  const setApplicationStatus = (jobId: string, status: SubStatus) => {
    setSavedJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        
        const updated = { 
          ...job, 
          applicationStatus: status,
          updatedAt: new Date().toISOString()
        };
        
        // Auto-update jobStatus to IN_PROGRESS if working on application
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

        const now = new Date().toISOString();

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
            updatedAt: now,
          };
        }

        // If not APPLIED, mark as APPLIED and save current status
        return {
          ...job,
          previousStatus: job.jobStatus as 'SAVED' | 'IN_PROGRESS',
          jobStatus: 'APPLIED',
          updatedAt: now,
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
        markInProgress,
        setCvStatus,
        setApplicationStatus,
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
