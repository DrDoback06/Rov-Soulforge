import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { createCharacter } from '@/hooks/useCharacter';
import type { Alignment, ClassId } from '@rov/types';

/**
 * Sign Up Screen
 * Create new account with character selection
 */
export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [characterClass, setCharacterClass] = useState<ClassId | ''>('');
  const [alignment, setAlignment] = useState<Alignment>('Neutral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();
  const { db } = useFirebase();

  const handleSignUp = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!characterClass) {
      setError('Please select a character class');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Firebase auth account
      const userCredential = await signUp(email, password);

      // Create character in Firestore
      await createCharacter(userCredential.user.uid, characterClass, alignment, db);

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const classes = [
    'Warrior', 'Mage', 'Rogue', 'Paladin',
    'Ranger', 'Necromancer', 'Bard', 'Druid'
  ];

  const alignments: Alignment[] = ['Holy', 'Chaos', 'Arcane', 'Neutral'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Begin your adventure</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#5e5e6e"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#5e5e6e"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#5e5e6e"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Character Class</Text>
            <View style={styles.classGrid}>
              {classes.map((cls) => (
                <Pressable
                  key={cls}
                  style={[
                    styles.classButton,
                    characterClass === cls && styles.classButtonActive
                  ]}
                  onPress={() => setCharacterClass(cls)}
                >
                  <Text
                    style={[
                      styles.classButtonText,
                      characterClass === cls && styles.classButtonTextActive
                    ]}
                  >
                    {cls}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alignment</Text>
            <View style={styles.alignmentRow}>
              {alignments.map((align) => (
                <Pressable
                  key={align}
                  style={[
                    styles.alignmentButton,
                    alignment === align && styles.alignmentButtonActive
                  ]}
                  onPress={() => setAlignment(align)}
                >
                  <Text
                    style={[
                      styles.alignmentButtonText,
                      alignment === align && styles.alignmentButtonTextActive
                    ]}
                  >
                    {align}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 60,
    paddingBottom: 100
  },
  header: {
    marginBottom: 32
  },
  backButton: {
    marginBottom: 24
  },
  backButtonText: {
    fontSize: 16,
    color: '#4488ff'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93'
  },
  form: {
    gap: 24
  },
  inputContainer: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#4a4a5e'
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  classButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  classButtonActive: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  classButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  classButtonTextActive: {
    color: '#ffffff'
  },
  alignmentRow: {
    flexDirection: 'row',
    gap: 8
  },
  alignmentButton: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  alignmentButtonActive: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  alignmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  alignmentButtonTextActive: {
    color: '#ffffff'
  },
  error: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center'
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#4488ff'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});