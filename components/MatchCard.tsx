import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Define the type for the match card prop based on your Convex query's transformation
type MatchCardProps = {
    vlrId: string;
    status: 'live' | 'upcoming' | 'completed';
    time: string;
    team1: { name: string; score: number; logoUrl: string; };
    team2: { name: string; score: number; logoUrl: string; };
    event: { name: string; series: string; };
};

// Function to format time where input string represents Eastern time (America/New_York)
// and should be displayed in the user's local timezone without hardcoding a zone.
const formatTime = (timeString: string) => {
    try {
        const sourceTimeZone = 'America/New_York';

        // Extract components from ISO-like string regardless of trailing 'Z'
        // Expected: YYYY-MM-DDTHH:MM(:SS)?.*
        const match = timeString.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (!match) {
            return timeString;
        }
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const second = match[6] ? parseInt(match[6], 10) : 0;

        // Provisional UTC instant using the provided wall time parts
        let provisionalMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);
        const provisionalDate = new Date(provisionalMs);

        // Format provisional in source TZ to see what wall parts it maps to
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: sourceTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).formatToParts(provisionalDate);

        const fYear = parseInt(parts.find(p => p.type === 'year')?.value || String(year), 10);
        const fMonth = parseInt(parts.find(p => p.type === 'month')?.value || String(month), 10);
        const fDay = parseInt(parts.find(p => p.type === 'day')?.value || String(day), 10);
        const fHour = parseInt(parts.find(p => p.type === 'hour')?.value || String(hour), 10);
        const fMinute = parseInt(parts.find(p => p.type === 'minute')?.value || String(minute), 10);
        const fSecond = parseInt(parts.find(p => p.type === 'second')?.value || String(second), 10);

        // Compute delta between intended source wall time and formatted wall time
        const intendedWallUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);
        const formattedWallUtcMs = Date.UTC(fYear, fMonth - 1, fDay, fHour, fMinute, fSecond, 0);
        const deltaMs = intendedWallUtcMs - formattedWallUtcMs;

        // Apply delta to get the UTC instant that corresponds to the intended Eastern wall time
        const desiredUtcMs = provisionalMs + deltaMs;
        const desiredDate = new Date(desiredUtcMs);

        // Determine Today/Tomorrow in the user's local timezone
        const localNow = new Date();
        const sameLocalDate = (a: Date, b: Date) => a.toDateString() === b.toDateString();
        const isToday = sameLocalDate(desiredDate, localNow);
        const isTomorrow = sameLocalDate(desiredDate, new Date(localNow.getTime() + 24 * 60 * 60 * 1000));

        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };

        const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        };

        const timeStr = desiredDate.toLocaleTimeString('en-US', timeOptions);

        if (isToday) {
            return `Today, ${timeStr}`;
        }
        if (isTomorrow) {
            return `Tomorrow, ${timeStr}`;
        }

        const dateStr = desiredDate.toLocaleDateString('en-US', dateOptions);
        return `${dateStr}, ${timeStr}`;
    } catch (error) {
        return timeString; // Fallback to original string if parsing fails
    }
};

const TeamDisplay = ({ name, score, logoUrl, isWinner, showScore }: { name: string; score: number; logoUrl: string; isWinner: boolean; showScore: boolean }) => (
    <View style={styles.teamContainer}>
        <Image source={{ uri: logoUrl }} style={styles.teamLogo} onError={(e) => console.log(e.nativeEvent.error)} />
        <Text style={[styles.teamName, isWinner && styles.winnerName]} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        {showScore && (
            <Text style={[styles.teamScore, isWinner && styles.winnerScore]}>{score}</Text>
        )}
    </View>
);

export default function MatchCard({ match }: { match: MatchCardProps }) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/match/${match.vlrId}` as any);
    };

    const isTeam1Winner = match.status === 'completed' && match.team1.score > match.team2.score;
    const isTeam2Winner = match.status === 'completed' && match.team2.score > match.team1.score;

    return (
        <Pressable onPress={handlePress} style={styles.card}>
            <View style={styles.header}>
                <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{match.event.name}</Text>
                    <Text style={styles.eventSeries}>{match.event.series}</Text>
                    <Text style={styles.timeText}>{formatTime(match.time)}</Text>
                </View>
                {match.status === 'live' && (
                    <View style={styles.liveIndicator}>
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
            </View>

            <View style={styles.teamsSection}>
                <TeamDisplay name={match.team1.name} score={match.team1.score} logoUrl={match.team1.logoUrl} isWinner={isTeam1Winner} showScore={match.status !== 'upcoming'} />
                <TeamDisplay name={match.team2.name} score={match.team2.score} logoUrl={match.team2.logoUrl} isWinner={isTeam2Winner} showScore={match.status !== 'upcoming'} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingBottom: 8,
    },
    eventInfo: {
        flex: 1,
    },
    eventName: {
        color: Colors.textMuted,
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    eventSeries: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
    },
    liveIndicator: {
        backgroundColor: Colors.danger,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    liveText: {
        color: Colors.textPrimary,
        fontSize: 12,
        fontFamily: 'Inter_700Bold',
    },
    timeText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    teamsSection: {
        marginTop: 8,
    },
    teamContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    teamLogo: {
        width: 30,
        height: 30,
        marginRight: 12,
        resizeMode: 'contain',
    },
    teamName: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    teamScore: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        width: 30,
        textAlign: 'center',
    },
    winnerName: {
        fontFamily: 'Inter_700Bold',
        color: Colors.accent,
    },
    winnerScore: {
        fontFamily: 'Inter_700Bold',
        color: Colors.accent,
    },
});
