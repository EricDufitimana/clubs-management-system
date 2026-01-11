'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

type Club = {
  id: string;
  club_name: string;
  club_description: string;
  status: 'active' | 'terminated';
};

type ClubContextType = {
  selectedClub: Club | null;
  clubs: Club[];
  setSelectedClub: (club: Club | null) => void;
  isLoading: boolean;
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const [selectedClub, setSelectedClubState] = useState<Club | null>(null);

  // Fetch user's clubs
  const { data: clubsData, isLoading } = useQuery({
    ...trpc.clubs.getClubs.queryOptions(),
  });

  const clubs = clubsData || [];
  
  console.log('[CLUB_CONTEXT] Raw clubs data from tRPC:', clubsData);
  console.log('[CLUB_CONTEXT] Processed clubs:', clubs);
  console.log('[CLUB_CONTEXT] Is loading:', isLoading);

  // Auto-select first club if none selected
  useEffect(() => {
    console.log('[CLUB_CONTEXT] useEffect - selectedClub:', selectedClub, 'clubs.length:', clubs.length);
    if (!selectedClub && clubs.length > 0) {
      // Try to restore from localStorage
      const savedClubId = localStorage.getItem('selectedClubId');
      console.log('[CLUB_CONTEXT] Saved club ID from localStorage:', savedClubId);
      if (savedClubId) {
        const savedClub = clubs.find((c) => c.id === savedClubId);
        if (savedClub) {
          console.log('[CLUB_CONTEXT] Restoring saved club:', savedClub);
          setSelectedClubState(savedClub);
          return;
        }
      }
      // Otherwise select first club
      console.log('[CLUB_CONTEXT] Selecting first club:', clubs[0]);
      setSelectedClubState(clubs[0]);
    }
  }, [clubs, selectedClub]);

  const setSelectedClub = useCallback((club: Club | null) => {
    setSelectedClubState(club);
    if (club) {
      localStorage.setItem('selectedClubId', club.id);
    } else {
      localStorage.removeItem('selectedClubId');
    }
  }, []);

  return (
    <ClubContext.Provider value={{ selectedClub, clubs, setSelectedClub, isLoading }}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClubContext() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClubContext must be used within a ClubProvider');
  }
  return context;
}

