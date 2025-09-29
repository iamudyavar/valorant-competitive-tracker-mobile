import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Pressable, Dimensions } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '../../theme/colors';
import { LoadingSpinner, SlowConnectionState, ErrorState } from '../../components/LoadingStates';
import { useNetwork } from '../../providers/NetworkProvider';

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

// Custom hook for dynamic dimensions
const useDimensions = () => {
    const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => subscription?.remove();
    }, []);

    return dimensions;
};



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
    const [pressedRound, setPressedRound] = useState<number | null>(null);

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

    const getScoreAtRound = (roundNumber: number) => {
        const completedRounds = map.rounds.filter(round =>
            round.roundNumber <= roundNumber && round.winningTeam !== null
        );
        const team1Wins = completedRounds.filter(round => round.winningTeam === match.team1.name).length;
        const team2Wins = completedRounds.filter(round => round.winningTeam === match.team2.name).length;
        return { team1Wins, team2Wins };
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
                {map.rounds.filter(round =>
                    map.status === 'completed' ? round.winCondition !== null : true
                ).map((round, index) => {
                    const isCompleted = round.winningTeam !== null && round.winCondition !== null;
                    const isPressed = pressedRound === round.roundNumber;
                    const teamColor = getTeamColor(round.winningTeam);
                    const filteredRounds = map.rounds.filter(round =>
                        map.status === 'completed' ? round.winCondition !== null : true
                    );
                    const isLastRound = index === filteredRounds.length - 1;
                    const scoreAtRound = getScoreAtRound(round.roundNumber);

                    return (
                        <View key={round.roundNumber} style={styles.roundContainer}>
                            <Pressable
                                style={[
                                    styles.roundItem,
                                    isCompleted && styles.completedRound,
                                    !isCompleted && styles.pendingRound,
                                    { borderColor: isCompleted ? teamColor : Colors.divider }
                                ]}
                                onPressIn={() => setPressedRound(round.roundNumber)}
                                onPressOut={() => setPressedRound(null)}
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

                            {/* Press and hold popup */}
                            {isPressed && isCompleted && (
                                <View style={styles.roundPopup}>
                                    <Text style={styles.popupScore}>
                                        {scoreAtRound.team1Wins} - {scoreAtRound.team2Wins}
                                    </Text>
                                    <Text style={styles.popupWinCondition}>
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


// New component for just the player stats data
const PlayerStatsData = ({ player, mapStatus }: { player: PlayerStats; mapStatus: string }) => {
    const plusMinus = player.stats.kills - player.stats.deaths;

    const getPlusMinusColor = (value: number) => {
        if (value > 0) return '#10B981'; // Green for positive
        if (value < 0) return '#EF4444'; // Red for negative
        return Colors.textPrimary; // Normal color for zero
    };

    return (
        <>
            <Text style={styles.killsText}>{player.stats.kills}</Text>
            <Text style={styles.deathsText}>{player.stats.deaths}</Text>
            <Text style={styles.assistsText}>{player.stats.assists}</Text>
            <Text style={[styles.plusMinusText, { color: getPlusMinusColor(plusMinus) }]}>
                {plusMinus > 0 ? `+${plusMinus}` : plusMinus < 0 ? `${plusMinus}` : ` 0`}
            </Text>
            <Text style={styles.acsText}>{mapStatus === 'live' ? '' : player.stats.acs}</Text>
            <Text style={styles.adrText}>{mapStatus === 'live' ? '' : player.stats.adr}</Text>
            <Text style={styles.hsText}>{player.stats.headshotPercent}%</Text>
            <Text style={styles.fkText}>{player.stats.firstKills}</Text>
            <Text style={styles.fdText}>{player.stats.firstDeaths}</Text>
        </>
    );
};

// Wide screen player stats component for larger screens
const WideScreenPlayerStats = ({ map, match }: { map: MapData; match: MatchData }) => {
    const team1Players = map.stats.filter(p => p.teamName === match.team1.name);
    const team2Players = map.stats.filter(p => p.teamName === match.team2.name);

    return (
        <View style={styles.wideScreenTableContainer}>
            <View style={styles.wideScreenTable}>
                {/* Header Row */}
                <View style={styles.wideScreenHeaderRow}>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenPlayerHeader]}>Player</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenKillsHeader]}>K</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenDeathsHeader]}>D</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenAssistsHeader]}>A</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenPlusMinusHeader]}>+/-</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenAcsHeader]}>ACS</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenAdrHeader]}>ADR</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenHsHeader]}>HS%</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenFkHeader]}>FK</Text>
                    <Text style={[styles.wideScreenHeaderCell, styles.wideScreenFdHeader]}>FD</Text>
                </View>

                {/* Team 1 Players */}
                <View style={styles.wideScreenTeamSection}>
                    <Text style={styles.wideScreenTeamLabel}>{match.team1.shortName}</Text>
                    {team1Players.map((player, index) => {
                        const plusMinus = player.stats.kills - player.stats.deaths;
                        const getPlusMinusColor = (value: number) => {
                            if (value > 0) return '#10B981';
                            if (value < 0) return '#EF4444';
                            return Colors.textPrimary;
                        };

                        return (
                            <View key={index} style={styles.wideScreenPlayerRow}>
                                <View style={styles.wideScreenPlayerInfo}>
                                    {player.agent.iconUrl && (
                                        <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                                    )}
                                    <Text style={styles.wideScreenPlayerName} numberOfLines={1} ellipsizeMode="tail">
                                        {player.playerName}
                                    </Text>
                                </View>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenKillsCell]}>{player.stats.kills}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenDeathsCell]}>{player.stats.deaths}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAssistsCell]}>{player.stats.assists}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenPlusMinusCell, { color: getPlusMinusColor(plusMinus) }]}>
                                    {plusMinus > 0 ? `+${plusMinus}` : plusMinus < 0 ? `${plusMinus}` : ` 0`}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAcsCell]}>
                                    {map.status === 'live' ? '' : player.stats.acs}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAdrCell]}>
                                    {map.status === 'live' ? '' : player.stats.adr}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenHsCell]}>{player.stats.headshotPercent}%</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenFkCell]}>{player.stats.firstKills}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenFdCell]}>{player.stats.firstDeaths}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Team 2 Players */}
                <View style={styles.wideScreenTeamSection}>
                    <Text style={styles.wideScreenTeamLabel}>{match.team2.shortName}</Text>
                    {team2Players.map((player, index) => {
                        const plusMinus = player.stats.kills - player.stats.deaths;
                        const getPlusMinusColor = (value: number) => {
                            if (value > 0) return '#10B981';
                            if (value < 0) return '#EF4444';
                            return Colors.textPrimary;
                        };

                        return (
                            <View key={index} style={styles.wideScreenPlayerRow}>
                                <View style={styles.wideScreenPlayerInfo}>
                                    {player.agent.iconUrl && (
                                        <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                                    )}
                                    <Text style={styles.wideScreenPlayerName} numberOfLines={1} ellipsizeMode="tail">
                                        {player.playerName}
                                    </Text>
                                </View>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenKillsCell]}>{player.stats.kills}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenDeathsCell]}>{player.stats.deaths}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAssistsCell]}>{player.stats.assists}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenPlusMinusCell, { color: getPlusMinusColor(plusMinus) }]}>
                                    {plusMinus > 0 ? `+${plusMinus}` : plusMinus < 0 ? `${plusMinus}` : ` 0`}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAcsCell]}>
                                    {map.status === 'live' ? '' : player.stats.acs}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenAdrCell]}>
                                    {map.status === 'live' ? '' : player.stats.adr}
                                </Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenHsCell]}>{player.stats.headshotPercent}%</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenFkCell]}>{player.stats.firstKills}</Text>
                                <Text style={[styles.wideScreenDataCell, styles.wideScreenFdCell]}>{player.stats.firstDeaths}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};


// Player stats row component - REMOVED, will be replaced by the new structure in MapStats

// Map stats component
const MapStats = ({ map, match }: { map: MapData; match: MatchData }) => {
    const team1Players = map.stats.filter(p => p.teamName === match.team1.name);
    const team2Players = map.stats.filter(p => p.teamName === match.team2.name);
    const { width } = useDimensions(); // Use dynamic dimensions

    const [scrollX, setScrollX] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const showLeftArrow = scrollX > 0;
    const showRightArrow = scrollX < contentWidth - containerWidth - 10; // 10px buffer

    const scrollToLeft = () => {
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    };

    const scrollToRight = () => {
        const maxScrollX = contentWidth - containerWidth;
        scrollViewRef.current?.scrollTo({ x: maxScrollX, animated: true });
    };

    // Determine if we should use wide screen layout (tablets and larger screens)
    const isWideScreen = width >= 600; // 768px breakpoint for tablets

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
                <View style={styles.statsTableWrapper}>
                    <Text style={styles.noDataText}>This map hasn't started yet.</Text>
                </View>
            ) : isWideScreen ? (
                // Wide screen layout - no scroll, uses full available space
                <WideScreenPlayerStats map={map} match={match} />
            ) : (
                // Mobile layout - scrollable table
                <View style={styles.statsTableWrapper}>
                    {/* Scroll Indicators Above Header */}
                    <View style={styles.scrollIndicatorsContainer}>
                        {showLeftArrow && (
                            <Pressable style={styles.scrollIndicatorLeft} onPress={scrollToLeft}>
                                <Text style={styles.scrollArrow}>‹</Text>
                            </Pressable>
                        )}
                        {showRightArrow && (
                            <Pressable style={styles.scrollIndicatorRight} onPress={scrollToRight}>
                                <Text style={styles.scrollArrow}>›</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.statsTable}>
                        {/* Sticky Player Column */}
                        <View style={styles.stickyColumn}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerCell, styles.playerHeader]}>Player</Text>
                            </View>

                            {/* Team 1 Players */}
                            <View style={styles.teamSection}>
                                <Text style={styles.teamLabel} numberOfLines={1} ellipsizeMode="tail">{match.team1.shortName}</Text>
                                {team1Players.map((player, index) => (
                                    <View key={index} style={styles.playerRow}>
                                        <View style={styles.playerInfo}>
                                            {player.agent.iconUrl && (
                                                <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                                            )}
                                            <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">{player.playerName}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Team 2 Players */}
                            <View style={styles.teamSection}>
                                <Text style={styles.teamLabel} numberOfLines={1} ellipsizeMode="tail">{match.team2.shortName}</Text>
                                {team2Players.map((player, index) => (
                                    <View key={index} style={styles.playerRow}>
                                        <View style={styles.playerInfo}>
                                            {player.agent.iconUrl && (
                                                <Image source={{ uri: player.agent.iconUrl }} style={styles.agentIcon} />
                                            )}
                                            <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">{player.playerName}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Scrollable Stats Area */}
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tableScrollContainer}
                            contentContainerStyle={styles.tableScrollContent}
                            onScroll={(event) => {
                                setScrollX(event.nativeEvent.contentOffset.x);
                            }}
                            onContentSizeChange={(contentWidth) => {
                                setContentWidth(contentWidth);
                            }}
                            onLayout={(event) => {
                                setContainerWidth(event.nativeEvent.layout.width);
                            }}
                            scrollEventThrottle={16}
                            bounces={false}
                        >
                            <View style={styles.scrollableTable}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, styles.killsHeader]}>K</Text>
                                    <Text style={[styles.headerCell, styles.deathsHeader]}>D</Text>
                                    <Text style={[styles.headerCell, styles.assistsHeader]}>A</Text>
                                    <Text style={[styles.headerCell, styles.plusMinusHeader]}>+/-</Text>
                                    <Text style={[styles.headerCell, styles.acsHeader]}>ACS</Text>
                                    <Text style={[styles.headerCell, styles.adrHeader]}>ADR</Text>
                                    <Text style={[styles.headerCell, styles.hsHeader]}>HS%</Text>
                                    <Text style={[styles.headerCell, styles.fkHeader]}>FK</Text>
                                    <Text style={[styles.headerCell, styles.fdHeader]}>FD</Text>
                                </View>

                                {/* Team 1 Players */}
                                <View style={styles.teamSection}>
                                    {/* Invisible label for spacing */}
                                    <Text style={[styles.teamLabel, { opacity: 0 }]} numberOfLines={1} ellipsizeMode="tail">{match.team1.shortName}</Text>
                                    {team1Players.map((player, index) => (
                                        <View key={index} style={styles.playerRow}>
                                            <PlayerStatsData player={player} mapStatus={map.status} />
                                        </View>
                                    ))}
                                </View>

                                {/* Team 2 Players */}
                                <View style={styles.teamSection}>
                                    {/* Invisible label for spacing */}
                                    <Text style={[styles.teamLabel, { opacity: 0 }]} numberOfLines={1} ellipsizeMode="tail">{match.team2.shortName}</Text>
                                    {team2Players.map((player, index) => (
                                        <View key={index} style={styles.playerRow}>
                                            <PlayerStatsData player={player} mapStatus={map.status} />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
};

export default function MatchDetailPage() {
    const { vlrId } = useLocalSearchParams();
    const { isConnected, isInternetReachable } = useNetwork();
    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const match = useQuery(api.matches.getMatchById, { vlrId: vlrId as string }) as MatchData | null | undefined;

    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const hasAutoSelectedLiveMap = useRef(false);

    // Detect slow connections
    useEffect(() => {
        if (match === undefined && isConnected && isInternetReachable) {
            const timer = setTimeout(() => {
                setIsSlowConnection(true);
            }, 3000); // Consider slow after 3 seconds

            return () => clearTimeout(timer);
        } else {
            setIsSlowConnection(false);
        }
    }, [match, isConnected, isInternetReachable]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setIsSlowConnection(false);
    };

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

    // Handle different states
    const isOffline = !isConnected || isInternetReachable === false;
    const isLoading = match === undefined && !isOffline;
    const hasError = match === null;

    if (hasError) {
        return <ErrorState message="Match not found." onRetry={handleRetry} />;
    }

    if (isLoading) {
        if (isSlowConnection) {
            return <SlowConnectionState />;
        }

        return <LoadingSpinner message="Loading match details..." />;
    }

    // At this point, match is guaranteed to be defined
    if (!match) return null;

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
    statsTableWrapper: {
        padding: 16,
    },
    statsTable: {
        flexDirection: 'row',
    },
    stickyColumn: {
        width: 140, // Should match playerHeader width
        backgroundColor: Colors.surface, // Ensure it has a background
        zIndex: 1,
    },
    scrollableTable: {
        minWidth: 400, // Sum of all stat column widths
    },
    tableScrollContainer: {
        flex: 1,
    },
    tableScrollContent: {
        // flexGrow: 1, // This was causing the dead space
    },
    tableContainer: {
        minWidth: 500, // Exact width needed for all columns (140+40+40+40+50+50+50+50+40+40)
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
        textAlign: 'center',
        width: 60,
    },
    playerHeader: {
        textAlign: 'left',
        width: 140,
    },
    acsHeader: {
        width: 50,
        textAlign: 'center',
    },
    adrHeader: {
        width: 50,
        textAlign: 'center',
    },
    kastHeader: {
        width: 70,
        textAlign: 'center',
    },
    hsHeader: {
        width: 50,
        textAlign: 'center',
    },
    fkHeader: {
        width: 40,
        textAlign: 'center',
    },
    fdHeader: {
        width: 40,
        textAlign: 'center',
    },
    kdaHeader: {
        width: 60,
        textAlign: 'center',
    },
    killsHeader: {
        width: 40,
        textAlign: 'center',
    },
    deathsHeader: {
        width: 40,
        textAlign: 'center',
    },
    assistsHeader: {
        width: 40,
        textAlign: 'center',
    },
    plusMinusHeader: {
        width: 50,
        textAlign: 'center',
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
        height: 48, // Use fixed height for alignment
        borderBottomWidth: 1,
        borderBottomColor: Colors.dividerSecondary,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 140,
    },
    playerName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        flex: 1,
        marginLeft: 6,
    },
    agentIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    acsText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 50,
    },
    adrText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 50,
    },
    kastText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 70,
    },
    hsText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 50,
    },
    fkText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 40,
    },
    fdText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 40,
    },
    kdaText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 60,
    },
    killsText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 40,
    },
    deathsText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 40,
    },
    assistsText: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        textAlign: 'center',
        width: 40,
    },
    plusMinusText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        textAlign: 'center',
        width: 50,
    },

    // Timeline Styles
    timelineContainer: {
        backgroundColor: Colors.surface,
        marginBottom: 8,
        paddingVertical: 16,
        overflow: 'visible',
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16, // Match the statsTable padding
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
        paddingHorizontal: 16, // Match timelineHeader padding
        overflow: 'visible',
    },
    timelineContent: {
        paddingRight: 0, // Remove extra padding that might cause dead space
    },
    roundContainer: {
        alignItems: 'center',
        marginRight: 8,
        position: 'relative',
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
    roundPopup: {
        position: 'absolute',
        bottom: 70, // Position above the round bubble
        left: -10, // Center the popup above the round bubble
        right: -10,
        backgroundColor: Colors.surfaceSecondary,
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 80,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    popupScore: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        marginBottom: 2,
    },
    popupWinCondition: {
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

    // Scroll Indicator Styles
    scrollIndicatorsContainer: {
        position: 'relative',
        height: 20,
        marginBottom: 8,
    },
    scrollIndicatorLeft: {
        position: 'absolute',
        left: 140, // Align with the start of the scrollable area
        top: 0,
        bottom: 0,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        zIndex: 1,
    },
    scrollIndicatorRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        zIndex: 1,
    },
    scrollArrow: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        opacity: 0.8,
    },

    // Wide Screen Table Styles
    wideScreenTableContainer: {
        padding: 16,
    },
    wideScreenTable: {
        backgroundColor: Colors.surface,
        borderRadius: 8,
        overflow: 'hidden',
    },
    wideScreenHeaderRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceSecondary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    wideScreenHeaderCell: {
        color: Colors.textSecondary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        textAlign: 'center',
    },
    wideScreenPlayerHeader: {
        flex: 3, // Larger flex for player column
        textAlign: 'left',
    },
    wideScreenKillsHeader: {
        flex: 1,
    },
    wideScreenDeathsHeader: {
        flex: 1,
    },
    wideScreenAssistsHeader: {
        flex: 1,
    },
    wideScreenPlusMinusHeader: {
        flex: 1.2,
    },
    wideScreenAcsHeader: {
        flex: 1.4,
    },
    wideScreenAdrHeader: {
        flex: 1.4,
    },
    wideScreenHsHeader: {
        flex: 1.2,
    },
    wideScreenFkHeader: {
        flex: 1,
    },
    wideScreenFdHeader: {
        flex: 1,
    },
    wideScreenTeamSection: {
        marginBottom: 8,
    },
    wideScreenTeamLabel: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    wideScreenPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dividerSecondary,
    },
    wideScreenPlayerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 3, // Match header flex
    },
    wideScreenPlayerName: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        flex: 1,
        marginLeft: 8,
    },
    wideScreenDataCell: {
        color: Colors.textPrimary,
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        textAlign: 'center',
    },
    wideScreenKillsCell: {
        flex: 1, // Match header flex
    },
    wideScreenDeathsCell: {
        flex: 1, // Match header flex
    },
    wideScreenAssistsCell: {
        flex: 1, // Match header flex
    },
    wideScreenPlusMinusCell: {
        flex: 1.2, // Match header flex
        fontFamily: 'Inter_600SemiBold',
    },
    wideScreenAcsCell: {
        flex: 1.4, // Match header flex
    },
    wideScreenAdrCell: {
        flex: 1.4, // Match header flex
    },
    wideScreenHsCell: {
        flex: 1.2, // Match header flex
    },
    wideScreenFkCell: {
        flex: 1, // Match header flex
    },
    wideScreenFdCell: {
        flex: 1, // Match header flex
    },
});
