import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Party System Hook
 *
 * Manages party creation, invites, members, and shared quest routing
 * Supports real-time synchronization for co-op gameplay
 */

export interface PartyMember {
  uid: string;
  username: string;
  level: number;
  avatar?: string;
  status: 'online' | 'offline' | 'in_quest';
  joinedAt: Date;
}

export interface Party {
  id: string;
  leaderId: string;
  leaderName: string;
  memberIds: string[]; // max 4 including leader
  members: PartyMember[];

  // Active routing
  activeQuestIds: string[]; // ordered list for multi-stop routing
  routeOptimized: boolean;
  currentQuestIndex: number;
  navigating: boolean;

  // Settings
  lootDistribution: 'equal' | 'proximity' | 'contribution';
  partyName?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyInvite {
  id: string;
  partyId: string;
  partyName?: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

const MAX_PARTY_SIZE = 4;
const INVITE_EXPIRY_HOURS = 24;

export function useParty(db: Firestore | null, userId: string | undefined) {
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PartyInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load current party for user
   */
  const loadCurrentParty = useCallback(async () => {
    if (!db || !userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Find party where user is a member
      const q = query(
        collection(db, 'parties'),
        where('memberIds', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const partyDoc = snapshot.docs[0];
        const partyData = {
          id: partyDoc.id,
          ...partyDoc.data(),
          createdAt: partyDoc.data().createdAt?.toDate(),
          updatedAt: partyDoc.data().updatedAt?.toDate()
        } as Party;

        setCurrentParty(partyData);
      } else {
        setCurrentParty(null);
      }
    } catch (err) {
      console.error('Error loading party:', err);
      setError('Failed to load party');
    } finally {
      setIsLoading(false);
    }
  }, [db, userId]);

  /**
   * Load pending invites for user
   */
  const loadPendingInvites = useCallback(async () => {
    if (!db || !userId) return;

    try {
      const q = query(
        collection(db, 'partyInvites'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const invites: PartyInvite[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as PartyInvite[];

      // Filter out expired invites
      const now = new Date();
      const validInvites = invites.filter(invite => invite.expiresAt > now);

      setPendingInvites(validInvites);
    } catch (err) {
      console.error('Error loading invites:', err);
    }
  }, [db, userId]);

  /**
   * Create a new party
   */
  const createParty = useCallback(async (
    partyName?: string,
    lootDistribution: 'equal' | 'proximity' | 'contribution' = 'equal'
  ): Promise<string | null> => {
    if (!db || !userId) return null;

    // Check if user is already in a party
    if (currentParty) {
      setError('You are already in a party. Leave your current party first.');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user profile for leader name
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
      const username = userDoc.docs[0]?.data()?.username || 'Unknown';

      const now = new Date();
      const partyData = {
        leaderId: userId,
        leaderName: username,
        memberIds: [userId],
        members: [{
          uid: userId,
          username,
          level: userDoc.docs[0]?.data()?.level || 1,
          status: 'online',
          joinedAt: now
        }],
        activeQuestIds: [],
        routeOptimized: false,
        currentQuestIndex: 0,
        navigating: false,
        lootDistribution,
        partyName: partyName || `${username}'s Party`,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(collection(db, 'parties'), partyData);
      console.log('✅ Party created:', docRef.id);

      await loadCurrentParty();
      return docRef.id;
    } catch (err) {
      console.error('Error creating party:', err);
      setError('Failed to create party');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [db, userId, currentParty, loadCurrentParty]);

  /**
   * Leave current party
   */
  const leaveParty = useCallback(async (): Promise<boolean> => {
    if (!db || !userId || !currentParty) return false;

    try {
      setIsLoading(true);
      setError(null);

      const partyRef = doc(db, 'parties', currentParty.id);

      if (currentParty.leaderId === userId) {
        // If leader leaves, disband party
        await deleteDoc(partyRef);
        console.log('✅ Party disbanded');
      } else {
        // Remove member from party
        const newMemberIds = currentParty.memberIds.filter(id => id !== userId);
        const newMembers = currentParty.members.filter(m => m.uid !== userId);

        await updateDoc(partyRef, {
          memberIds: newMemberIds,
          members: newMembers,
          updatedAt: Timestamp.fromDate(new Date())
        });
        console.log('✅ Left party');
      }

      setCurrentParty(null);
      return true;
    } catch (err) {
      console.error('Error leaving party:', err);
      setError('Failed to leave party');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [db, userId, currentParty]);

  /**
   * Send party invite to another user
   */
  const sendInvite = useCallback(async (targetUserId: string, targetUsername: string): Promise<boolean> => {
    if (!db || !userId || !currentParty) return false;

    // Only leader can send invites
    if (currentParty.leaderId !== userId) {
      setError('Only the party leader can send invites');
      return false;
    }

    // Check party size limit
    if (currentParty.memberIds.length >= MAX_PARTY_SIZE) {
      setError(`Party is full (max ${MAX_PARTY_SIZE} members)`);
      return false;
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

      const inviteData = {
        partyId: currentParty.id,
        partyName: currentParty.partyName,
        fromUserId: userId,
        fromUserName: currentParty.leaderName,
        toUserId: targetUserId,
        status: 'pending',
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.fromDate(now)
      };

      await addDoc(collection(db, 'partyInvites'), inviteData);
      console.log('✅ Invite sent to:', targetUsername);
      return true;
    } catch (err) {
      console.error('Error sending invite:', err);
      setError('Failed to send invite');
      return false;
    }
  }, [db, userId, currentParty]);

  /**
   * Accept party invite
   */
  const acceptInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!db || !userId) return false;

    // Check if already in a party
    if (currentParty) {
      setError('Leave your current party before joining another');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get invite
      const inviteDoc = await getDocs(query(collection(db, 'partyInvites'), where('__name__', '==', inviteId)));
      if (inviteDoc.empty) {
        setError('Invite not found');
        return false;
      }

      const invite = inviteDoc.docs[0].data() as PartyInvite;

      // Get party
      const partyDoc = await getDocs(query(collection(db, 'parties'), where('__name__', '==', invite.partyId)));
      if (partyDoc.empty) {
        setError('Party not found');
        return false;
      }

      const party = { id: partyDoc.docs[0].id, ...partyDoc.docs[0].data() } as Party;

      // Check if party is full
      if (party.memberIds.length >= MAX_PARTY_SIZE) {
        setError('Party is full');
        return false;
      }

      // Get user profile
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
      const username = userDoc.docs[0]?.data()?.username || 'Unknown';
      const level = userDoc.docs[0]?.data()?.level || 1;

      const newMember: PartyMember = {
        uid: userId,
        username,
        level,
        status: 'online',
        joinedAt: new Date()
      };

      // Add user to party
      await updateDoc(doc(db, 'parties', party.id), {
        memberIds: [...party.memberIds, userId],
        members: [...party.members, newMember],
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Mark invite as accepted
      await updateDoc(doc(db, 'partyInvites', inviteId), {
        status: 'accepted'
      });

      console.log('✅ Joined party:', party.partyName);
      await loadCurrentParty();
      await loadPendingInvites();
      return true;
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to join party');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [db, userId, currentParty, loadCurrentParty, loadPendingInvites]);

  /**
   * Decline party invite
   */
  const declineInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!db) return false;

    try {
      await updateDoc(doc(db, 'partyInvites', inviteId), {
        status: 'declined'
      });

      await loadPendingInvites();
      return true;
    } catch (err) {
      console.error('Error declining invite:', err);
      return false;
    }
  }, [db, loadPendingInvites]);

  /**
   * Real-time party updates
   */
  useEffect(() => {
    if (!db || !userId || !currentParty) return;

    const unsubscribe = onSnapshot(
      doc(db, 'parties', currentParty.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const updatedParty = {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate(),
            updatedAt: snapshot.data().updatedAt?.toDate()
          } as Party;

          setCurrentParty(updatedParty);
        } else {
          // Party was disbanded
          setCurrentParty(null);
        }
      }
    );

    return () => unsubscribe();
  }, [db, userId, currentParty?.id]);

  /**
   * Load initial data
   */
  useEffect(() => {
    if (db && userId) {
      loadCurrentParty();
      loadPendingInvites();
    }
  }, [db, userId, loadCurrentParty, loadPendingInvites]);

  return {
    currentParty,
    pendingInvites,
    isLoading,
    error,
    isLeader: currentParty?.leaderId === userId,
    canInvite: currentParty?.leaderId === userId && currentParty.memberIds.length < MAX_PARTY_SIZE,
    createParty,
    leaveParty,
    sendInvite,
    acceptInvite,
    declineInvite,
    loadCurrentParty,
    loadPendingInvites
  };
}
