import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';

export default function ResultsPage() {
  const {
    results,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.matches.getCompletedMatches, // Use the dedicated paginated query
    {}, // No extra args are needed for this query
    { initialNumItems: 15 },
  );

  const handleLoadMore = () => {
    if (status === 'CanLoadMore') {
      loadMore(15);
    }
  };

  if (status === 'LoadingFirstPage') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No completed matches found.</Text>
        </View>
      ) : (
        <FlatList
          data={results} // `results` is now the flat array of matches
          keyExtractor={(item) => item.vlrId}
          renderItem={({ item }) => <MatchCard match={item} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 20 }} color="#fff" /> : null}
        />
      )}
    </SafeAreaView>
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
  },
  emptyText: {
    color: '#A0A0A0',
    // fontFamily: 'Inter_400Regular', // Assuming you have this font loaded
    fontSize: 16,
  }
});

