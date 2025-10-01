import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

/**
 * Friendship status
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Friendship document
 */
export interface Friendship {
  id: string;
  users: [string, string]; // [sender, receiver]
  status: FriendshipStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * Send friend request
 * HTTPS Callable function
 */
export const sendFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetUid');
  }

  if (targetUid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot send friend request to yourself');
  }

  try {
    // Check if friendship already exists
    const existingFriendship = await db.collection('friendships')
      .where('users', 'array-contains', context.auth.uid)
      .get();

    const hasFriendship = existingFriendship.docs.some(doc => {
      const data = doc.data();
      return data.users.includes(targetUid);
    });

    if (hasFriendship) {
      throw new functions.https.HttpsError('already-exists', 'Friendship already exists');
    }

    // Create friendship
    const friendshipRef = db.collection('friendships').doc();

    const friendship: Friendship = {
      id: friendshipRef.id,
      users: [context.auth.uid, targetUid],
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await friendshipRef.set(friendship);

    // Send notification to target user (could use FCM here)
    // await sendNotification(targetUid, 'friend_request', context.auth.uid);

    return {
      friendshipId: friendshipRef.id,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error sending friend request:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to send friend request');
  }
});

/**
 * Accept friend request
 * HTTPS Callable function
 */
export const acceptFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { friendshipId } = data;

  if (!friendshipId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing friendshipId');
  }

  try {
    const friendshipRef = db.collection('friendships').doc(friendshipId);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Friendship not found');
    }

    const friendship = friendshipDoc.data() as Friendship;

    // Verify user is the receiver
    if (friendship.users[1] !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not the receiver of this request');
    }

    // Accept friendship
    await friendshipRef.update({
      status: 'accepted',
      updatedAt: Date.now()
    });

    // Send notification to sender
    // await sendNotification(friendship.users[0], 'friend_accepted', context.auth.uid);

    return {
      success: true,
      friendshipId
    };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to accept friend request');
  }
});

/**
 * Decline/Remove friend request
 * HTTPS Callable function
 */
export const declineFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { friendshipId } = data;

  if (!friendshipId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing friendshipId');
  }

  try {
    const friendshipRef = db.collection('friendships').doc(friendshipId);
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Friendship not found');
    }

    const friendship = friendshipDoc.data() as Friendship;

    // Verify user is part of the friendship
    if (!friendship.users.includes(context.auth.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Not part of this friendship');
    }

    // Delete friendship
    await friendshipRef.delete();

    return {
      success: true,
      friendshipId
    };
  } catch (error) {
    console.error('Error declining friend request:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to decline friend request');
  }
});

/**
 * Get friends list
 * HTTPS Callable function
 */
export const getFriends = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const friendships = await db.collection('friendships')
      .where('users', 'array-contains', context.auth.uid)
      .where('status', '==', 'accepted')
      .get();

    const friends = await Promise.all(
      friendships.docs.map(async (doc) => {
        const friendship = doc.data() as Friendship;
        const friendUid = friendship.users.find(uid => uid !== context.auth!.uid);

        if (!friendUid) return null;

        // Get friend's character info
        const charSnapshot = await db.collection('characters')
          .where('uid', '==', friendUid)
          .limit(1)
          .get();

        if (charSnapshot.empty) return null;

        const char = charSnapshot.docs[0].data();

        return {
          friendshipId: doc.id,
          uid: friendUid,
          characterId: char.id,
          characterName: char.classId || 'Adventurer',
          level: char.level,
          lastActive: Date.now() // Would track this in real implementation
        };
      })
    );

    return {
      friends: friends.filter(f => f !== null)
    };
  } catch (error) {
    console.error('Error getting friends:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get friends');
  }
});

/**
 * Get pending friend requests
 * HTTPS Callable function
 */
export const getPendingRequests = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    // Get requests where user is receiver
    const pendingRequests = await db.collection('friendships')
      .where('users', 'array-contains', context.auth.uid)
      .where('status', '==', 'pending')
      .get();

    const requests = await Promise.all(
      pendingRequests.docs.map(async (doc) => {
        const friendship = doc.data() as Friendship;

        // Only return requests where user is receiver
        if (friendship.users[1] !== context.auth!.uid) {
          return null;
        }

        const senderUid = friendship.users[0];

        // Get sender's character info
        const charSnapshot = await db.collection('characters')
          .where('uid', '==', senderUid)
          .limit(1)
          .get();

        if (charSnapshot.empty) return null;

        const char = charSnapshot.docs[0].data();

        return {
          friendshipId: doc.id,
          uid: senderUid,
          characterId: char.id,
          characterName: char.classId || 'Adventurer',
          level: char.level,
          createdAt: friendship.createdAt
        };
      })
    );

    return {
      requests: requests.filter(r => r !== null)
    };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get pending requests');
  }
});

/**
 * Invite friend to battle
 * HTTPS Callable function
 */
export const inviteFriendToBattle = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { friendUid, battleMode } = data;

  if (!friendUid || !battleMode) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing friendUid or battleMode');
  }

  try {
    // Verify friendship
    const friendships = await db.collection('friendships')
      .where('users', 'array-contains', context.auth.uid)
      .where('status', '==', 'accepted')
      .get();

    const isFriend = friendships.docs.some(doc => {
      const friendship = doc.data() as Friendship;
      return friendship.users.includes(friendUid);
    });

    if (!isFriend) {
      throw new functions.https.HttpsError('permission-denied', 'Not friends with this user');
    }

    // Create battle invite
    const inviteRef = db.collection('battleInvites').doc();

    await inviteRef.set({
      id: inviteRef.id,
      fromUid: context.auth.uid,
      toUid: friendUid,
      battleMode,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    // Send notification
    // await sendNotification(friendUid, 'battle_invite', context.auth.uid);

    return {
      inviteId: inviteRef.id
    };
  } catch (error) {
    console.error('Error inviting friend to battle:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to invite friend');
  }
});

/**
 * Search users by name
 * HTTPS Callable function
 */
export const searchUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { query, limit = 20 } = data;

  if (!query || query.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Query must be at least 2 characters');
  }

  try {
    // Search characters by class name (simplified search)
    // In production, use Algolia or similar for better search
    const results = await db.collection('characters')
      .orderBy('classId')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(limit)
      .get();

    const users = results.docs
      .filter(doc => doc.data().uid !== context.auth!.uid)
      .map(doc => {
        const char = doc.data();
        return {
          uid: char.uid,
          characterId: char.id,
          characterName: char.classId || 'Adventurer',
          level: char.level
        };
      });

    return { users };
  } catch (error) {
    console.error('Error searching users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to search users');
  }
});