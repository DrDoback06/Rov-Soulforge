import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Svg, Line, Circle } from 'react-native-svg';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import * as Haptics from 'expo-haptics';

interface QuestChainNode {
  quest: EnhancedQuest;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  position: { x: number; y: number };
}

interface QuestChainVisualizationProps {
  quests: EnhancedQuest[]; // All quests in the chain
  currentProgress?: Record<string, 'locked' | 'available' | 'in_progress' | 'completed'>;
  onQuestPress?: (quest: EnhancedQuest) => void;
}

/**
 * Quest Chain Visualization
 *
 * Visual tree showing quest progression with:
 * - Branching paths
 * - Locked/unlocked states
 * - Progress indicators
 * - Prerequisite connections
 * - Interactive nodes
 */
export function QuestChainVisualization({
  quests,
  currentProgress = {},
  onQuestPress
}: QuestChainVisualizationProps) {
  /**
   * Build quest chain graph with positions
   */
  const buildChainGraph = (): QuestChainNode[] => {
    const nodes: QuestChainNode[] = [];
    const nodeSpacingX = 180;
    const nodeSpacingY = 120;
    const startX = 40;
    const startY = 40;

    // Group quests by chain position
    const questsByPosition = new Map<number, EnhancedQuest[]>();

    quests.forEach(quest => {
      const position = quest.chainInfo?.position || 0;
      if (!questsByPosition.has(position)) {
        questsByPosition.set(position, []);
      }
      questsByPosition.get(position)!.push(quest);
    });

    // Calculate positions for each quest
    questsByPosition.forEach((questsAtPosition, position) => {
      questsAtPosition.forEach((quest, index) => {
        const x = startX + (position * nodeSpacingX);
        const y = startY + (index * nodeSpacingY);

        const status = currentProgress[quest.id] || (
          position === 0 ? 'available' : 'locked'
        );

        nodes.push({
          quest,
          status,
          position: { x, y }
        });
      });
    });

    return nodes;
  };

  /**
   * Get connections between quests
   */
  const getConnections = (nodes: QuestChainNode[]): Array<{ from: QuestChainNode; to: QuestChainNode }> => {
    const connections: Array<{ from: QuestChainNode; to: QuestChainNode }> = [];

    nodes.forEach(node => {
      if (node.quest.chainInfo?.nextQuestId) {
        const nextNode = nodes.find(n => n.quest.id === node.quest.chainInfo?.nextQuestId);
        if (nextNode) {
          connections.push({ from: node, to: nextNode });
        }
      }

      // Also check prerequisite quests
      if (node.quest.chainInfo?.previousQuestId) {
        const prevNode = nodes.find(n => n.quest.id === node.quest.chainInfo?.previousQuestId);
        if (prevNode) {
          connections.push({ from: prevNode, to: node });
        }
      }
    });

    return connections;
  };

  const getStatusColor = (status: QuestChainNode['status']) => {
    switch (status) {
      case 'completed': return { primary: '#22c55e', secondary: '#16a34a' };
      case 'in_progress': return { primary: '#f59e0b', secondary: '#d97706' };
      case 'available': return { primary: '#4488ff', secondary: '#2266dd' };
      case 'locked': return { primary: '#6b7280', secondary: '#4b5563' };
    }
  };

  const getStatusIcon = (status: QuestChainNode['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '▶';
      case 'available': return '!';
      case 'locked': return '🔒';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'epic': return '#a855f7';
      case 'legendary': return '#fbbf24';
      default: return '#4488ff';
    }
  };

  const nodes = buildChainGraph();
  const connections = getConnections(nodes);

  // Calculate SVG viewBox dimensions
  const maxX = Math.max(...nodes.map(n => n.position.x)) + 100;
  const maxY = Math.max(...nodes.map(n => n.position.y)) + 100;

  if (quests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔗</Text>
        <Text style={styles.emptyText}>No Quest Chain</Text>
        <Text style={styles.emptySubtext}>This quest is not part of a chain</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chain Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔗</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {quests[0]?.chainInfo?.chainName || 'Quest Chain'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {nodes.filter(n => n.status === 'completed').length}/{nodes.length} Completed
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(nodes.filter(n => n.status === 'completed').length / nodes.length) * 100}%`
              }
            ]}
          />
        </View>
      </View>

      {/* Chain Visualization */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ width: maxX, height: maxY }}>
          {/* Connection Lines */}
          <Svg height={maxY} width={maxX} style={styles.svg}>
            {connections.map((conn, index) => {
              const isUnlocked = conn.from.status === 'completed' || conn.from.status === 'in_progress';
              const lineColor = isUnlocked ? '#4488ff' : '#2a2a3e';
              const lineOpacity = isUnlocked ? 0.6 : 0.3;

              return (
                <Line
                  key={`line-${index}`}
                  x1={conn.from.position.x + 40}
                  y1={conn.from.position.y + 40}
                  x2={conn.to.position.x + 40}
                  y2={conn.to.position.y + 40}
                  stroke={lineColor}
                  strokeWidth="3"
                  strokeOpacity={lineOpacity}
                  strokeDasharray={isUnlocked ? "0" : "8,8"}
                />
              );
            })}

            {/* Arrow endpoints */}
            {connections.map((conn, index) => {
              const isUnlocked = conn.from.status === 'completed' || conn.from.status === 'in_progress';
              const circleColor = isUnlocked ? '#4488ff' : '#2a2a3e';

              return (
                <Circle
                  key={`arrow-${index}`}
                  cx={conn.to.position.x + 40}
                  cy={conn.to.position.y + 40}
                  r="6"
                  fill={circleColor}
                  opacity={isUnlocked ? 0.8 : 0.3}
                />
              );
            })}
          </Svg>

          {/* Quest Nodes */}
          {nodes.map((node, index) => {
            const colors = getStatusColor(node.status);
            const statusIcon = getStatusIcon(node.status);
            const difficultyColor = getDifficultyColor(node.quest.difficulty);

            return (
              <Animated.View
                key={node.quest.id}
                entering={ZoomIn.delay(index * 100)}
                style={[
                  styles.nodeContainer,
                  {
                    left: node.position.x,
                    top: node.position.y
                  }
                ]}
              >
                <Pressable
                  style={styles.node}
                  onPress={() => {
                    if (node.status !== 'locked' && onQuestPress) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onQuestPress(node.quest);
                    } else if (node.status === 'locked') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                  }}
                  disabled={node.status === 'locked'}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    style={styles.nodeGradient}
                  >
                    {/* Quest Icon */}
                    <View style={styles.nodeIconContainer}>
                      <Text style={styles.nodeIcon}>{node.quest.icon || '🎯'}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: colors.primary }
                    ]}>
                      <Text style={styles.statusIcon}>{statusIcon}</Text>
                    </View>

                    {/* Quest Info */}
                    <View style={styles.nodeInfo}>
                      <Text style={styles.nodeTitle} numberOfLines={2}>
                        {node.quest.title}
                      </Text>
                      <View style={styles.nodeMeta}>
                        <View style={[
                          styles.difficultyDot,
                          { backgroundColor: difficultyColor }
                        ]} />
                        <Text style={styles.nodeMetaText}>
                          {node.quest.difficulty}
                        </Text>
                      </View>

                      {/* Quest Position in Chain */}
                      <View style={styles.positionBadge}>
                        <Text style={styles.positionText}>
                          {node.quest.chainInfo?.position || 0 + 1}/
                          {node.quest.chainInfo?.totalQuests || quests.length}
                        </Text>
                      </View>
                    </View>

                    {/* Locked Overlay */}
                    {node.status === 'locked' && (
                      <View style={styles.lockedOverlay}>
                        <Text style={styles.lockedIcon}>🔒</Text>
                        <Text style={styles.lockedText}>Complete previous quest</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4488ff' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.legendText}>Locked</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden'
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
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2a2a3e',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3
  },
  scrollView: {
    maxHeight: 400
  },
  scrollContent: {
    padding: 20
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  nodeContainer: {
    position: 'absolute',
    width: 140,
    height: 180
  },
  node: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  nodeGradient: {
    flex: 1,
    padding: 12,
    position: 'relative'
  },
  nodeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  nodeIcon: {
    fontSize: 28
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  statusIcon: {
    fontSize: 12,
    color: '#fff'
  },
  nodeInfo: {
    flex: 1,
    gap: 4
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 16
  },
  nodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  nodeMetaText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  positionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  positionText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700'
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  lockedIcon: {
    fontSize: 32
  },
  lockedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12
  },
  legend: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    gap: 10
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase'
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12
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
  }
});
