import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';

/**
 * Friends List Screen
 *
 * Features:
 * - View friends list
 * - Pending friend requests
 * - Search for players
 * - Send/accept/decline friend requests
 * - Invite friends to battles
 */
export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { db, functions } = useFirebase();

  useEffect(() => {
    if (!user) return;

    // Listen to friends
    const friendsQuery = query(
      collection(db, 'friendships'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'accepted')
    );

    const unsubFriends = onSnapshot(friendsQuery, (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriends(friendsList);
    });

    // Listen to pending requests
    const requestsQuery = query(
      collection(db, 'friendships'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(requestsList);
    });

    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user, db]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchUsersFn = httpsCallable(functions, 'searchUsers');
      const result = await searchUsersFn({ query: searchQuery });
      setSearchResults((result.data as any).users || []);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      const sendRequestFn = httpsCallable(functions, 'sendFriendRequest');
      await sendRequestFn({ targetUserId });
      Alert.alert('Success', 'Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const acceptRequestFn = httpsCallable(functions, 'acceptFriendRequest');
      await acceptRequestFn({ friendshipId });
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      const declineRequestFn = httpsCallable(functions, 'declineFriendRequest');
      await declineRequestFn({ friendshipId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline request');
    }
  };

  const handleInviteToBattle = async (friendId: string) => {
    try {
      const inviteFn = httpsCallable(functions, 'inviteFriendToBattle');
      await inviteFn({ friendId });
      Alert.alert('Invite Sent!', 'Your friend has been invited to battle.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invite');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests ({requests.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Search
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <FriendCard friend={item} onInvite={() => handleInviteToBattle(item.friendId)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search for players to add!</Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onAccept={() => handleAcceptRequest(item.id)}
              onDecline={() => handleDeclineRequest(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📩</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      )}

      {activeTab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor="#5e5e6e"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </Pressable>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <UserSearchCard user={item} onSendRequest={() => handleSendRequest(item.id)} />
            )}
            ListEmptyComponent={
              searchQuery ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

function FriendCard({ friend, onInvite }: { friend: any; onInvite: () => void }) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.cardGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{friend.characterName?.[0] || 'F'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{friend.characterName || 'Friend'}</Text>
          <Text style={styles.cardClass}>{friend.characterClass || 'Unknown'}</Text>
        </View>
        <Pressable style={styles.inviteButton} onPress={onInvite}>
          <Text style={styles.inviteButtonText}>⚔️ Battle</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function RequestCard({ request, onAccept, onDecline }: { request: any; onAccept: () => void; onDecline: () => void }) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.cardGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{request.senderName?.[0] || 'R'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{request.senderName || 'Player'}</Text>
          <Text style={styles.cardClass}>Sent you a request</Text>
        </View>
        <View style={styles.requestButtons}>
          <Pressable style={[styles.requestButton, styles.acceptButton]} onPress={onAccept}>
            <Text style={styles.requestButtonText}>✓</Text>
          </Pressable>
          <Pressable style={[styles.requestButton, styles.declineButton]} onPress={onDecline}>
            <Text style={styles.requestButtonText}>✗</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function UserSearchCard({ user, onSendRequest }: { user: any; onSendRequest: () => void }) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.cardGradient}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name?.[0] || 'U'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{user.name}</Text>
          <Text style={styles.cardClass}>Level {user.level || 1}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={onSendRequest}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: '#4488ff', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#4488ff' },
  tabText: { fontSize: 14, color: '#8e8e93', fontWeight: '600' },
  tabTextActive: { color: '#4488ff' },
  listContent: { padding: 16, paddingTop: 0 },
  searchContainer: { flex: 1 },
  searchBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  searchInput: { flex: 1, backgroundColor: '#2a2a3e', borderRadius: 12, padding: 12, color: '#ffffff', fontSize: 16 },
  searchButton: { backgroundColor: '#4488ff', paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  searchButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  card: { marginBottom: 12 },
  cardGradient: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4488ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  cardClass: { fontSize: 12, color: '#8e8e93' },
  inviteButton: { backgroundColor: '#ff4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  inviteButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  requestButtons: { flexDirection: 'row', gap: 8 },
  requestButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  acceptButton: { backgroundColor: '#00ff00' },
  declineButton: { backgroundColor: '#ff4444' },
  requestButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  addButton: { backgroundColor: '#00ff00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#1a1a2e', fontSize: 14, fontWeight: 'bold' },
  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#8e8e93', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#5e5e6e' }
});
