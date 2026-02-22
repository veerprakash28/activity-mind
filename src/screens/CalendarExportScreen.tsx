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
    Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAppContext } from '../context/AppContext';
import { getMonthlyScheduledActivities, Activity, ActivityHistory } from '../database/database';
import { StatusModal } from '../components/StatusModal';
import { EXPORT_UI_THEMES, UITheme } from '../database/exportThemes';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT_DEFAULT = 850;

type ActivityWithHistory = ActivityHistory & Activity;

export const CalendarExportScreen = ({ navigation }: any) => {
    const { theme, organization } = useAppContext();
    const viewShotRef = useRef<ViewShot>(null);

    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<ActivityWithHistory[]>([]);
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        if (now.getDate() >= 25) {
            return new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        return now;
    });

    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const [customTagline, setCustomTagline] = useState(organization?.tagline || 'Team Engagement Plan');
    const [previewVisible, setPreviewVisible] = useState(false);

    // UI Theme & Branding states
    const [activeTheme, setActiveTheme] = useState<UITheme>(EXPORT_UI_THEMES[0]);
    const [useBranding, setUseBranding] = useState(false);

    // Derived colors
    const primaryColor = useBranding ? theme.colors.primary : activeTheme.primaryColor;
    const accentColor = useBranding ? theme.colors.secondary : activeTheme.accentColor;

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

    const handleThemeSelect = (theme: UITheme) => {
        setActiveTheme(theme);
    };

    // --- EMOJI HELPERS (RE-IMPLEMENTED) ---
    const extractEmoji = (text: string) => {
        // Simple but effective regex for emojis
        const match = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
        return match ? match[0] : null;
    };

    const stripEmoji = (text: string) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    };

    const getIconForCategory = (category: string, activityName: string = '') => {
        const cat = category.toLowerCase();
        const name = activityName.toLowerCase();
        if (name.includes('foot') || name.includes('socc')) return 'soccer';
        if (name.includes('brick') || name.includes('crick')) return 'cricket';
        if (name.includes('yoga')) return 'yoga';
        if (name.includes('pizza')) return 'pizza';
        if (name.includes('drink') || name.includes('party')) return 'glass-cocktail';
        if (cat.includes('sport')) return 'soccer';
        if (cat.includes('well')) return 'leaf';
        if (cat.includes('team')) return 'account-group';
        if (cat.includes('learn') || cat.includes('brain')) return 'lightbulb';
        if (cat.includes('social')) return 'glass-cocktail';
        return 'star';
    };

    const sortedGroupedActivities = React.useMemo(() => {
        const map = new Map<string, ActivityWithHistory & { all_dates: string[], display_date?: string }>();
        activities.forEach(acc => {
            if (map.has(acc.name)) {
                map.get(acc.name)!.all_dates.push(acc.scheduled_date);
            } else {
                map.set(acc.name, { ...acc, all_dates: [acc.scheduled_date] });
            }
        });

        const grouped = Array.from(map.values()).map(acc => {
            acc.all_dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            if (acc.all_dates.length > 1) {
                const first = new Date(acc.all_dates[0]);
                const last = new Date(acc.all_dates[acc.all_dates.length - 1]);
                acc.display_date = `${first.getDate()}/${first.getMonth() + 1} - ${last.getDate()}/${last.getMonth() + 1}`;
            } else {
                const d = new Date(acc.scheduled_date);
                acc.display_date = `${d.getDate()}/${d.getMonth() + 1}`;
            }
            return acc;
        });

        return grouped.sort((a, b) => {
            if (a.all_dates.length > 1 && b.all_dates.length === 1) return -1;
            if (a.all_dates.length === 1 && b.all_dates.length > 1) return 1;
            return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        });
    }, [activities]);

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const yearNum = currentDate.getFullYear();

    // --- REVERTED ORIGINAL CALENDAR GRID ---
    const renderCalendarGrid = (currentAccent: string) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const activityMap: { [key: number]: ActivityWithHistory[] } = {};
        activities.forEach(acc => {
            const day = new Date(acc.scheduled_date).getDate();
            if (!activityMap[day]) activityMap[day] = [];
            activityMap[day].push(acc);
        });

        const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        return (
            <View style={{ width: '100%', marginTop: 20 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    {dayLabels.map(d => (
                        <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#E53E3E' }}>{d}</Text>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - startOffset + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dayActivities = isCurrentMonth ? activityMap[dayNum] : null;

                        return (
                            <View key={i} style={{ width: '14.28%', height: 60, alignItems: 'center', justifyContent: 'flex-start' }}>
                                {isCurrentMonth && (
                                    <>
                                        {dayActivities && dayActivities.length > 0 ? (
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E8ECF1', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                                                {extractEmoji(dayActivities[0].name) ? (
                                                    <Text style={{ fontSize: 22 }}>{extractEmoji(dayActivities[0].name)}</Text>
                                                ) : (
                                                    <MaterialCommunityIcons name={getIconForCategory(dayActivities[0].category, dayActivities[0].name) as any} size={24} color={currentAccent} />
                                                )}
                                            </View>
                                        ) : (
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D3E50', marginTop: 8 }}>{dayNum}</Text>
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

    // LAYOUT 1: STRUCTURED PRO (FULLY REVERTED TO ORIGINAL WORKING VERSION)
    const renderStructuredLayout = () => {
        const bg = useBranding ? theme.colors.background : activeTheme.backgroundColor;

        return (
            <View style={{ width: CANVAS_WIDTH, minHeight: 850, backgroundColor: bg, paddingBottom: 60 }}>
                <View style={{ backgroundColor: primaryColor, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 32, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' }}>HR Calendar</Text>
                </View>

                <View style={{ flexDirection: 'row', width: '100%', padding: 40 }}>
                    <View style={{ width: '50%', borderRightWidth: 1.5, borderColor: '#E8ECF1', paddingRight: 40, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 16 }}>
                            <View style={{ padding: 10, borderRadius: 12, borderWidth: 2, borderColor: primaryColor }}>
                                <MaterialCommunityIcons name="calendar-month" size={32} color={primaryColor} />
                            </View>
                            <Text style={{ fontSize: 34, fontWeight: '800', color: primaryColor }}>{monthName} {yearNum}</Text>
                        </View>

                        {renderCalendarGrid(accentColor)}

                        {customTagline ? (
                            <View style={{ marginTop: 60, width: '100%', paddingVertical: 20, paddingHorizontal: 24, borderRadius: 18, borderWidth: 2, borderColor: accentColor + '40', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D3748', textAlign: 'center' }}>{customTagline}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={{ width: '50%', paddingLeft: 40 }}>
                        <Text style={{ fontSize: 38, fontWeight: '900', color: primaryColor, marginBottom: 30, textAlign: 'center' }}>Events</Text>
                        <View style={{ gap: 20 }}>
                            {sortedGroupedActivities.slice(0, 4).map((acc, i) => (
                                <View key={i} style={{ flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'flex-start', borderWidth: 1.5, borderColor: accentColor + '30', gap: 20 }}>
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: accentColor + '10', justifyContent: 'center', alignItems: 'center' }}>
                                        {extractEmoji(acc.name) ? (
                                            <Text style={{ fontSize: 24 }}>{extractEmoji(acc.name)}</Text>
                                        ) : (
                                            <MaterialCommunityIcons name={getIconForCategory(acc.category, acc.name) as any} size={24} color={accentColor} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#2D3748', flex: 1 }} numberOfLines={1}>{stripEmoji(acc.name)}</Text>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: accentColor }}>{acc.display_date}</Text>
                                        </View>
                                        <Text style={{ fontSize: 15, color: '#718096', lineHeight: 22 }} numberOfLines={3}>{acc.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {organization?.orgLogoUri && (
                    <View style={{ width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingBottom: 20 }}>
                        <Image source={{ uri: organization.orgLogoUri }} style={{ width: 180, height: 60 }} resizeMode="contain" />
                    </View>
                )}
            </View>
        );
    };

    // LAYOUT 2: MODERN PLAYFUL (ALIGNED)
    const renderPlayfulLayout = () => (
        <View style={{ width: CANVAS_WIDTH, minHeight: 900, backgroundColor: activeTheme.backgroundColor, padding: 60 }}>
            <View style={{ position: 'absolute', top: 60, left: 60, backgroundColor: primaryColor, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }}>HR CALENDAR</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 40 }}>
                <View style={{ flex: 1, paddingRight: 60 }}>
                    <Text style={{ fontSize: 85, fontWeight: '900', color: primaryColor, letterSpacing: -2 }}>{monthName}</Text>
                    <Text style={{ fontSize: 36, fontWeight: '300', color: accentColor, marginTop: -20, letterSpacing: 10 }}>{yearNum}</Text>

                    <View style={{ marginTop: 60 }}>
                        {sortedGroupedActivities.slice(0, 5).map((acc, i) => (
                            <View key={i} style={{ marginBottom: 30, borderLeftWidth: 8, borderColor: accentColor, paddingLeft: 25 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    {extractEmoji(acc.name) && (
                                        <Text style={{ fontSize: 24 }}>{extractEmoji(acc.name)}</Text>
                                    )}
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#2D3748' }}>{stripEmoji(acc.name)}</Text>
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: accentColor, marginTop: 4 }}>{acc.display_date}</Text>
                                <Text style={{ fontSize: 16, color: '#4A5568', marginTop: 6, lineHeight: 22 }} numberOfLines={2}>{acc.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ width: 440 }}>
                    <View style={{ backgroundColor: '#FFF', borderRadius: 40, padding: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 25, elevation: 15 }}>
                        <View style={{ height: 25, width: '100%', borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: accentColor, position: 'absolute', top: 0, left: 0 }} />
                        {renderCalendarGrid(accentColor)}
                    </View>
                </View>
            </View>

            <View style={{ position: 'absolute', bottom: 60, left: 60, right: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {customTagline && <Text style={{ fontSize: 20, color: '#A0AEC0', fontStyle: 'italic', fontWeight: '500' }}>{customTagline}</Text>}
                {organization?.orgLogoUri && <Image source={{ uri: organization.orgLogoUri }} style={{ width: 140, height: 40 }} resizeMode="contain" />}
            </View>
        </View>
    );

    // LAYOUT 3: ULTRA MINIMAL
    const renderMinimalLayout = () => (
        <View style={{ width: CANVAS_WIDTH, minHeight: 800, backgroundColor: '#FFF', padding: 80, alignItems: 'center', paddingBottom: 60 }}>
            <View style={{ position: 'absolute', top: 30, right: 30, backgroundColor: primaryColor, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 2 }}>HR CALENDAR</Text>
            </View>

            <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{ fontSize: 44, fontWeight: '900', color: '#1A202C' }}>{monthName.toUpperCase()}</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#CBD5E0', marginTop: -5, letterSpacing: 4 }}>{yearNum}</Text>
            </View>
            <View style={{ width: '80%' }}>
                {renderCalendarGrid(accentColor)}
            </View>
            <View style={{ width: '100%', height: 1.5, backgroundColor: '#F0F4F8', marginVertical: 20 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }}>
                {sortedGroupedActivities.slice(0, 6).map((acc, i) => (
                    <View key={i} style={{ width: '28%', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: accentColor, fontWeight: '800' }}>{acc.display_date}</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: accentColor + '30' }} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {extractEmoji(acc.name) && <Text style={{ fontSize: 16 }}>{extractEmoji(acc.name)}</Text>}
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A202C' }}>{stripEmoji(acc.name)}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#718096', marginTop: 4, lineHeight: 18 }}>{acc.description}</Text>
                    </View>
                ))}
            </View>
            <View style={{ marginTop: 'auto', alignItems: 'center', paddingTop: 80 }}>
                {customTagline && <Text style={{ color: '#CBD5E0', fontSize: 14, letterSpacing: 4, fontWeight: '600', marginBottom: 20 }}>{customTagline.toUpperCase()}</Text>}
                {organization?.orgLogoUri && <Image source={{ uri: organization.orgLogoUri }} style={{ width: 120, height: 40 }} resizeMode="contain" />}
            </View>
        </View>
    );

    const renderCanvasContent = () => {
        switch (activeTheme.layoutType) {
            case 'playful': return renderPlayfulLayout();
            case 'structured': return renderStructuredLayout();
            case 'minimal': return renderMinimalLayout();
            default: return renderStructuredLayout();
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const monthTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const screenWidth = Dimensions.get('window').width;
    const previewScale = (screenWidth - 40) / CANVAS_WIDTH;
    const compactScale = previewScale; // Fill the container width fully

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={[theme.typography.h4, { color: theme.colors.text, marginHorizontal: 15 }]}>{monthTitle}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                    <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Branding & Style Controls */}
                <View style={styles.brandingBox}>
                    <View style={styles.controlsRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Visual Template</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {EXPORT_UI_THEMES.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[styles.styleBtn, { borderColor: activeTheme.id === t.id ? theme.colors.primary : theme.colors.border }]}
                                        onPress={() => handleThemeSelect(t)}
                                    >
                                        <Text style={[styles.styleBtnText, { color: activeTheme.id === t.id ? theme.colors.primary : theme.colors.text }]}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={styles.brandingToggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Use Branding Colors</Text>
                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Apply your company's primary & secondary theme</Text>
                        </View>
                        <Switch
                            value={useBranding}
                            onValueChange={setUseBranding}
                            trackColor={{ false: '#CBD5E0', true: theme.colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, marginTop: 20 }]}
                    value={customTagline}
                    onChangeText={setCustomTagline}
                    placeholder="Custom footer / mission text..."
                    placeholderTextColor={theme.colors.textSecondary}
                />

                {/* --- LIVE PREVIEW --- */}
                <View style={styles.previewSection}>
                    <View style={styles.previewHeaderRow}>
                        <Text style={theme.typography.h4}>Live Preview</Text>
                        <TouchableOpacity onPress={() => setPreviewVisible(true)} style={styles.zoomButton}>
                            <Ionicons name="expand" size={16} color={theme.colors.primary} />
                            <Text style={styles.zoomText}> HIGH-RES VIEW</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.previewFrame, { height: (CANVAS_HEIGHT_DEFAULT * compactScale), justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={{
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT_DEFAULT,
                            position: 'absolute',
                            transform: [
                                { scale: compactScale }
                            ],
                        }}>
                            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                                {renderCanvasContent()}
                            </ViewShot>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={handleExport} style={[styles.mainBtn, { backgroundColor: theme.colors.primary, marginTop: 50 }]}>
                    <Text style={styles.mainBtnText}>Finalize & Share Image</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* HIGH-RES MODAL */}
            <Modal visible={previewVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={theme.typography.h2}>High Resolution View</Text>
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Scroll to see all events</Text>
                            </View>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                <Ionicons name="close-circle" size={36} color="#CBD5E0" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalScrollArea}>
                            <ScrollView horizontal>
                                <ScrollView showsVerticalScrollIndicator={true}>
                                    <View style={{ width: CANVAS_WIDTH, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFF' }}>
                                        {renderCanvasContent()}
                                    </View>
                                </ScrollView>
                            </ScrollView>
                        </View>

                        <TouchableOpacity onPress={handleExport} style={[styles.mainBtn, { backgroundColor: theme.colors.primary, marginTop: 25 }]}>
                            <Text style={styles.mainBtnText}>Download High-Res</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 15,
        borderBottomWidth: 1,

    },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    navBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F7FAFC' },
    backButton: { padding: 4 },
    exportBtn: { padding: 4 },
    scrollContent: { padding: 20 },
    brandingBox: { padding: 15, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    controlsRow: { marginBottom: 15 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    styleBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 2, marginRight: 10, backgroundColor: '#FFF' },
    styleBtnText: { fontWeight: 'bold', fontSize: 14 },
    brandingToggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    input: { height: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 20, backgroundColor: '#FFF', fontSize: 16 },
    previewSection: { marginTop: 30 },
    previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    zoomButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    zoomText: { color: '#2563EB', fontWeight: '900', fontSize: 11 },
    previewFrame: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    mainBtn: { paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
    mainBtnText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '96%', height: '88%', padding: 24, borderRadius: 36 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalScrollArea: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9', padding: 5 },
});
