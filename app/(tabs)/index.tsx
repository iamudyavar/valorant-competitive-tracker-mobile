import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Colors } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';

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
  const matchesData = useQuery(api.matches.getHomePageMatches, {
    upcomingLimit: 10,
  });


  if (matchesData === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.textPrimary} />
      </View>
    );
  }

  const { live, upcoming } = matchesData;

  const isEmpty = live.length === 0 && upcoming.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
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
    // fontFamily: 'Inter_700Bold', // Assuming you have this font loaded
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 16,
    marginBottom: 10,
  },
  emptyText: {
    color: Colors.textSecondary,
    // fontFamily: 'Inter_400Regular', // Assuming you have this font loaded
    fontSize: 16,
  }
});
