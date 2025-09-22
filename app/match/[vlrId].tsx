import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

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

// A helper component to render the main match header
const MatchHeader = ({ match }: { match: MatchData }) => (
    <View style={styles.headerContainer}>
        <View style={styles.teamHeader}>
            <Image source={{ uri: match.team1.logoUrl }} style={styles.teamLogo} />
            <Text style={styles.teamNameHeader}>{match.team1.name}</Text>
        </View>
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{match.team1.score} - {match.team2.score}</Text>
            <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
        </View>
        <View style={styles.teamHeader}>
            <Image source={{ uri: match.team2.logoUrl }} style={styles.teamLogo} />
            <Text style={styles.teamNameHeader}>{match.team2.name}</Text>
        </View>
    </View>
);

// A helper component to display stats for a single map
const MapStats = ({ map }: { map: MapData }) => (
    <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
            <Text style={styles.mapName}>{map.name}</Text>
            <Text style={styles.mapScore}>{map.team1Score} - {map.team2Score}</Text>
        </View>
        <View style={styles.statsTable}>
            {/* Table Header */}
            <View style={[styles.statsRow, styles.statsRowHeader]}>
                <Text style={[styles.statCell, styles.playerCell, styles.headerText]}>Player</Text>
                <Text style={[styles.statCell, styles.headerText]}>K/D/A</Text>
                <Text style={[styles.statCell, styles.headerText]}>ACS</Text>
                <Text style={[styles.statCell, styles.headerText]}>ADR</Text>
            </View>
            {/* Player Rows */}
            {map.stats.map((player: PlayerStats, index: number) => (
                <View key={index} style={styles.statsRow}>
                    <Text style={[styles.statCell, styles.playerCell]}>{player.playerName}</Text>
                    <Text style={styles.statCell}>{`${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`}</Text>
                    <Text style={styles.statCell}>{player.stats.acs}</Text>
                    <Text style={styles.statCell}>{player.stats.adr}</Text>
                </View>
            ))}
        </View>
    </View>
);

export default function MatchDetailPage() {
    const { vlrId } = useLocalSearchParams();
    const match = useQuery(api.matches.getMatchById, { vlrId: vlrId as string }) as MatchData | null | undefined;

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

    return (
        <ScrollView style={styles.container}>
            <MatchHeader match={match} />
            {match.maps.filter((map: MapData) => map.status !== 'upcoming').map((map: MapData, index: number) => (
                <MapStats key={index} map={map} />
            ))}
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
    },
    errorText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1E1E1E',
        margin: 16,
        borderRadius: 12,
    },
    teamHeader: {
        alignItems: 'center',
        width: '35%',
    },
    teamLogo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    teamNameHeader: {
        color: '#fff',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center'
    },
    scoreContainer: {
        alignItems: 'center',
    },
    scoreText: {
        color: '#fff',
        fontFamily: 'Inter_700Bold',
        fontSize: 36,
    },
    statusText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        marginTop: 4,
    },
    mapContainer: {
        backgroundColor: '#1E1E1E',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    mapName: {
        color: '#fff',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
    },
    mapScore: {
        color: '#fff',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
    },
    statsTable: {},
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    statsRowHeader: {
        borderBottomColor: '#444',
    },
    statCell: {
        color: '#E0E0E0',
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        width: '18%',
        textAlign: 'center',
    },
    playerCell: {
        width: '28%',
        textAlign: 'left',
    },
    headerText: {
        color: '#A0A0A0',
        fontFamily: 'Inter_600SemiBold',
    },
});
