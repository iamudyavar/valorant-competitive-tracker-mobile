import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable, Dimensions } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '../../theme/colors';

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
                <Text style={styles.teamName} numberOfLines={2} ellipsizeMode="tail">{match.team1.name}</Text>
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
                <Text style={styles.teamName} numberOfLines={2} ellipsizeMode="tail">{match.team2.name}</Text>
            </View>
        </View>
    </View>
);

// Map tab component
const MapTab = ({ map, isActive, onPress }: { map: MapData; isActive: boolean; onPress: () => void }) => (
    <Pressable
        style={[styles.mapTab, isActive && styles.activeMapTab, map.status === 'live' && styles.liveMapTab]}
        onPress={onPress}
    >
        <View style={styles.mapTabContent}>
            <Text style={[styles.mapTabText, isActive && styles.activeMapTabText]}>
                {map.name}
            </Text>
            {map.status === 'live' && (
                <View style={styles.liveDot} />
            )}
        </View>
    </Pressable>
);

// Win condition icon component
const WinConditionIcon = ({ condition }: { condition: string | null }) => {
    if (!condition) return null;

    const iconUrl = `https://www.vlr.gg/img/vlr/game/round/${condition}.webp`;

    return (
        <Image
            source={{ uri: iconUrl }}
            style={styles.winConditionIcon}
            resizeMode="contain"
        />
    );
};

// Round timeline component
const RoundTimeline = ({ map, match }: { map: MapData; match: MatchData }) => {
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

    const toggleRoundExpansion = (roundNumber: number) => {
        const newExpanded = new Set(expandedRounds);
        if (newExpanded.has(roundNumber)) {
            newExpanded.delete(roundNumber);
        } else {
            newExpanded.add(roundNumber);
        }
        setExpandedRounds(newExpanded);
    };

    const getTeamColor = (teamName: string | null) => {
        if (!teamName) return Colors.textMuted;
        return teamName === match.team1.name ? '#3b82f6' : '#FF4655';
    };

    const getTeamShortName = (teamName: string | null) => {
        if (!teamName) return 'TBD';
        return teamName === match.team1.name ? match.team1.shortName : match.team2.shortName;
    };

    const getWinConditionText = (condition: string | null) => {
        switch (condition) {
            case 'elim': return 'Elimination';
            case 'boom': return 'Bomb Exploded';
            case 'defuse': return 'Bomb Defused';
            case 'time': return 'Time Expired';
            default: return 'TBD';
        }
    };

    const completedRounds = map.rounds.filter(round => round.winningTeam !== null);
    const totalRounds = map.rounds.length;
    const team1Wins = completedRounds.filter(round => round.winningTeam === match.team1.name).length;
    const team2Wins = completedRounds.filter(round => round.winningTeam === match.team2.name).length;

    return (
        <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>Round Timeline</Text>
                <View style={styles.timelineScore}>
                    <Text style={[styles.timelineScoreText, { color: '#3b82f6' }]}>
                        {match.team1.shortName} {team1Wins}
                    </Text>
                    <Text style={styles.timelineScoreText}> - </Text>
                    <Text style={[styles.timelineScoreText, { color: '#FF4655' }]}>
                        {team2Wins} {match.team2.shortName}
                    </Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timelineScrollView}
                contentContainerStyle={styles.timelineContent}
            >
                {map.rounds.filter(round => round.winCondition !== null).map((round, index) => {
                    const isCompleted = round.winningTeam !== null;
                    const isExpanded = expandedRounds.has(round.roundNumber);
                    const teamColor = getTeamColor(round.winningTeam);
                    const playedRounds = map.rounds.filter(round => round.winCondition !== null);
                    const isLastRound = index === playedRounds.length - 1;

                    return (
                        <View key={round.roundNumber} style={styles.roundContainer}>
                            <Pressable
                                style={[
                                    styles.roundItem,
                                    isCompleted && styles.completedRound,
                                    !isCompleted && styles.pendingRound,
                                    { borderColor: isCompleted ? teamColor : Colors.divider }
                                ]}
                                onPress={() => toggleRoundExpansion(round.roundNumber)}
                            >
                                <Text style={[
                                    styles.roundNumber,
                                    { color: isCompleted ? teamColor : Colors.textMuted }
                                ]}>
                                    {round.roundNumber}
                                </Text>

                                {isCompleted && (
                                    <View style={styles.roundDetails}>
                                        <Text style={[styles.winningTeam, { color: teamColor }]}>
                                            {getTeamShortName(round.winningTeam)}
                                        </Text>
                                        <WinConditionIcon condition={round.winCondition} />
                                    </View>
                                )}

                                {!isCompleted && (
                                    <Text style={styles.pendingText}>TBD</Text>
                                )}
                            </Pressable>

                            {/* Expanded round details */}
                            {isExpanded && isCompleted && (
                                <View style={styles.expandedDetails}>
                                    <Text style={styles.expandedTeamName}>
                                        {round.winningTeam}
                                    </Text>
                                    <Text style={styles.expandedWinCondition}>
                                        {getWinConditionText(round.winCondition)}
                                    </Text>
                                </View>
                            )}

                            {/* Connecting line to next round */}
                            {!isLastRound && (
                                <View style={[
                                    styles.connectingLine,
                                    { backgroundColor: isCompleted ? teamColor : Colors.divider }
                                ]} />
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};


// Player stats row component
const PlayerStatsRow = ({ player }: { player: PlayerStats }) => {
    const plusMinus = player.stats.kills - player.stats.deaths;

    const getPlusMinusColor = (value: number) => {
        if (value > 0) return '#10B981'; // Green for positive
        if (value < 0) return '#EF4444'; // Red for negative
        return Colors.textPrimary; // Normal color for zero
    };

    return (
        <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
                {player.agent.iconUrl && (
                    <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                )}
                <Text style={styles.playerName}>{player.playerName}</Text>
            </View>
            <Text style={styles.killsText}>{player.stats.kills}</Text>
            <Text style={styles.deathsText}>{player.stats.deaths}</Text>
            <Text style={styles.assistsText}>{player.stats.assists}</Text>
            <Text style={[styles.plusMinusText, { color: getPlusMinusColor(plusMinus) }]}>
                {plusMinus > 0 ? `+${plusMinus}` : plusMinus < 0 ? `${plusMinus}` : ` 0`}
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
                    <View style={styles.mapNameContainer}>
                        <Text style={styles.mapName}>{map.name}</Text>
                        {map.status === 'live' && (
                            <View style={styles.mapLiveIndicator}>
                                <View style={styles.mapLiveDot} />
                                <Text style={styles.mapLiveText}>LIVE</Text>
                            </View>
                        )}
                    </View>
                    {map.pickedBy && (
                        <Text style={styles.mapPickInfo}>
                            Picked by {map.pickedBy === match.team1.shortName ? match.team1.shortName : match.team2.shortName}
                        </Text>
                    )}
                </View>
                <Text style={styles.mapScore}>{map.team1Score} - {map.team2Score}</Text>
            </View>

            {/* Round Timeline */}
            {map.status !== 'upcoming' && (
                <RoundTimeline map={map} match={match} />
            )}

            {/* If the map is upcoming, show a notice instead of stats */}
            {map.status === 'upcoming' ? (
                <View style={styles.statsTable}>
                    <Text style={styles.noDataText}>This map hasn't started yet.</Text>
                </View>
            ) : (
                <View style={styles.statsTable}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.playerHeader]}>Player</Text>
                        <Text style={[styles.headerCell, styles.killsHeader]}>K</Text>
                        <Text style={[styles.headerCell, styles.deathsHeader]}>D</Text>
                        <Text style={[styles.headerCell, styles.assistsHeader]}>A</Text>
                        <Text style={[styles.headerCell, styles.plusMinusHeader]}>+/-</Text>
                    </View>

                    {/* Team 1 Players */}
                    <View style={styles.teamSection}>
                        <Text style={styles.teamLabel} numberOfLines={1} ellipsizeMode="tail">{match.team1.name}</Text>
                        {team1Players.map((player, index) => (
                            <PlayerStatsRow key={index} player={player} />
                        ))}
                    </View>

                    {/* Team 2 Players */}
                    <View style={styles.teamSection}>
                        <Text style={styles.teamLabel} numberOfLines={1} ellipsizeMode="tail">{match.team2.name}</Text>
                        {team2Players.map((player, index) => (
                            <PlayerStatsRow key={index} player={player} />
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

export default function MatchDetailPage() {
    const { vlrId } = useLocalSearchParams();
    const match = useQuery(api.matches.getMatchById, { vlrId: vlrId as string }) as MatchData | null | undefined;

    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const hasAutoSelectedLiveMap = useRef(false);

    // Auto-jump to the live map when the match is live
    useEffect(() => {
        if (!match) return;
        if (match.status !== 'live') return;
        if (hasAutoSelectedLiveMap.current) return;
        if (!Array.isArray(match.maps) || match.maps.length === 0) return;

        // Compute live index relative to the displayed list during live (includes upcoming)
        const displayed = match.maps.filter((m: MapData) => m.status !== 'unplayed');
        const liveIndex = displayed.findIndex((m: MapData) => m.status === 'live');
        if (liveIndex !== -1) {
            setSelectedMapIndex(liveIndex);
        }
        hasAutoSelectedLiveMap.current = true;
    }, [match?.status, match?.maps]);

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

    // Choose which maps to display
    // - Live match: show live/completed and upcoming maps (but not unplayed)
    // - Non-live match: hide upcoming and unplayed; show only completed
    const displayedMaps = match.status === 'live'
        ? match.maps.filter((map: MapData) => map.status !== 'unplayed')
        : match.maps.filter((map: MapData) => map.status !== 'unplayed' && map.status !== 'upcoming');

    if (displayedMaps.length === 0) {
        return (
            <ScrollView style={styles.container}>
                <MatchHeader match={match} />
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No map data available yet</Text>
                </View>
            </ScrollView>
        );
    }

    const currentMap = displayedMaps[selectedMapIndex];

    return (
        <ScrollView style={styles.container}>
            <MatchHeader match={match} />

            {/* Map Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mapTabsContainer}>
                {displayedMaps.map((map, index) => (
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
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    errorText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },
    noDataContainer: {
        padding: 40,
        alignItems: 'center',
    },
    noDataText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },

    // Match Header Styles
    matchHeader: {
        backgroundColor: Colors.surface,
        padding: 20,
        marginBottom: 8,
    },
    eventInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    eventName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        marginBottom: 4,
    },
    eventSeries: {
        color: Colors.textSecondary,
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
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        textAlign: 'center',
    },
    scoreSection: {
        alignItems: 'center',
        marginHorizontal: 20,
    },
    scoreText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: Colors.divider,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveBadge: {
        backgroundColor: '#FF4655',
    },
    statusText: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
    },
    liveText: {
        color: Colors.textPrimary,
    },

    // Map Tabs Styles
    mapTabsContainer: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    mapTab: {
        backgroundColor: Colors.surfaceSecondary,
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
        color: Colors.textSecondary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    activeMapTabText: {
        color: Colors.textPrimary,
    },
    liveMapTab: {
        // Green border removed
    },
    mapTabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        marginLeft: 6,
    },

    // Map Stats Styles
    mapStatsContainer: {
        backgroundColor: Colors.surface,
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
        borderBottomColor: Colors.divider,
    },
    mapInfo: {
        flex: 1,
    },
    mapNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    mapName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
    },
    mapLiveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mapLiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
    },
    mapLiveText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    mapPickInfo: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },
    mapScore: {
        color: Colors.textPrimary,
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
        borderBottomColor: Colors.divider,
        marginBottom: 16,
    },
    headerCell: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    playerHeader: {
        flex: 2.5,
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
    killsHeader: {
        flex: 1,
        textAlign: 'center',
    },
    deathsHeader: {
        flex: 1,
        textAlign: 'center',
    },
    assistsHeader: {
        flex: 1,
        textAlign: 'center',
    },
    plusMinusHeader: {
        flex: 1,
        textAlign: 'center',
        minWidth: 30,
    },

    // Team Section Styles
    teamSection: {
        marginBottom: 20,
    },
    teamLabel: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        marginBottom: 8,
    },

    // Player Row Styles
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dividerSecondary,
    },
    playerInfo: {
        flex: 2.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        flex: 1,
        marginLeft: 8,
    },
    agentIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    acsText: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    kdaText: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    killsText: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    deathsText: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    assistsText: {
        flex: 1,
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    plusMinusText: {
        flex: 1,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        textAlign: 'center',
        minWidth: 30,
    },

    // Timeline Styles
    timelineContainer: {
        backgroundColor: Colors.surface,
        marginBottom: 8,
        paddingVertical: 16,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    timelineTitle: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
    },
    timelineScore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineScoreText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    timelineScrollView: {
        paddingHorizontal: 20,
    },
    timelineContent: {
        paddingRight: 20,
    },
    roundContainer: {
        alignItems: 'center',
        marginRight: 8,
    },
    roundItem: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    completedRound: {
        backgroundColor: Colors.surface,
    },
    pendingRound: {
        backgroundColor: Colors.surfaceSecondary,
        opacity: 0.6,
    },
    roundNumber: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        marginBottom: 2,
    },
    roundDetails: {
        alignItems: 'center',
    },
    winningTeam: {
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        marginBottom: 2,
    },
    winConditionIcon: {
        width: 16,
        height: 16,
    },
    pendingText: {
        color: Colors.textMuted,
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
    },
    expandedDetails: {
        backgroundColor: Colors.surfaceSecondary,
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    expandedTeamName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        marginBottom: 2,
    },
    expandedWinCondition: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
        textAlign: 'center',
    },
    connectingLine: {
        position: 'absolute',
        top: 30,
        left: 60,
        width: 8,
        height: 2,
        zIndex: -1,
    },
});
