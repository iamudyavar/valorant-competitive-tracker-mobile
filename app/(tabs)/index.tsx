import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';
import { useState, useCallback } from 'react';

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
  const [refreshing, setRefreshing] = useState(false);

  // Use the new, optimized query for the home page
  const matchesData = useQuery(api.matches.getHomePageMatches, {
    upcomingLimit: 10,
  });

  // This is a mock refetch function. In a real app, you might use convex's `usePaginatedQuery`
  // or other mechanisms to truly refetch. For now, we simulate with a state.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In a real app, you would invalidate the query here.
    // For this example, we'll just simulate a delay.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);


  if (matchesData === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const { live, upcoming } = matchesData;

  const isEmpty = live.length === 0 && upcoming.length === 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No live or upcoming matches.</Text>
        </View>
      ) : (
        <>
          <Section title="Live" data={live} />
          <Section title="Upcoming" data={upcoming} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    // fontFamily: 'Inter_700Bold', // Assuming you have this font loaded
    fontWeight: '700',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 10,
  },
  emptyText: {
    color: '#A0A0A0',
    // fontFamily: 'Inter_400Regular', // Assuming you have this font loaded
    fontSize: 16,
  }
});
