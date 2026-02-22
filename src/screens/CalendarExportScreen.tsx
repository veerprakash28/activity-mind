import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    TextInput,
    Modal,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAppContext } from '../context/AppContext';
import { getMonthlyScheduledActivities, Activity, ActivityHistory } from '../database/database';
import { StatusModal } from '../components/StatusModal';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = 1000; // Fixed width for high-quality export

type ActivityWithHistory = ActivityHistory & Activity;

export const CalendarExportScreen = ({ navigation }: any) => {
    const { theme, organization } = useAppContext();
    const viewShotRef = useRef<ViewShot>(null);

    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<ActivityWithHistory[]>([]);
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        // If it's the 25th or later, default to showing the NEXT month for planning
        if (now.getDate() >= 25) {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return nextMonth;
        }
        return now;
    });

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Customization states
    const customCompany = organization?.companyName || 'ORGANIZATION';
    const [customTagline, setCustomTagline] = useState(organization?.tagline || 'Team Engagement Plan');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    useEffect(() => {
        loadData(currentDate);
    }, [currentDate]);

    const loadData = async (date: Date) => {
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth();
        const data = await getMonthlyScheduledActivities(year, month);
        setActivities(data);
        setLoading(false);
    };

    const handlePrevMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const handleExport = async () => {
        if (!viewShotRef.current) return;

        setStatusType('info');
        setStatusTitle('Generating Image');
        setStatusMessage('Creating your premium HR calendar...');
        setStatusVisible(true);

        try {
            // @ts-ignore
            const uri = await viewShotRef.current.capture();

            if (uri) {
                setStatusVisible(false);
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share your Monthly HR Calendar',
                    UTI: 'public.png'
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            setStatusType('error');
            setStatusTitle('Export Failed');
            setStatusMessage('Could not generate the calendar image. Please try again.');
            setStatusVisible(true);
        }
    };

    const handlePreview = () => {
        setPreviewVisible(true);
    };

    const getIconForCategory = (category: string, activityName: string = '') => {
        const cat = category.toLowerCase();
        const name = activityName.toLowerCase();

        if (name.includes('football') || name.includes('soccer')) return 'soccer';
        if (name.includes('cricket')) return 'cricket';
        if (name.includes('yoga')) return 'yoga';
        if (name.includes('pizza')) return 'pizza';
        if (name.includes('drink') || name.includes('party')) return 'glass-cocktail';

        if (cat.includes('sport')) return 'soccer';
        if (cat.includes('well')) return 'leaf';
        if (cat.includes('team')) return 'account-group';
        if (cat.includes('creat')) return 'palette';
        if (cat.includes('social')) return 'glass-cocktail';
        if (cat.includes('learn') || cat.includes('brain')) return 'lightbulb';
        if (cat.includes('food')) return 'silver-ware-fork-knife';
        return 'star';
    };

    const extractEmoji = (text: string) => {
        const match = text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
        return match ? match[0] : null;
    };

    const stripEmoji = (text: string) => {
        return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    };


    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (0=Sun -> 0=Mon, 6=Sun)
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        // Activity mapping for quick lookup by day
        const activityMap: { [key: number]: ActivityWithHistory[] } = {};
        activities.forEach(acc => {
            const day = new Date(acc.scheduled_date).getDate();
            if (!activityMap[day]) activityMap[day] = [];
            activityMap[day].push(acc);
        });

        const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        return (
            <View style={exportStyles.calendarContainer}>
                <View style={exportStyles.gridHeader}>
                    {dayLabels.map(d => (
                        <Text key={d} style={exportStyles.dayLabel}>{d}</Text>
                    ))}
                </View>
                <View style={exportStyles.gridBody}>
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - startOffset + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dayActivities = isCurrentMonth ? activityMap[dayNum] : null;

                        return (
                            <View key={i} style={exportStyles.gridCell}>
                                {isCurrentMonth && (
                                    <>
                                        {dayActivities && dayActivities.length > 0 ? (
                                            <View style={exportStyles.gridIconContainer}>
                                                {extractEmoji(dayActivities[0].name) ? (
                                                    <Text style={{ fontSize: 24, marginTop: -2 }} numberOfLines={1}>{extractEmoji(dayActivities[0].name)}</Text>
                                                ) : (
                                                    <MaterialCommunityIcons
                                                        name={getIconForCategory(dayActivities[0].category, dayActivities[0].name) as any}
                                                        size={28}
                                                        color={theme.colors.primary}
                                                    />
                                                )}
                                            </View>
                                        ) : (
                                            <Text style={exportStyles.dateNumber}>{dayNum}</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Pre-process activities to group recurring items by name
    const groupedActivities = React.useMemo(() => {
        const map = new Map<string, typeof activities[0] & { all_dates: string[], display_date?: string }>();
        activities.forEach(acc => {
            if (map.has(acc.name)) {
                map.get(acc.name)!.all_dates.push(acc.scheduled_date);
            } else {
                map.set(acc.name, { ...acc, all_dates: [acc.scheduled_date] });
            }
        });

        return Array.from(map.values()).map(acc => {
            if (acc.all_dates.length > 1) {
                // sort dates
                acc.all_dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

                const firstDate = new Date(acc.all_dates[0]);
                const lastDate = new Date(acc.all_dates[acc.all_dates.length - 1]);

                acc.display_date = `${firstDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}-${lastDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
            } else {
                acc.display_date = new Date(acc.scheduled_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
            }
            return acc;
        });
    }, [activities]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const monthTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const renderCanvasContent = () => (
        <View style={exportStyles.canvas}>
            {/* Top Banner */}
            <View style={exportStyles.topBanner}>
                <Text style={exportStyles.topBannerText}>HR Calendar</Text>
            </View>

            <View style={exportStyles.mainContent}>
                {/* Left Column: Calendar Grid */}
                <View style={exportStyles.calendarColumn}>
                    <View style={exportStyles.calendarHeader}>
                        <View style={exportStyles.calendarIconBox}>
                            <MaterialCommunityIcons name="calendar-month" size={32} color="#0B2C52" />
                        </View>
                        <Text style={exportStyles.calendarHeaderText}>{monthTitle}</Text>
                    </View>

                    {renderCalendarGrid()}

                    {/* Tagline goes below Calendar */}
                    {customTagline ? (
                        <View style={exportStyles.taglineBox}>
                            <Text style={exportStyles.taglineBoxText}>{customTagline}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Right Column: Events */}
                <View style={exportStyles.activitiesColumn}>
                    <Text style={exportStyles.eventsHeader}>Events</Text>

                    <View style={exportStyles.eventsList}>
                        {groupedActivities.length === 0 ? (
                            <View style={exportStyles.emptyState}>
                                <Text style={exportStyles.emptyText}>No activities scheduled.</Text>
                            </View>
                        ) : (
                            groupedActivities.slice(0, 4).map((acc, i) => (
                                <View key={i} style={exportStyles.activityCard}>
                                    <View style={exportStyles.cardIconBox}>
                                        {extractEmoji(acc.name) ? (
                                            <Text style={{ fontSize: 24 }}>{extractEmoji(acc.name)}</Text>
                                        ) : (
                                            <MaterialCommunityIcons
                                                name={getIconForCategory(acc.category, acc.name) as any}
                                                size={24}
                                                color="#0B2C52" />
                                        )}
                                    </View>
                                    <View style={exportStyles.cardInfo}>
                                        <View style={exportStyles.cardHeader}>
                                            <Text style={exportStyles.cardName} numberOfLines={1}>{stripEmoji(acc.name)}</Text>
                                            <Text style={exportStyles.cardDate}>{acc.display_date}</Text>
                                        </View>
                                        <Text style={exportStyles.cardDesc} numberOfLines={4}>{acc.description}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                        {groupedActivities.length > 4 && (
                            <Text style={exportStyles.moreText}>+ {groupedActivities.length - 4} more events</Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Application Logo (shipthis) centered at the bottom */}
            {organization?.orgLogoUri && (
                <View style={exportStyles.orgLogoContainerFlex}>
                    <Image
                        source={{ uri: organization.orgLogoUri }}
                        style={exportStyles.orgLogoImage}
                        resizeMode="contain"
                    />
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginHorizontal: 10 }]}>{monthTitle}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                    <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginBottom: 20, textAlign: 'center' }]}>
                    Preview your monthly engagement plan. This will be exported as a high-quality image for sharing.
                </Text>

                {/* THE EXPORT CANVAS */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handlePreview}
                    style={styles.canvasWrapper}
                >
                    <ViewShot
                        ref={viewShotRef}
                        options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
                        style={{ width: CANVAS_WIDTH, backgroundColor: '#FFF' }}
                    >
                        {renderCanvasContent()}
                    </ViewShot>
                </TouchableOpacity>

                {/* Customization Inputs */}
                <View style={styles.inputSection}>
                    <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: 12 }]}>Personalize your Board</Text>

                    <View style={styles.inputWrap}>
                        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 4 }]}>Tagline / Footer Message</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                            value={customTagline}
                            onChangeText={setCustomTagline}
                            placeholder="e.g. Empowering our people"
                            placeholderTextColor={theme.colors.textSecondary + '80'}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleExport}
                    style={[styles.mainButton, { backgroundColor: theme.colors.primary, marginTop: 10 }]}
                >
                    <Text style={[theme.typography.h4, { color: '#FFF' }]}>Download & Share Image</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* PREVIEW MODAL */}
            <Modal
                visible={previewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPreviewVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPreviewVisible(false)}
                >
                    <View style={[styles.previewModalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.previewHeader}>
                            <Text style={theme.typography.h3}>Export Preview</Text>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.largeCanvasContainer}>
                            <View style={{ width: CANVAS_WIDTH, transform: [{ scale: 0.35 }], justifyContent: 'center', alignItems: 'center' }}>
                                {renderCanvasContent()}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: theme.colors.primary, marginBottom: 0 }]}
                            onPress={handleExport}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Share Now</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backButton: { padding: 4 },
    exportBtn: { padding: 4 },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    navBtn: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: { padding: 20, alignItems: 'center' },
    canvasWrapper: {
        width: '100%',
        aspectRatio: 1.25, // Restored aspect ratio so it fits on screen nicely
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        backgroundColor: '#FFF',
    },
    inputSection: {
        width: '100%',
        marginTop: 30,
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#F5F7FA',
    },
    inputWrap: {
        marginBottom: 16,
    },
    input: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    mainButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewModalContent: {
        width: '95%',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
    },
    largeCanvasContainer: {
        width: '100%',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginVertical: 20,
        borderRadius: 16,
        backgroundColor: '#FDFBFA',
    },
    closeBtn: {
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
});

const exportStyles = StyleSheet.create({
    canvas: {
        width: CANVAS_WIDTH,
        backgroundColor: '#FDFBFA',
        paddingBottom: 60,
    },
    topBanner: {
        width: '100%',
        backgroundColor: '#0B2C52',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBannerText: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    mainContent: {
        flexDirection: 'row',
        width: '100%',
        padding: 40,
    },
    calendarColumn: {
        width: '50%',
        borderRightWidth: 1.5,
        borderColor: '#E8ECF1',
        paddingRight: 40,
        alignItems: 'center',
    },
    activitiesColumn: {
        width: '50%',
        paddingLeft: 40,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        gap: 16,
    },
    calendarIconBox: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0B2C52',
    },
    calendarHeaderText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0B2C52',
    },
    eventsHeader: {
        fontSize: 36,
        fontWeight: '800',
        color: '#0B2C52',
        marginBottom: 24,
        textAlign: 'center',
    },
    eventsList: {
        gap: 16,
    },
    activityCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'flex-start',
        borderWidth: 1.5,
        borderColor: '#B3D4FF',
        gap: 20,
    },
    cardIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F5F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8ECF1',
    },
    cardInfo: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2D3E50',
        flex: 1,
        marginRight: 10,
    },
    cardDate: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4A5568',
    },
    cardDesc: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 20,
    },
    taglineBox: {
        marginTop: 24,
        width: '90%',
        alignSelf: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#0B2C52',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    taglineBoxText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2D3E50',
        lineHeight: 22,
        textAlign: 'center',
    },
    moreText: {
        fontSize: 14,
        color: '#A0AEC0',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    // Calendar Grid specific
    calendarContainer: {
        width: '100%',
        marginTop: 10,
    },
    gridHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '800',
        color: '#E53E3E', // Red color for days like mockup
    },
    gridBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridCell: {
        width: '14.28%',
        height: 60,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    dateNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3E50',
        marginTop: 8,
    },
    gridIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    orgLogoContainerFlex: {
        marginTop: 20,
        height: 60,
        width: 140,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orgLogoImage: {
        width: '100%',
        height: '100%',
    }
});
