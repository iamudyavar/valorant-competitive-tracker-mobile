import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable, Dimensions } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

// Type definitions based on the Convex schema
interface PlayerStats {
    playerId: string | null;
    playerName: string;
    teamName: string;
    agent: {
        name: string | null;
        iconUrl: string | null;
    };
    stats: {
        kills: number;
        deaths: number;
        assists: number;
        acs: number;
        adr: number;
        kastPercent: number;
        headshotPercent: number;
        firstKills: number;
        firstDeaths: number;
    };
}

interface MapData {
    name: string;
    status: string;
    pickedBy: string | null;
    team1Score: number;
    team2Score: number;
    stats: PlayerStats[];
    rounds: Array<{
        roundNumber: number;
        winningTeam: string | null;
        winCondition: string | null;
    }>;
}

interface MatchData {
    vlrId: string;
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
    maps: MapData[];
}

const { width } = Dimensions.get('window');



// Match header component
const MatchHeader = ({ match }: { match: MatchData }) => (
    <View style={styles.matchHeader}>
        <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{match.event.name}</Text>
            <Text style={styles.eventSeries}>{match.event.series}</Text>
        </View>

        <View style={styles.teamsContainer}>
            <View style={styles.teamHeaderSection}>
                <Image source={{ uri: match.team1.logoUrl }} style={styles.teamLogo} />
                <Text style={styles.teamName}>{match.team1.name}</Text>
            </View>

            <View style={styles.scoreSection}>
                <Text style={styles.scoreText}>{match.team1.score} - {match.team2.score}</Text>
                <View style={[styles.statusBadge, match.status === 'live' && styles.liveBadge]}>
                    <Text style={[styles.statusText, match.status === 'live' && styles.liveText]}>
                        {match.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.teamHeaderSection}>
                <Image source={{ uri: match.team2.logoUrl }} style={styles.teamLogo} />
                <Text style={styles.teamName}>{match.team2.name}</Text>
            </View>
        </View>
    </View>
);

// Map tab component
const MapTab = ({ map, isActive, onPress }: { map: MapData; isActive: boolean; onPress: () => void }) => (
    <Pressable
        style={[styles.mapTab, isActive && styles.activeMapTab]}
        onPress={onPress}
    >
        <Text style={[styles.mapTabText, isActive && styles.activeMapTabText]}>
            {map.name}
        </Text>
    </Pressable>
);


// Player stats row component
const PlayerStatsRow = ({ player }: { player: PlayerStats }) => {
    return (
        <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
                {player.agent.iconUrl && (
                    <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                )}
                <Text style={styles.playerName}>{player.playerName}</Text>
            </View>
            <Text style={styles.acsText}>{player.stats.acs}</Text>
            <Text style={styles.kdaText}>
                {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
            </Text>
        </View>
    );
};

// Map stats component
const MapStats = ({ map, match }: { map: MapData; match: MatchData }) => {
    const team1Players = map.stats.filter(p => p.teamName === match.team1.name);
    const team2Players = map.stats.filter(p => p.teamName === match.team2.name);

    return (
        <View style={styles.mapStatsContainer}>
            <View style={styles.mapHeader}>
                <View style={styles.mapInfo}>
                    <Text style={styles.mapName}>{map.name}</Text>
                    {map.pickedBy && (
                        <Text style={styles.mapPickInfo}>
                            Picked by {map.pickedBy === match.team1.name ? match.team1.name : match.team2.name}
                        </Text>
                    )}
                </View>
                <Text style={styles.mapScore}>{map.team1Score} - {map.team2Score}</Text>
            </View>

            <View style={styles.statsTable}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.playerHeader]}>Player</Text>
                    <Text style={[styles.headerCell, styles.acsHeader]}>ACS</Text>
                    <Text style={[styles.headerCell, styles.kdaHeader]}>K/D/A</Text>
                </View>

                {/* Team 1 Players */}
                <View style={styles.teamSection}>
                    <Text style={styles.teamLabel}>{match.team1.name}</Text>
                    {team1Players.map((player, index) => (
                        <PlayerStatsRow key={index} player={player} />
                    ))}
                </View>

                {/* Team 2 Players */}
                <View style={styles.teamSection}>
                    <Text style={styles.teamLabel}>{match.team2.name}</Text>
                    {team2Players.map((player, index) => (
                        <PlayerStatsRow key={index} player={player} />
                    ))}
                </View>
            </View>
        </View>
    );
};

export default function MatchDetailPage() {
    const { vlrId } = useLocalSearchParams();
    const match = useQuery(api.matches.getMatchById, { vlrId: vlrId as string }) as MatchData | null | undefined;

    const [selectedMapIndex, setSelectedMapIndex] = useState(0);

    if (!match) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (match === null) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Match not found.</Text>
            </View>
        );
    }

    // Filter out unplayed maps
    const playedMaps = match.maps.filter((map: MapData) => map.status !== 'unplayed' && map.status !== 'upcoming');

    if (playedMaps.length === 0) {
        return (
            <ScrollView style={styles.container}>
                <MatchHeader match={match} />
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No map data available yet</Text>
                </View>
            </ScrollView>
        );
    }

    const currentMap = playedMaps[selectedMapIndex];

    return (
        <ScrollView style={styles.container}>
            <MatchHeader match={match} />

            {/* Map Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mapTabsContainer}>
                {playedMaps.map((map, index) => (
                    <MapTab
                        key={index}
                        map={map}
                        isActive={index === selectedMapIndex}
                        onPress={() => setSelectedMapIndex(index)}
                    />
                ))}
            </ScrollView>

            {/* Map Stats */}
            <MapStats map={currentMap} match={match} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
    },
    errorText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },
    noDataContainer: {
        padding: 40,
        alignItems: 'center',
    },
    noDataText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },

    // Match Header Styles
    matchHeader: {
        backgroundColor: '#1A1A1A',
        padding: 20,
        marginBottom: 8,
    },
    eventInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    eventName: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        marginBottom: 4,
    },
    eventSeries: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },
    teamsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    teamHeaderSection: {
        alignItems: 'center',
        flex: 1,
    },
    teamLogo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    teamName: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        textAlign: 'center',
    },
    scoreSection: {
        alignItems: 'center',
        marginHorizontal: 20,
    },
    scoreText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: '#333333',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveBadge: {
        backgroundColor: '#FF4655',
    },
    statusText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
    },
    liveText: {
        color: '#FFFFFF',
    },

    // Map Tabs Styles
    mapTabsContainer: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    mapTab: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginRight: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    activeMapTab: {
        backgroundColor: '#FF4655',
    },
    mapTabText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    activeMapTabText: {
        color: '#FFFFFF',
    },

    // Map Stats Styles
    mapStatsContainer: {
        backgroundColor: '#1A1A1A',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    mapInfo: {
        flex: 1,
    },
    mapName: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        marginBottom: 4,
    },
    mapPickInfo: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },
    mapScore: {
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
    },

    // Stats Table Styles
    statsTable: {
        padding: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
        marginBottom: 16,
    },
    headerCell: {
        color: '#A0A0A0',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    playerHeader: {
        flex: 2,
        textAlign: 'left',
    },
    acsHeader: {
        flex: 1,
        textAlign: 'center',
    },
    kdaHeader: {
        flex: 1,
        textAlign: 'center',
    },

    // Team Section Styles
    teamSection: {
        marginBottom: 20,
    },
    teamLabel: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        marginBottom: 8,
        paddingLeft: 4,
    },

    // Player Row Styles
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    playerInfo: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerName: {
        color: '#FFFFFF',
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        flex: 1,
        marginLeft: 8,
    },
    agentIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    acsText: {
        flex: 1,
        color: '#FFFFFF',
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    kdaText: {
        flex: 1,
        color: '#FFFFFF',
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
});
