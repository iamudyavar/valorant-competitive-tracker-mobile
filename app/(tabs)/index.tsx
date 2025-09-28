import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';
import { LoadingSpinner, SlowConnectionState, EmptyState } from '../../components/LoadingStates';
import { useNetwork } from '../../providers/NetworkProvider';
import { useState, useEffect } from 'react';

const Section = ({ title, data }: { title: string, data: any[] | undefined }) => {
  if (!data || data.length === 0) {
    return null; // Don't render section if there's no data
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((match) => (
        <MatchCard key={match.vlrId} match={match} />
      ))}
    </View>
  );
};


export default function HomePage() {
  const { isConnected, isInternetReachable } = useNetwork();
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const matchesData = useQuery(api.matches.getHomePageMatches, {
    upcomingLimit: 10,
  });

  // Detect slow connections
  useEffect(() => {
    if (matchesData === undefined && isConnected && isInternetReachable) {
      const timer = setTimeout(() => {
        setIsSlowConnection(true);
      }, 3000); // Consider slow after 3 seconds

      return () => clearTimeout(timer);
    } else {
      setIsSlowConnection(false);
    }
  }, [matchesData, isConnected, isInternetReachable]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsSlowConnection(false);
  };

  // Handle different states
  const isOffline = !isConnected || isInternetReachable === false;
  const isLoading = matchesData === undefined && !isOffline;
  const hasError = matchesData === null;

  if (hasError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load matches. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    if (isSlowConnection) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <SlowConnectionState />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner message="Loading matches..." />
      </SafeAreaView>
    );
  }

  const { live, upcoming } = matchesData || { live: [], upcoming: [] };
  const isEmpty = live.length === 0 && upcoming.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
      >
        {isEmpty ? (
          <EmptyState
            message="No live or upcoming matches at the moment."
            icon="🏆"
          />
        ) : (
          <>
            <Section title="Live" data={live} />
            <Section title="Upcoming" data={upcoming} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200, // Ensure centered view has height within ScrollView
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginLeft: 16,
    marginBottom: 10,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  }
});
