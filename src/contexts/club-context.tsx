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

  // Auto-select first club if none selected
  useEffect(() => {
    if (!selectedClub && clubs.length > 0) {
      // Try to restore from localStorage
      const savedClubId = localStorage.getItem('selectedClubId');
      if (savedClubId) {
        const savedClub = clubs.find((c) => c.id === savedClubId);
        if (savedClub) {
          setSelectedClubState(savedClub);
          return;
        }
      }
      // Otherwise select first club
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

