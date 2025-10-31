import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import MatchCard from '../../components/MatchCard';
import { LoadingSpinner, EmptyState } from '../../components/LoadingStates';
import { useNetwork } from '../../providers/NetworkProvider';
import { useState, useEffect } from 'react';
import { trackEvent } from '@aptabase/react-native';
 

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
  const { isConnected, isInternetReachable } = useNetwork();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  

  const {
    results: displayedResults,
    status,
    loadMore,
    isLoading: queryIsLoading,
  } = usePaginatedQuery(
    api.matches.searchCompletedMatchesPaginated,
    { searchTerm: searchTerm.trim() },
    { initialNumItems: 15 }
  );

  const handleLoadMore = () => {
    if (status === 'CanLoadMore') {
      loadMore(15);
      
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchInput(text);
  };

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    setSearchTerm(trimmedSearch);
    
    // Track search event
    if (trimmedSearch) {
      trackEvent('user_search', {
        search_term: trimmedSearch,
      });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    
  };


  // Track search results when they load
  useEffect(() => {
    // no-op: tracking removed
  }, [status, displayedResults, searchTerm]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
  };

  const isLoading = queryIsLoading;
  const hasMore = status === 'CanLoadMore';

  // Handle different states
  const isOffline = !isConnected || isInternetReachable === false;
  const hasError = false;

  if (hasError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load matches. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'LoadingFirstPage') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner message="Loading completed matches..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.textSecondary}
          value={searchInput}
          onChangeText={handleSearchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling={false}
        />
        <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.helpButton}>
          <Text style={styles.helpButtonText} allowFontScaling={false}>?</Text>
        </TouchableOpacity>
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearButtonText} allowFontScaling={false}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {displayedResults.length === 0 ? (
        <EmptyState
          message={searchTerm.trim() ? 'No matches found for your search.' : 'No completed matches found.'}
          icon={searchTerm.trim() ? '🔍' : '🏆'}
        />
      ) : (
        <FlatList
          data={displayedResults}
          keyExtractor={(item) => item.vlrId}
          renderItem={({ item }) => <MatchCard match={item} showYear />}
          onEndReached={hasMore ? handleLoadMore : undefined}
          onEndReachedThreshold={0.5}
          contentInsetAdjustmentBehavior="automatic"
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 20 }} color={Colors.textPrimary} /> : null}
        />
      )}

      {/* Search Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHelpModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} allowFontScaling={false}>Search Help</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText} allowFontScaling={false}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.helpSectionTitle} allowFontScaling={false}>What can you search for?</Text>

              <View style={styles.helpItem}>
                <Text style={styles.helpItemTitle} allowFontScaling={false}>🏆 Team Names</Text>
                <Text style={styles.helpItemDescription} allowFontScaling={false}>
                  Search by full team name or short name
                </Text>
                <Text style={styles.helpExample} allowFontScaling={false}>
                  Examples: "Team Heretics", "TH", "NRG", "MIBR"
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpItemTitle} allowFontScaling={false}>⚔️ Head-to-Head Matchups</Text>
                <Text style={styles.helpItemDescription} allowFontScaling={false}>
                  Search for specific team vs team matchups
                </Text>
                <Text style={styles.helpExample} allowFontScaling={false}>
                  Examples: "TH vs NRG", "mibr vs nrg", "team heretics vs nrg"
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpItemTitle} allowFontScaling={false}>🏟️ Events & Tournaments</Text>
                <Text style={styles.helpItemDescription} allowFontScaling={false}>
                  Search by event name or tournament series
                </Text>
                <Text style={styles.helpExample} allowFontScaling={false}>
                  Examples: "VCT", "Champions", "Masters"
                </Text>
              </View>

              <View style={styles.helpItem}>
                <Text style={styles.helpItemTitle} allowFontScaling={false}>🧩 Combine Terms</Text>
                <Text style={styles.helpItemDescription} allowFontScaling={false}>
                  Separate multiple search terms with a comma
                </Text>
                <Text style={styles.helpExample} allowFontScaling={false}>
                  Examples: "g2, americas stage 2", "nrg vs prx, masters tokyo"
                </Text>
              </View>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 0,
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    fontFamily: 'Inter_600SemiBold',
  },
  helpButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  helpSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  helpItem: {
    marginBottom: 20,
  },
  helpItemTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  helpItemDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  helpExample: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
});

