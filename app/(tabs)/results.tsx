import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';
import { useState, useEffect } from 'react';

type MatchCard = {
  vlrId: string;
  url: string;
  status: 'live' | 'upcoming' | 'completed';
  time: string;
  team1: {
    teamId: string | null;
    name: string;
    shortName: string;
    score: number;
    logoUrl: string;
  };
  team2: {
    teamId: string | null;
    name: string;
    shortName: string;
    score: number;
    logoUrl: string;
  };
  event: {
    eventId: string | null;
    name: string;
    series: string;
  };
};

export default function ResultsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedResults, setDisplayedResults] = useState<MatchCard[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<MatchCard[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 15;

  // Regular paginated query for when not searching
  const {
    results: regularResults,
    status: regularStatus,
    loadMore: regularLoadMore,
    isLoading: regularIsLoading,
  } = usePaginatedQuery(
    api.matches.getCompletedMatches,
    {},
    { initialNumItems: 15 }
  );

  // Search query
  const searchResults = useQuery(
    api.matches.searchCompletedMatches,
    searchTerm.trim() ? { searchTerm: searchTerm.trim() } : "skip"
  );

  // Handle search results
  useEffect(() => {
    if (searchTerm.trim()) {
      if (searchResults) {
        setAllSearchResults(searchResults);
        setCurrentPage(0);
        setDisplayedResults(searchResults.slice(0, itemsPerPage));
      }
    } else {
      setAllSearchResults([]);
      setDisplayedResults([]);
      setCurrentPage(0);
    }
  }, [searchTerm, searchResults]);

  // Handle regular results
  useEffect(() => {
    if (!searchTerm.trim() && regularResults) {
      setDisplayedResults(regularResults);
    }
  }, [regularResults, searchTerm]);

  const handleLoadMore = () => {
    if (searchTerm.trim()) {
      // Handle search pagination
      const nextPage = currentPage + 1;
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newResults = allSearchResults.slice(startIndex, endIndex);

      if (newResults.length > 0) {
        setDisplayedResults(prev => [...prev, ...newResults]);
        setCurrentPage(nextPage);
      }
    } else {
      // Handle regular pagination
      if (regularStatus === 'CanLoadMore') {
        regularLoadMore(15);
      }
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const isLoading = searchTerm.trim() ? false : regularIsLoading;
  const hasMore = searchTerm.trim()
    ? (currentPage + 1) * itemsPerPage < allSearchResults.length
    : regularStatus === 'CanLoadMore';

  if (regularStatus === 'LoadingFirstPage' && !searchTerm.trim()) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.textPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by team name, event, or series..."
          placeholderTextColor={Colors.textSecondary}
          value={searchTerm}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {displayedResults.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {searchTerm.trim() ? 'No matches found for your search.' : 'No completed matches found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedResults}
          keyExtractor={(item) => item.vlrId}
          renderItem={({ item }) => <MatchCard match={item} />}
          onEndReached={hasMore ? handleLoadMore : undefined}
          onEndReachedThreshold={0.5}
          contentInsetAdjustmentBehavior="automatic"
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 20 }} color={Colors.textPrimary} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textSecondary + '20',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.textSecondary + '15',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textSecondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    // fontFamily: 'Inter_400Regular', // Assuming you have this font loaded
    fontSize: 16,
  }
});

