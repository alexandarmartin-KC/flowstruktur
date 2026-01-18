'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  CVDocument,
  CVExperienceBlock,
  CVBulletItem,
  CVEducationItem,
  CVSkillItem,
  CVLanguageItem,
  CVSettings,
  CVCheckpoint,
  CVAISuggestion,
  createEmptyCVDocument,
  createExperienceBlock,
  createBulletItem,
  createEducationItem,
  createSkillItem,
  createLanguageItem,
  generateId,
} from '@/lib/cv-types';

// Storage key prefix
const STORAGE_KEY_PREFIX = 'flowstruktur_cv_doc_';

// Maximum undo/redo stack size
const MAX_HISTORY_SIZE = 50;

// State interface
interface CVEditorState {
  document: CVDocument | null;
  isLoaded: boolean;
  isSaving: boolean;
  
  // Undo/redo stacks
  undoStack: string[];
  redoStack: string[];
  
  // Current AI operation
  aiLoading: { sectionId: string; type: string } | null;
}

// Action types
type CVEditorAction =
  | { type: 'LOAD_DOCUMENT'; payload: CVDocument }
  | { type: 'CREATE_DOCUMENT'; payload: { jobId: string } }
  | { type: 'UPDATE_DOCUMENT'; payload: Partial<CVDocument> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'PUSH_UNDO'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_REDO' }
  | { type: 'SET_AI_LOADING'; payload: { sectionId: string; type: string } | null }
  // Left column actions
  | { type: 'TOGGLE_PROFILE_PHOTO'; payload: boolean }
  | { type: 'UPDATE_PERSONAL_DATA'; payload: CVDocument['leftColumn']['personalData'] }
  | { type: 'ADD_EDUCATION'; payload: CVEducationItem }
  | { type: 'UPDATE_EDUCATION'; payload: { id: string; updates: Partial<CVEducationItem> } }
  | { type: 'REMOVE_EDUCATION'; payload: string }
  | { type: 'REORDER_EDUCATION'; payload: CVEducationItem[] }
  | { type: 'ADD_SKILL'; payload: CVSkillItem }
  | { type: 'UPDATE_SKILL'; payload: { id: string; updates: Partial<CVSkillItem> } }
  | { type: 'REMOVE_SKILL'; payload: string }
  | { type: 'REORDER_SKILLS'; payload: CVSkillItem[] }
  | { type: 'ADD_LANGUAGE'; payload: CVLanguageItem }
  | { type: 'UPDATE_LANGUAGE'; payload: { id: string; updates: Partial<CVLanguageItem> } }
  | { type: 'REMOVE_LANGUAGE'; payload: string }
  // Right column actions
  | { type: 'UPDATE_PROFESSIONAL_INTRO'; payload: string }
  | { type: 'SET_INTRO_AI_SUGGESTION'; payload: CVAISuggestion | undefined }
  | { type: 'ADD_EXPERIENCE'; payload: CVExperienceBlock }
  | { type: 'UPDATE_EXPERIENCE'; payload: { id: string; updates: Partial<CVExperienceBlock> } }
  | { type: 'REMOVE_EXPERIENCE'; payload: string }
  | { type: 'REORDER_EXPERIENCE'; payload: CVExperienceBlock[] }
  | { type: 'ADD_BULLET'; payload: { experienceId: string; bullet: CVBulletItem } }
  | { type: 'UPDATE_BULLET'; payload: { experienceId: string; bulletId: string; content: string } }
  | { type: 'REMOVE_BULLET'; payload: { experienceId: string; bulletId: string } }
  | { type: 'REORDER_BULLETS'; payload: { experienceId: string; bullets: CVBulletItem[] } }
  // Settings
  | { type: 'UPDATE_SETTINGS'; payload: Partial<CVSettings> }
  // Checkpoints
  | { type: 'CREATE_CHECKPOINT'; payload: { name: string } }
  | { type: 'RESTORE_CHECKPOINT'; payload: string }
  | { type: 'DELETE_CHECKPOINT'; payload: string };

// Initial state
const initialState: CVEditorState = {
  document: null,
  isLoaded: false,
  isSaving: false,
  undoStack: [],
  redoStack: [],
  aiLoading: null,
};

// Reducer
function cvEditorReducer(state: CVEditorState, action: CVEditorAction): CVEditorState {
  const now = new Date().toISOString();
  
  switch (action.type) {
    case 'LOAD_DOCUMENT':
      return {
        ...state,
        document: action.payload,
        isLoaded: true,
        undoStack: [],
        redoStack: [],
      };
      
    case 'CREATE_DOCUMENT':
      return {
        ...state,
        document: createEmptyCVDocument(action.payload.jobId),
        isLoaded: true,
        undoStack: [],
        redoStack: [],
      };
      
    case 'UPDATE_DOCUMENT':
      if (!state.document) return state;
      return {
        ...state,
        document: { ...state.document, ...action.payload, updatedAt: now },
      };
      
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
      
    case 'PUSH_UNDO':
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-MAX_HISTORY_SIZE + 1), action.payload],
        redoStack: [], // Clear redo on new action
      };
      
    case 'UNDO': {
      if (state.undoStack.length === 0 || !state.document) return state;
      const previousState = state.undoStack[state.undoStack.length - 1];
      const currentState = JSON.stringify(state.document);
      try {
        const restoredDoc = JSON.parse(previousState) as CVDocument;
        return {
          ...state,
          document: restoredDoc,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, currentState],
        };
      } catch {
        return state;
      }
    }
      
    case 'REDO': {
      if (state.redoStack.length === 0 || !state.document) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      const currentState = JSON.stringify(state.document);
      try {
        const restoredDoc = JSON.parse(nextState) as CVDocument;
        return {
          ...state,
          document: restoredDoc,
          undoStack: [...state.undoStack, currentState],
          redoStack: state.redoStack.slice(0, -1),
        };
      } catch {
        return state;
      }
    }
      
    case 'CLEAR_REDO':
      return { ...state, redoStack: [] };
      
    case 'SET_AI_LOADING':
      return { ...state, aiLoading: action.payload };
      
    // Left column actions
    case 'TOGGLE_PROFILE_PHOTO':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: { ...state.document.leftColumn, showProfilePhoto: action.payload },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_PERSONAL_DATA':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: { ...state.document.leftColumn, personalData: action.payload },
          updatedAt: now,
        },
      };
      
    case 'ADD_EDUCATION':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            education: [...state.document.leftColumn.education, action.payload],
          },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_EDUCATION':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            education: state.document.leftColumn.education.map(item =>
              item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REMOVE_EDUCATION':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            education: state.document.leftColumn.education.filter(item => item.id !== action.payload),
          },
          updatedAt: now,
        },
      };
      
    case 'REORDER_EDUCATION':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: { ...state.document.leftColumn, education: action.payload },
          updatedAt: now,
        },
      };
      
    case 'ADD_SKILL':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            skills: [...state.document.leftColumn.skills, action.payload],
          },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_SKILL':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            skills: state.document.leftColumn.skills.map(item =>
              item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REMOVE_SKILL':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            skills: state.document.leftColumn.skills.filter(item => item.id !== action.payload),
          },
          updatedAt: now,
        },
      };
      
    case 'REORDER_SKILLS':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: { ...state.document.leftColumn, skills: action.payload },
          updatedAt: now,
        },
      };
      
    case 'ADD_LANGUAGE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            languages: [...state.document.leftColumn.languages, action.payload],
          },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_LANGUAGE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            languages: state.document.leftColumn.languages.map(item =>
              item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REMOVE_LANGUAGE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          leftColumn: {
            ...state.document.leftColumn,
            languages: state.document.leftColumn.languages.filter(item => item.id !== action.payload),
          },
          updatedAt: now,
        },
      };
      
    // Right column actions
    case 'UPDATE_PROFESSIONAL_INTRO':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            professionalIntro: {
              ...state.document.rightColumn.professionalIntro,
              content: action.payload,
            },
          },
          updatedAt: now,
        },
      };
      
    case 'SET_INTRO_AI_SUGGESTION':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            professionalIntro: {
              ...state.document.rightColumn.professionalIntro,
              aiSuggestion: action.payload,
            },
          },
          updatedAt: now,
        },
      };
      
    case 'ADD_EXPERIENCE':
      if (!state.document) return state;
      // Insert at beginning to maintain reverse chronological order
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: [action.payload, ...state.document.rightColumn.experience],
          },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_EXPERIENCE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.map(exp =>
              exp.id === action.payload.id ? { ...exp, ...action.payload.updates } : exp
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REMOVE_EXPERIENCE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.filter(exp => exp.id !== action.payload),
          },
          updatedAt: now,
        },
      };
      
    case 'REORDER_EXPERIENCE':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: { ...state.document.rightColumn, experience: action.payload },
          updatedAt: now,
        },
      };
      
    case 'ADD_BULLET':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.map(exp =>
              exp.id === action.payload.experienceId
                ? { ...exp, bullets: [...exp.bullets, action.payload.bullet] }
                : exp
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'UPDATE_BULLET':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.map(exp =>
              exp.id === action.payload.experienceId
                ? {
                    ...exp,
                    bullets: exp.bullets.map(b =>
                      b.id === action.payload.bulletId ? { ...b, content: action.payload.content } : b
                    ),
                  }
                : exp
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REMOVE_BULLET':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.map(exp =>
              exp.id === action.payload.experienceId
                ? { ...exp, bullets: exp.bullets.filter(b => b.id !== action.payload.bulletId) }
                : exp
            ),
          },
          updatedAt: now,
        },
      };
      
    case 'REORDER_BULLETS':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          rightColumn: {
            ...state.document.rightColumn,
            experience: state.document.rightColumn.experience.map(exp =>
              exp.id === action.payload.experienceId
                ? { ...exp, bullets: action.payload.bullets }
                : exp
            ),
          },
          updatedAt: now,
        },
      };
      
    // Settings
    case 'UPDATE_SETTINGS':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          settings: { ...state.document.settings, ...action.payload },
          updatedAt: now,
        },
      };
      
    // Checkpoints
    case 'CREATE_CHECKPOINT':
      if (!state.document) return state;
      const checkpoint: CVCheckpoint = {
        id: generateId(),
        name: action.payload.name,
        createdAt: now,
        snapshot: JSON.stringify(state.document),
      };
      return {
        ...state,
        document: {
          ...state.document,
          checkpoints: [...state.document.checkpoints, checkpoint],
          updatedAt: now,
        },
      };
      
    case 'RESTORE_CHECKPOINT':
      if (!state.document) return state;
      const cp = state.document.checkpoints.find(c => c.id === action.payload);
      if (!cp) return state;
      try {
        const restoredDoc = JSON.parse(cp.snapshot) as CVDocument;
        // Keep the checkpoints from current document
        restoredDoc.checkpoints = state.document.checkpoints;
        restoredDoc.updatedAt = now;
        return {
          ...state,
          document: restoredDoc,
          undoStack: [...state.undoStack, JSON.stringify(state.document)],
          redoStack: [],
        };
      } catch {
        return state;
      }
      
    case 'DELETE_CHECKPOINT':
      if (!state.document) return state;
      return {
        ...state,
        document: {
          ...state.document,
          checkpoints: state.document.checkpoints.filter(c => c.id !== action.payload),
          updatedAt: now,
        },
      };
      
    default:
      return state;
  }
}

// Context interface
interface CVEditorContextType {
  state: CVEditorState;
  
  // Document management
  loadDocument: (jobId: string) => void;
  saveDocument: () => void;
  
  // Undo/redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Profile photo
  toggleProfilePhoto: (show: boolean) => void;
  
  // Personal data
  updatePersonalData: (data: CVDocument['leftColumn']['personalData']) => void;
  
  // Education
  addEducation: (title?: string, institution?: string, year?: string) => void;
  updateEducation: (id: string, updates: Partial<CVEducationItem>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (items: CVEducationItem[]) => void;
  
  // Skills
  addSkill: (name?: string) => void;
  updateSkill: (id: string, updates: Partial<CVSkillItem>) => void;
  removeSkill: (id: string) => void;
  reorderSkills: (items: CVSkillItem[]) => void;
  
  // Languages
  addLanguage: (language?: string, level?: CVLanguageItem['level']) => void;
  updateLanguage: (id: string, updates: Partial<CVLanguageItem>) => void;
  removeLanguage: (id: string) => void;
  
  // Professional intro
  updateProfessionalIntro: (content: string) => void;
  setIntroAiSuggestion: (suggestion: CVAISuggestion | undefined) => void;
  
  // Experience
  addExperience: (title?: string, company?: string, startDate?: string, endDate?: string) => void;
  updateExperience: (id: string, updates: Partial<CVExperienceBlock>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (items: CVExperienceBlock[]) => void;
  
  // Bullets
  addBullet: (experienceId: string, content?: string) => void;
  updateBullet: (experienceId: string, bulletId: string, content: string) => void;
  removeBullet: (experienceId: string, bulletId: string) => void;
  reorderBullets: (experienceId: string, bullets: CVBulletItem[]) => void;
  
  // Settings
  updateSettings: (settings: Partial<CVSettings>) => void;
  
  // Checkpoints
  createCheckpoint: (name: string) => void;
  restoreCheckpoint: (id: string) => void;
  deleteCheckpoint: (id: string) => void;
  
  // AI
  setAiLoading: (loading: { sectionId: string; type: string } | null) => void;
}

const CVEditorContext = createContext<CVEditorContextType | undefined>(undefined);

export function CVEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cvEditorReducer, initialState);
  
  // Save to localStorage when document changes
  useEffect(() => {
    if (state.document && state.isLoaded) {
      const key = `${STORAGE_KEY_PREFIX}${state.document.jobId}`;
      localStorage.setItem(key, JSON.stringify(state.document));
    }
  }, [state.document, state.isLoaded]);
  
  // Helper to push undo before modifications
  const pushUndo = useCallback(() => {
    if (state.document) {
      dispatch({ type: 'PUSH_UNDO', payload: JSON.stringify(state.document) });
    }
  }, [state.document]);
  
  // Document management
  const loadDocument = useCallback((jobId: string) => {
    const key = `${STORAGE_KEY_PREFIX}${jobId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const doc = JSON.parse(stored) as CVDocument;
        dispatch({ type: 'LOAD_DOCUMENT', payload: doc });
      } catch {
        dispatch({ type: 'CREATE_DOCUMENT', payload: { jobId } });
      }
    } else {
      dispatch({ type: 'CREATE_DOCUMENT', payload: { jobId } });
    }
  }, []);
  
  const saveDocument = useCallback(() => {
    if (state.document) {
      dispatch({ type: 'SET_SAVING', payload: true });
      const key = `${STORAGE_KEY_PREFIX}${state.document.jobId}`;
      localStorage.setItem(key, JSON.stringify(state.document));
      setTimeout(() => dispatch({ type: 'SET_SAVING', payload: false }), 300);
    }
  }, [state.document]);
  
  // Undo/redo
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  
  // Profile photo
  const toggleProfilePhoto = useCallback((show: boolean) => {
    pushUndo();
    dispatch({ type: 'TOGGLE_PROFILE_PHOTO', payload: show });
  }, [pushUndo]);
  
  // Personal data
  const updatePersonalData = useCallback((data: CVDocument['leftColumn']['personalData']) => {
    pushUndo();
    dispatch({ type: 'UPDATE_PERSONAL_DATA', payload: data });
  }, [pushUndo]);
  
  // Education
  const addEducation = useCallback((title = '', institution = '', year = '') => {
    pushUndo();
    dispatch({ type: 'ADD_EDUCATION', payload: createEducationItem(title, institution, year) });
  }, [pushUndo]);
  
  const updateEducation = useCallback((id: string, updates: Partial<CVEducationItem>) => {
    pushUndo();
    dispatch({ type: 'UPDATE_EDUCATION', payload: { id, updates } });
  }, [pushUndo]);
  
  const removeEducation = useCallback((id: string) => {
    pushUndo();
    dispatch({ type: 'REMOVE_EDUCATION', payload: id });
  }, [pushUndo]);
  
  const reorderEducation = useCallback((items: CVEducationItem[]) => {
    pushUndo();
    dispatch({ type: 'REORDER_EDUCATION', payload: items });
  }, [pushUndo]);
  
  // Skills
  const addSkill = useCallback((name = '') => {
    pushUndo();
    dispatch({ type: 'ADD_SKILL', payload: createSkillItem(name) });
  }, [pushUndo]);
  
  const updateSkill = useCallback((id: string, updates: Partial<CVSkillItem>) => {
    pushUndo();
    dispatch({ type: 'UPDATE_SKILL', payload: { id, updates } });
  }, [pushUndo]);
  
  const removeSkill = useCallback((id: string) => {
    pushUndo();
    dispatch({ type: 'REMOVE_SKILL', payload: id });
  }, [pushUndo]);
  
  const reorderSkills = useCallback((items: CVSkillItem[]) => {
    pushUndo();
    dispatch({ type: 'REORDER_SKILLS', payload: items });
  }, [pushUndo]);
  
  // Languages
  const addLanguage = useCallback((language = '', level: CVLanguageItem['level'] = 'intermediate') => {
    pushUndo();
    dispatch({ type: 'ADD_LANGUAGE', payload: createLanguageItem(language, level) });
  }, [pushUndo]);
  
  const updateLanguage = useCallback((id: string, updates: Partial<CVLanguageItem>) => {
    pushUndo();
    dispatch({ type: 'UPDATE_LANGUAGE', payload: { id, updates } });
  }, [pushUndo]);
  
  const removeLanguage = useCallback((id: string) => {
    pushUndo();
    dispatch({ type: 'REMOVE_LANGUAGE', payload: id });
  }, [pushUndo]);
  
  // Professional intro
  const updateProfessionalIntro = useCallback((content: string) => {
    pushUndo();
    dispatch({ type: 'UPDATE_PROFESSIONAL_INTRO', payload: content });
  }, [pushUndo]);
  
  const setIntroAiSuggestion = useCallback((suggestion: CVAISuggestion | undefined) => {
    dispatch({ type: 'SET_INTRO_AI_SUGGESTION', payload: suggestion });
  }, []);
  
  // Experience
  const addExperience = useCallback((title = '', company = '', startDate = '', endDate?: string) => {
    pushUndo();
    dispatch({ type: 'ADD_EXPERIENCE', payload: createExperienceBlock(title, company, startDate, endDate) });
  }, [pushUndo]);
  
  const updateExperience = useCallback((id: string, updates: Partial<CVExperienceBlock>) => {
    pushUndo();
    dispatch({ type: 'UPDATE_EXPERIENCE', payload: { id, updates } });
  }, [pushUndo]);
  
  const removeExperience = useCallback((id: string) => {
    pushUndo();
    dispatch({ type: 'REMOVE_EXPERIENCE', payload: id });
  }, [pushUndo]);
  
  const reorderExperience = useCallback((items: CVExperienceBlock[]) => {
    pushUndo();
    dispatch({ type: 'REORDER_EXPERIENCE', payload: items });
  }, [pushUndo]);
  
  // Bullets
  const addBullet = useCallback((experienceId: string, content = '') => {
    pushUndo();
    dispatch({ type: 'ADD_BULLET', payload: { experienceId, bullet: createBulletItem(content) } });
  }, [pushUndo]);
  
  const updateBullet = useCallback((experienceId: string, bulletId: string, content: string) => {
    pushUndo();
    dispatch({ type: 'UPDATE_BULLET', payload: { experienceId, bulletId, content } });
  }, [pushUndo]);
  
  const removeBullet = useCallback((experienceId: string, bulletId: string) => {
    pushUndo();
    dispatch({ type: 'REMOVE_BULLET', payload: { experienceId, bulletId } });
  }, [pushUndo]);
  
  const reorderBullets = useCallback((experienceId: string, bullets: CVBulletItem[]) => {
    pushUndo();
    dispatch({ type: 'REORDER_BULLETS', payload: { experienceId, bullets } });
  }, [pushUndo]);
  
  // Settings
  const updateSettings = useCallback((settings: Partial<CVSettings>) => {
    pushUndo();
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [pushUndo]);
  
  // Checkpoints
  const createCheckpoint = useCallback((name: string) => {
    dispatch({ type: 'CREATE_CHECKPOINT', payload: { name } });
  }, []);
  
  const restoreCheckpoint = useCallback((id: string) => {
    dispatch({ type: 'RESTORE_CHECKPOINT', payload: id });
  }, []);
  
  const deleteCheckpoint = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CHECKPOINT', payload: id });
  }, []);
  
  // AI loading state
  const setAiLoading = useCallback((loading: { sectionId: string; type: string } | null) => {
    dispatch({ type: 'SET_AI_LOADING', payload: loading });
  }, []);
  
  const value: CVEditorContextType = {
    state,
    loadDocument,
    saveDocument,
    undo,
    redo,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    toggleProfilePhoto,
    updatePersonalData,
    addEducation,
    updateEducation,
    removeEducation,
    reorderEducation,
    addSkill,
    updateSkill,
    removeSkill,
    reorderSkills,
    addLanguage,
    updateLanguage,
    removeLanguage,
    updateProfessionalIntro,
    setIntroAiSuggestion,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperience,
    addBullet,
    updateBullet,
    removeBullet,
    reorderBullets,
    updateSettings,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    setAiLoading,
  };
  
  return (
    <CVEditorContext.Provider value={value}>
      {children}
    </CVEditorContext.Provider>
  );
}

export function useCVEditor() {
  const context = useContext(CVEditorContext);
  if (context === undefined) {
    throw new Error('useCVEditor must be used within a CVEditorProvider');
  }
  return context;
}
