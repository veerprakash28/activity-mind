# Activity Mind 🧠

An AI-powered HR activity generator built with React Native and Expo. Helps HR teams discover, schedule, and track engaging team-building activities with smart recommendations.

## Features

- **Smart Activity Generator** – Get 3 curated activity ideas based on filters (category, duration, budget). Shuffle for new suggestions.
- **Activity Bank** – Browse 30+ built-in activities split into **Built-in** and **Custom** tabs with counts.
- **Custom Activities** – Add your own activities with full details (steps, materials, budget, duration, prep time, etc.).
- **Calendar & Scheduling** – Schedule activities and track completion on a visual calendar. Remove items with one tap.
- **Insights Dashboard** – View engagement trends, category breakdowns, and AI-powered suggestions based on your real activity history.
- **Custom Branding** – Choose your organization's primary and secondary colors using a **Hex color picker** or 12 preset swatches. Includes live preview.
- **Tabbed Settings** – Organized settings for both Organization Profile and Theme Customization with **unsaved changes indicators**.
- **Onboarding** – Interactive setup flow to tailor the app to your team.
- **Dark Mode & Premium UI** – Vibrant, professional design with smooth transitions and haptic feedback.

## Tech Stack

- **React Native** (Expo SDK 54)
- **TypeScript**
- **expo-sqlite** – Local database for offline-first storage
- **AsyncStorage** – Settings and theme persistence
- **@react-navigation** – Nested tab and stack navigation
- **react-native-chart-kit** – Charts for insights
- **react-native-calendars** – Calendar integration

## Getting Started

### Prerequisites

- **Node.js 20+**
- **npm** or **yarn**
- **Android Studio** (for local native builds)
- **Java 17 (JDK)**

### Installation & Development

```bash
# 1. Clone the repo
git clone https://github.com/veerprakash28/activity-mind.git
cd activity-mind

# 2. Install dependencies
npm install

# 3. Start Expo (for Expo Go)
npm run start
```

### Local Android Build (Generate APK)

To build a standalone APK locally without using EAS:

```bash
# 1. Generate native android folder (if missing)
npx expo prebuild --platform android

# 2. Build the Release APK
cd android && ./gradlew assembleRelease
```

**Output location:** `android/app/build/outputs/apk/release/app-release.apk`


## Project Structure

```
src/
├── components/       # Reusable UI components (Button, FilterChip, ActivityCard, etc.)
├── context/          # React Context for global state (theme, org profile)
├── database/         # SQLite setup, queries, activity bank seed data
├── navigation/       # Tab and stack navigators
├── screens/          # All app screens
│   ├── HomeScreen        # Dashboard with stats and quick actions
│   ├── GenerateScreen    # Smart activity generator with filters
│   ├── ActivityBankScreen # Browse all activities
│   ├── AddActivityScreen  # Add custom activities
│   ├── CalendarScreen     # Schedule and track activities
│   ├── FavoritesScreen    # Saved activities
│   ├── InsightsScreen     # Charts and analytics
│   └── OnboardingScreen   # First-launch setup
└── theme/            # Design tokens (colors, typography, spacing)
```

## Categories

| Category | Description |
|----------|-------------|
| 🧊 Icebreaker | Quick activities to warm up the team |
| 🤝 Team Bonding | Build deeper connections |
| 🌿 Wellness | Health and mindfulness |
| 🎓 Training | Learning and skill development |
| ⭐ Recognition | Appreciate and celebrate colleagues |
| 🎉 Festival | Seasonal and cultural celebrations |

## How to Add New Categories

The app now supports a **Dynamic Category System**. You no longer need to edit code to add a new category!

1.  Navigate to the **Bank** tab.
2.  Tap the **+** (plus) icon in the bottom right to add a new custom activity.
3.  In the **Category** section, scroll to the end of the list and tap **+ Add New**.
4.  Type your new category name (e.g., **Food** or **Offsite**).
5.  Save the activity. The new category will now automatically appear in the **Generate** and **Home** screen filters!

> [!TIP]
> Custom categories work exactly like built-in ones. The "Smart Generator" will immediately start including them in AI recommendations.

## License

MIT
