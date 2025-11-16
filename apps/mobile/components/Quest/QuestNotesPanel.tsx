import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase-context';
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
  Timestamp,
  orderBy
} from 'firebase/firestore';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface QuestNote {
  id: string;
  questId: string;
  userId: string;
  username: string;
  text: string;
  visibility: 'private' | 'party' | 'public';
  createdAt: Date;
  updatedAt?: Date;
}

interface QuestNotesPanelProps {
  questId: string;
  partyId?: string | null;
  onClose?: () => void;
}

/**
 * Quest Notes Panel
 *
 * Collaborative note-taking system for quests:
 * - Private notes (only you)
 * - Party notes (shared with party members)
 * - Public notes (visible to everyone)
 * - Real-time updates
 * - Edit/delete own notes
 * - Helpful tips and strategies
 */
export function QuestNotesPanel({
  questId,
  partyId,
  onClose
}: QuestNotesPanelProps) {
  const { db, user } = useFirebase();

  const [notes, setNotes] = useState<QuestNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteVisibility, setNewNoteVisibility] = useState<'private' | 'party' | 'public'>('private');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'party' | 'public'>('all');

  /**
   * Load notes for quest
   */
  useEffect(() => {
    if (!db || !questId) return;

    setIsLoading(true);

    // Build query based on active tab
    let q;
    if (activeTab === 'all') {
      // Show all notes visible to user
      q = query(
        collection(db, 'questNotes'),
        where('questId', '==', questId),
        orderBy('createdAt', 'desc')
      );
    } else if (activeTab === 'private') {
      q = query(
        collection(db, 'questNotes'),
        where('questId', '==', questId),
        where('userId', '==', user?.uid),
        where('visibility', '==', 'private'),
        orderBy('createdAt', 'desc')
      );
    } else if (activeTab === 'party') {
      q = query(
        collection(db, 'questNotes'),
        where('questId', '==', questId),
        where('visibility', '==', 'party'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'questNotes'),
        where('questId', '==', questId),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc')
      );
    }

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedNotes: QuestNote[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Filter based on visibility
        if (data.visibility === 'private' && data.userId !== user?.uid) {
          return; // Skip private notes from other users
        }

        if (data.visibility === 'party' && !partyId) {
          return; // Skip party notes if not in a party
        }

        loadedNotes.push({
          id: doc.id,
          questId: data.questId,
          userId: data.userId,
          username: data.username,
          text: data.text,
          visibility: data.visibility,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      setNotes(loadedNotes);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, questId, user?.uid, partyId, activeTab]);

  /**
   * Add new note
   */
  const handleAddNote = async () => {
    if (!db || !user || !newNoteText.trim()) return;

    try {
      // Get username
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const username = userDoc.docs[0]?.data()?.username || 'Unknown';

      await addDoc(collection(db, 'questNotes'), {
        questId,
        userId: user.uid,
        username,
        text: newNoteText.trim(),
        visibility: newNoteVisibility,
        createdAt: Timestamp.fromDate(new Date())
      });

      setNewNoteText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  /**
   * Update note
   */
  const handleUpdateNote = async (noteId: string) => {
    if (!db || !editingText.trim()) return;

    try {
      await updateDoc(doc(db, 'questNotes', noteId), {
        text: editingText.trim(),
        updatedAt: Timestamp.fromDate(new Date())
      });

      setEditingNoteId(null);
      setEditingText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  /**
   * Delete note
   */
  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'questNotes', noteId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private': return '🔒';
      case 'party': return '👥';
      case 'public': return '🌍';
      default: return '';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'private': return ['#6b7280', '#4b5563'];
      case 'party': return ['#4488ff', '#2266dd'];
      case 'public': return ['#22c55e', '#16a34a'];
      default: return ['#4488ff', '#2266dd'];
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📝</Text>
          <Text style={styles.headerTitle}>Quest Notes</Text>
          {onClose && (
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['all', 'private', 'party', 'public'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes List */}
        <ScrollView
          style={styles.notesList}
          contentContainerStyle={styles.notesContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading notes...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No notes yet</Text>
              <Text style={styles.emptySubtext}>
                Add a note to help yourself or others with this quest
              </Text>
            </View>
          ) : (
            notes.map((note, index) => {
              const isOwn = note.userId === user?.uid;
              const isEditing = editingNoteId === note.id;
              const colors = getVisibilityColor(note.visibility);

              return (
                <Animated.View
                  key={note.id}
                  entering={FadeInDown.delay(index * 50)}
                  exiting={FadeOutUp}
                  style={styles.noteCard}
                >
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.noteAccent}
                  />

                  <View style={styles.noteContent}>
                    {/* Note Header */}
                    <View style={styles.noteHeader}>
                      <View style={styles.noteAuthor}>
                        <Text style={styles.noteUsername}>
                          {isOwn ? 'You' : note.username}
                        </Text>
                        <View style={styles.visibilityBadge}>
                          <Text style={styles.visibilityIcon}>
                            {getVisibilityIcon(note.visibility)}
                          </Text>
                          <Text style={styles.visibilityText}>
                            {note.visibility}
                          </Text>
                        </View>
                      </View>

                      {isOwn && (
                        <View style={styles.noteActions}>
                          {!isEditing && (
                            <>
                              <Pressable
                                style={styles.noteActionButton}
                                onPress={() => {
                                  setEditingNoteId(note.id);
                                  setEditingText(note.text);
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                              >
                                <Text style={styles.noteActionIcon}>✏️</Text>
                              </Pressable>
                              <Pressable
                                style={styles.noteActionButton}
                                onPress={() => handleDeleteNote(note.id)}
                              >
                                <Text style={styles.noteActionIcon}>🗑️</Text>
                              </Pressable>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Note Text */}
                    {isEditing ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editingText}
                          onChangeText={setEditingText}
                          multiline
                          autoFocus
                        />
                        <View style={styles.editActions}>
                          <Pressable
                            style={[styles.editButton, styles.cancelButton]}
                            onPress={() => {
                              setEditingNoteId(null);
                              setEditingText('');
                            }}
                          >
                            <Text style={styles.editButtonText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.editButton, styles.saveButton]}
                            onPress={() => handleUpdateNote(note.id)}
                          >
                            <LinearGradient
                              colors={['#22c55e', '#16a34a']}
                              style={styles.saveGradient}
                            >
                              <Text style={styles.saveButtonText}>Save</Text>
                            </LinearGradient>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noteText}>{note.text}</Text>
                    )}

                    {/* Note Footer */}
                    <Text style={styles.noteDate}>
                      {formatDate(note.createdAt)}
                      {note.updatedAt && ' (edited)'}
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>

        {/* Add Note Form */}
        <View style={styles.addNoteContainer}>
          <View style={styles.visibilitySelector}>
            {(['private', 'party', 'public'] as const).map(vis => (
              <Pressable
                key={vis}
                style={[
                  styles.visibilityOption,
                  newNoteVisibility === vis && styles.visibilityOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewNoteVisibility(vis);
                }}
                disabled={vis === 'party' && !partyId}
              >
                <Text style={styles.visibilityOptionIcon}>
                  {getVisibilityIcon(vis)}
                </Text>
                <Text style={[
                  styles.visibilityOptionText,
                  newNoteVisibility === vis && styles.visibilityOptionTextSelected,
                  vis === 'party' && !partyId && styles.visibilityOptionDisabled
                ]}>
                  {vis}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newNoteText}
              onChangeText={setNewNoteText}
              placeholder="Add a helpful note..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendButton, !newNoteText.trim() && styles.sendButtonDisabled]}
              onPress={handleAddNote}
              disabled={!newNoteText.trim()}
            >
              <LinearGradient
                colors={newNoteText.trim() ? ['#4488ff', '#2266dd'] : ['#6b7280', '#4b5563']}
                style={styles.sendGradient}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.charCount}>{newNoteText.length}/500</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden'
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    gap: 12
  },
  headerIcon: {
    fontSize: 24
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700'
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4488ff'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280'
  },
  tabTextActive: {
    color: '#4488ff'
  },
  notesList: {
    flex: 1
  },
  notesContent: {
    padding: 16,
    gap: 12
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e93'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12
  },
  emptyIcon: {
    fontSize: 48
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center'
  },
  noteCard: {
    backgroundColor: '#232336',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row'
  },
  noteAccent: {
    width: 4
  },
  noteContent: {
    flex: 1,
    padding: 12,
    gap: 8
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  noteAuthor: {
    flex: 1,
    gap: 6
  },
  noteUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  visibilityIcon: {
    fontSize: 10
  },
  visibilityText: {
    fontSize: 10,
    color: '#8e8e93',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8
  },
  noteActionButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noteActionIcon: {
    fontSize: 16
  },
  noteText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20
  },
  noteDate: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  editContainer: {
    gap: 8
  },
  editInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#fff',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  editActions: {
    flexDirection: 'row',
    gap: 8
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden'
  },
  cancelButton: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 8,
    alignItems: 'center'
  },
  saveButton: {},
  saveGradient: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff'
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff'
  },
  addNoteContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    padding: 16,
    gap: 12
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 8
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#232336',
    borderWidth: 1,
    borderColor: '#2a2a3e'
  },
  visibilityOptionSelected: {
    borderColor: '#4488ff',
    backgroundColor: 'rgba(68, 136, 255, 0.1)'
  },
  visibilityOptionIcon: {
    fontSize: 14
  },
  visibilityOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'capitalize'
  },
  visibilityOptionTextSelected: {
    color: '#fff'
  },
  visibilityOptionDisabled: {
    opacity: 0.3
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#232336',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    maxHeight: 100,
    textAlignVertical: 'top'
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden'
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff'
  },
  charCount: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right'
  }
});
