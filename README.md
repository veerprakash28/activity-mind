# Activity Mind 🧠

An AI-powered HR activity generator built with React Native and Expo. Helps HR teams discover, schedule, and track engaging team-building activities with smart recommendations.

## Features

- **Smart Activity Generator** – Get 3 curated activity ideas based on filters (category, duration, budget). Shuffle for new suggestions.
- **Activity Bank** – Browse 30+ built-in activities across 6 categories with search and filters.
- **Custom Activities** – Add your own activities with full details (steps, materials, budget, etc.).
- **Calendar & Scheduling** – Schedule activities and track completion on a visual calendar.
- **Favorites** – Save activities you love for quick access.
- **Insights Dashboard** – View engagement trends, category breakdowns, and AI-powered suggestions based on your real activity history.
- **Onboarding** – Quick setup flow to configure your organization profile.
- **Dark Mode** – Full light/dark theme support.

## Tech Stack

- **React Native** (Expo SDK)
- **TypeScript**
- **expo-sqlite** – Local database for offline-first storage
- **@react-navigation** – Tab and stack navigation
- **react-native-chart-kit** – Charts for insights
- **react-native-calendars** – Calendar component

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or physical device with Expo Go

### Installation

```bash
# Clone the repo
git clone https://github.com/veerprakash28/activity-mind.git
cd activity-mind

# Install dependencies
npm install

# Start the dev server
npx expo start --android --clear
```

### Running on Device

1. Install **Expo Go** from the Play Store / App Store
2. Run `npx expo start`
3. Scan the QR code with Expo Go

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

## License

MIT
