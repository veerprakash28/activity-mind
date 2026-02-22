// A curated list of HR and team-building activities
export const INITIAL_ACTIVITIES = [
    // =========== SPORTS ===========
    {
        name: "Football Thursdays ⚽",
        description: "High-energy football action! Every Thursday evening, we hit the field for a fun, casual game—no pro skills needed, just good vibes, teamwork, and a great time.",
        category: "Sports",
        steps: JSON.stringify([
            "Gather the team at the local turf or park.",
            "Divide into two equal teams.",
            "Play a friendly 45-minute match.",
            "Cool down and grab a quick drink together."
        ]),
        materials: JSON.stringify(["Football", "Proper shoes", "Water"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "None",
        min_employees: 6,
        max_employees: 22,
        indoor_outdoor: "Outdoor",
        remote_compatible: 0
    },
    // =========== ICEBREAKERS ===========
    {
        name: "Two Truths and a Lie",
        description: "A classic icebreaker where each person shares three statements about themselves, and the group guesses which one is false.",
        category: "Icebreaker",
        steps: JSON.stringify([
            "Have each team member think of two true facts and one false statement about themselves.",
            "Go around the room (or virtual call). Each person shares their three statements.",
            "The rest of the team votes on which statement they think is the lie.",
            "The speaker reveals the lie."
        ]),
        materials: JSON.stringify(["None"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "None",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Show and Tell",
        description: "A quick activity where team members show an object of personal significance and talk about it.",
        category: "Icebreaker",
        steps: JSON.stringify([
            "Tell the team beforehand to bring one item to the meeting that is meaningful to them or currently on their desk.",
            "Allocate 1-2 minutes per person to show their item and explain its significance.",
            "Allow 1 minute for a quick question or two."
        ]),
        materials: JSON.stringify(["Personal items"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "None",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Would You Rather",
        description: "Fun rapid-fire questions that get people laughing and learning about each other's preferences.",
        category: "Icebreaker",
        steps: JSON.stringify([
            "Prepare 10-15 'Would You Rather' questions (e.g., 'Would you rather travel to the past or the future?').",
            "Go around the room or use a poll tool for remote teams.",
            "Each person picks their answer and briefly explains why.",
            "Keep it moving — no more than 30 seconds per answer."
        ]),
        materials: JSON.stringify(["Question list"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "10 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Desert Island Picks",
        description: "Each person picks 3 items they'd bring to a desert island and explains their choices to the group.",
        category: "Icebreaker",
        steps: JSON.stringify([
            "Ask the group: 'If you were stranded on a desert island, what 3 items would you bring?'",
            "Give everyone 2 minutes to think.",
            "Go around the room sharing and explaining choices.",
            "Vote on the most creative answer (optional)."
        ]),
        materials: JSON.stringify(["None"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "None",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Speed Networking",
        description: "Pair up team members for quick 3-minute conversations, then rotate — great for large teams or new hires.",
        category: "Icebreaker",
        steps: JSON.stringify([
            "Set up pairs (use a tool like Donut for remote, or physically line up chairs).",
            "Each pair has 3 minutes to chat about anything non-work.",
            "Ring a bell or send a signal to rotate.",
            "Repeat 5-6 rounds."
        ]),
        materials: JSON.stringify(["Timer", "Optional: conversation prompt cards"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "5 min",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },

    // =========== TEAM BONDING ===========
    {
        name: "Virtual Coffee Roulette",
        description: "Randomly pair team members up for a 15-minute informal coffee chat to build cross-department relationships.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Use a Slack integration (like Donut) or a simple spreadsheet to randomly pair employees.",
            "Send calendar invites for a 15-minute chat.",
            "Provide a loose prompt if needed (e.g., 'What are you watching on Netflix right now?').",
            "Encourage them to just chat, strictly no work talk."
        ]),
        materials: JSON.stringify(["Video conferencing tool"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "5 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Office Olympics",
        description: "A series of quick, silly competitive games held in the office or on a video call.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Divide the company into teams.",
            "Set up 3-5 mini-games (e.g., paper airplane toss, desk chair race, or typing speed test for remote).",
            "Keep score on a whiteboard or shared document.",
            "Award a small prize to the winning team."
        ]),
        materials: JSON.stringify(["Basic office supplies", "Small prize (optional)"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "30 min",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Both",
        remote_compatible: 1
    },
    {
        name: "Escape Room Challenge",
        description: "Team up to solve puzzles and 'escape' a room within a time limit. Can be physical or virtual.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Book a local escape room facility or a virtual escape room service.",
            "Divide employees into teams of 4-8 people.",
            "Brief the teams on the rules.",
            "Debrief afterward over drinks or snacks to discuss how teams collaborated."
        ]),
        materials: JSON.stringify(["Escape room booking (physical or virtual)"]),
        estimated_cost: "High",
        duration: "1 hr",
        difficulty: "Hard",
        prep_time: "1 hr",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Team Trivia Night",
        description: "Host a fun trivia night with categories ranging from pop culture to company history.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Prepare 30-40 trivia questions across 4-5 categories.",
            "Divide into teams of 3-5 people.",
            "Use a tool like Kahoot! or a simple shared screen for questions.",
            "Keep score and award prizes to the winning team.",
            "Include a 'Company Trivia' round for added fun."
        ]),
        materials: JSON.stringify(["Trivia questions", "Kahoot! or presentation", "Small prizes"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Easy",
        prep_time: "1 hr",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Cooking Class Together",
        description: "Book a group cooking class where the team learns to make a dish together — onsite or virtual.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Book a cooking class (local venue or hire a virtual instructor).",
            "For remote, send ingredient kits in advance.",
            "Follow the chef's instructions together.",
            "Eat together at the end and share photos!"
        ]),
        materials: JSON.stringify(["Cooking class booking", "Ingredients (if virtual, send kits)"]),
        estimated_cost: "High",
        duration: "Half day",
        difficulty: "Medium",
        prep_time: "2 hrs",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Board Game Afternoon",
        description: "Set aside an afternoon for classic or modern board games — great for team bonding in a relaxed environment.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Collect a variety of board games (Codenames, Jenga, Settlers of Catan, or card games).",
            "Set up game stations in a common area.",
            "Let teams self-organize and rotate games.",
            "Provide snacks and drinks."
        ]),
        materials: JSON.stringify(["Board games", "Snacks", "Tables and chairs"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },

    // =========== WELLNESS ===========
    {
        name: "Step Count Challenge",
        description: "A month-long wellness challenge encouraging employees to track their daily steps for health and a prize.",
        category: "Wellness",
        steps: JSON.stringify([
            "Announce the challenge at the start of the month.",
            "Have employees track steps using their phones or smartwatches.",
            "Set up a weekly check-in or shared leaderboard spreadsheet.",
            "Award prizes for 'Most Steps', 'Most Consistent', etc."
        ]),
        materials: JSON.stringify(["Smartphone/Pedometer", "Shared spreadsheet"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Medium",
        prep_time: "1 hr",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Both",
        remote_compatible: 1
    },
    {
        name: "Guided Group Meditation",
        description: "A 15-minute mindfulness session to help reduce stress and improve focus.",
        category: "Wellness",
        steps: JSON.stringify([
            "Schedule a 15-minute block during the workday.",
            "Hire a facilitator or play a guided meditation video/audio.",
            "Ensure a quiet environment or encourage headphones for remote staff.",
            "Allow 2 minutes at the end for people to slowly transition back."
        ]),
        materials: JSON.stringify(["Quiet room or video call", "Audio track/guide"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "10 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Yoga at the Office",
        description: "Bring in a yoga instructor for a relaxing 30-minute session or play a guided yoga video.",
        category: "Wellness",
        steps: JSON.stringify([
            "Book a yoga instructor or find a high-quality guided YouTube session.",
            "Clear a conference room or common area.",
            "Provide yoga mats (or towels as substitutes).",
            "Schedule during lunch or mid-afternoon for maximum attendance."
        ]),
        materials: JSON.stringify(["Yoga mats", "Instructor or video", "Open space"]),
        estimated_cost: "Medium",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Mental Health Workshop",
        description: "Invite a professional to lead a workshop on stress management, burnout prevention, or emotional intelligence.",
        category: "Wellness",
        steps: JSON.stringify([
            "Find a certified mental health professional or corporate wellness provider.",
            "Schedule a 1-hour workshop during work hours.",
            "Allow anonymous Q&A to make people comfortable.",
            "Share follow-up resources (apps, hotlines, reading material)."
        ]),
        materials: JSON.stringify(["Speaker/Facilitator", "Presentation setup", "Resource handouts"]),
        estimated_cost: "High",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "2 hrs",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Healthy Snack Day",
        description: "Replace the usual office snacks with a curated selection of healthy options for a day.",
        category: "Wellness",
        steps: JSON.stringify([
            "Order or prepare a variety of healthy snacks (fruits, nuts, smoothies, etc.).",
            "Set up a 'Healthy Snack Bar' in the break room.",
            "Include info cards about the health benefits of each snack.",
            "For remote teams, send healthy snack boxes to homes."
        ]),
        materials: JSON.stringify(["Healthy snacks", "Info cards", "Delivery boxes (remote)"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Easy",
        prep_time: "1 hr",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },

    // =========== RECOGNITION ===========
    {
        name: "Peer-to-Peer Kudos Board",
        description: "A dedicated physical or virtual space where employees can publicly thank or praise their colleagues.",
        category: "Recognition",
        steps: JSON.stringify([
            "Set up a physical bulletin board or a dedicated Slack/Teams channel.",
            "Provide sticky notes or specific emoji reactions.",
            "Encourage leadership to lead by example and post the first few kudos.",
            "Read highlights during the monthly all-hands meeting."
        ]),
        materials: JSON.stringify(["Bulletin board and sticky notes OR Slack/Teams channel"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "15 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Employee of the Month",
        description: "Recognize an outstanding employee each month with a certificate, shout-out, and small reward.",
        category: "Recognition",
        steps: JSON.stringify([
            "Set clear criteria for nomination (collaboration, innovation, going above and beyond).",
            "Allow peer nominations via a form or Slack channel.",
            "A small committee or manager selects the winner.",
            "Announce during a team meeting with a certificate and small gift card."
        ]),
        materials: JSON.stringify(["Nomination form", "Certificate template", "Gift card"]),
        estimated_cost: "Medium",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Spotlight Shout-Outs",
        description: "During team meetings, dedicate 5 minutes for anyone to publicly shout out a colleague's great work.",
        category: "Recognition",
        steps: JSON.stringify([
            "Add a 'Shout-Outs' slot to your regular team meeting agenda.",
            "Invite anyone to recognize a colleague for something they did well.",
            "Keep it informal and encouraging.",
            "Optionally track in a shared doc for quarterly awards."
        ]),
        materials: JSON.stringify(["Meeting agenda slot"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "None",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Appreciation Letters",
        description: "Have managers write personalized thank-you notes to each team member highlighting specific contributions.",
        category: "Recognition",
        steps: JSON.stringify([
            "Each manager writes 1-2 sentences about what they appreciate about each team member.",
            "Use nice stationery or create a custom digital card.",
            "Deliver personally (in person or via email).",
            "Tip: Be specific — generic 'good job' notes don't land as well."
        ]),
        materials: JSON.stringify(["Stationery or digital card tool"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },

    // =========== TRAINING ===========
    {
        name: "Lunch and Learn",
        description: "Invite a guest speaker or have an employee present on a topic of interest while the company provides lunch.",
        category: "Training",
        steps: JSON.stringify([
            "Survey the team for topics they want to learn about.",
            "Find a speaker (internal expert or external guest).",
            "Order catered lunch or provide meal delivery vouchers for remote workers.",
            "Host a 45-minute presentation followed by Q&A."
        ]),
        materials: JSON.stringify(["Projector/Screen", "Catered Lunch / Vouchers"]),
        estimated_cost: "High",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "2 hrs",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Skill Swap Sessions",
        description: "Employees teach each other a skill they're good at — coding, design, cooking, photography, etc.",
        category: "Training",
        steps: JSON.stringify([
            "Survey the team: 'What skill would you love to teach? What would you love to learn?'",
            "Match teachers with learners.",
            "Schedule 30-45 minute sessions.",
            "The 'teacher' prepares a brief lesson or demo.",
            "Keep it casual and fun, not formal training."
        ]),
        materials: JSON.stringify(["Depends on the skill being taught"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Medium",
        prep_time: "30 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Book Club",
        description: "Start a company book club — pick a book each month and discuss it together over lunch or coffee.",
        category: "Training",
        steps: JSON.stringify([
            "Let the team vote on a book (business, self-help, or fiction).",
            "Provide copies or an audiobook subscription.",
            "Schedule a monthly 30-minute discussion session.",
            "Rotate who leads the discussion."
        ]),
        materials: JSON.stringify(["Books or audiobook subscription", "Meeting room or video call"]),
        estimated_cost: "Medium",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "15 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Hackathon",
        description: "Give teams 4-8 hours to build a prototype, solve a real company problem, or create something fun.",
        category: "Training",
        steps: JSON.stringify([
            "Define the theme or problem space.",
            "Form teams of 3-5 people (cross-functional is best).",
            "Set a time limit (4-8 hours).",
            "Teams present their solutions/prototypes.",
            "Judges pick winners and award prizes."
        ]),
        materials: JSON.stringify(["Laptops", "Whiteboard/Post-its", "Prizes", "Snacks"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Hard",
        prep_time: "2 hrs",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },

    // =========== FESTIVAL ===========
    {
        name: "Desk Decoration Contest",
        description: "A seasonal or holiday-themed competition to see who can decorate their workspace best.",
        category: "Festival",
        steps: JSON.stringify([
            "Announce the theme (e.g., Halloween, Winter Wonderland).",
            "Give employees a small budget or let them use their own materials.",
            "Remote workers can decorate their home office background.",
            "Have a panel of judges or a company-wide vote.",
            "Award a prize to the winner."
        ]),
        materials: JSON.stringify(["Decorations", "Prize"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Easy",
        prep_time: "15 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Potluck Party",
        description: "Everyone brings a homemade dish or their favorite food to share — great for building connection through food.",
        category: "Festival",
        steps: JSON.stringify([
            "Pick a date (works great before holidays or end of quarter).",
            "Create a sign-up sheet so people don't all bring the same thing.",
            "Set up a communal area with plates, napkins, and drinks.",
            "Optionally do a 'People's Choice' vote for the best dish."
        ]),
        materials: JSON.stringify(["Sign-up sheet", "Plates/napkins/cups", "Communal area"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },
    {
        name: "Cultural Day Celebration",
        description: "Celebrate the diversity of your team by dedicating a day to share different cultures, food, music, and traditions.",
        category: "Festival",
        steps: JSON.stringify([
            "Invite team members to share something from their culture (food, music, clothing, traditions).",
            "Set up booths or presentation slots.",
            "Create a playlist of music from represented cultures.",
            "Use it as a learning opportunity — no culture is too small to celebrate."
        ]),
        materials: JSON.stringify(["Cultural items", "Food", "Music playlist", "Presentation area"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Medium",
        prep_time: "2 hrs",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Both",
        remote_compatible: 1
    },
    {
        name: "Movie Screening",
        description: "Host a movie afternoon at the office with popcorn, drinks, and a team-voted movie pick.",
        category: "Festival",
        steps: JSON.stringify([
            "Create a poll with 3-4 movie options.",
            "Set up a projector and comfortable seating.",
            "Provide popcorn, snacks, and drinks.",
            "Dim the lights and enjoy!"
        ]),
        materials: JSON.stringify(["Projector/TV", "Popcorn and snacks", "Comfortable seating"]),
        estimated_cost: "Low",
        duration: "Half day",
        difficulty: "Easy",
        prep_time: "30 min",
        min_employees: 5,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },
    {
        name: "Thank You Tree",
        description: "Set up a tree (physical or virtual) where team members hang notes of gratitude for colleagues they appreciate.",
        category: "Festival",
        steps: JSON.stringify([
            "Get a small decorative tree or create a virtual whiteboard tree.",
            "Provide leaf-shaped sticky notes or digital note cards.",
            "Team members write who they're thankful for and why.",
            "Hang the notes on the tree throughout the week.",
            "Read some highlights at the end of the week."
        ]),
        materials: JSON.stringify(["Decorative tree or virtual board", "Leaf sticky notes", "Markers"]),
        estimated_cost: "Low",
        duration: "15 min",
        difficulty: "Easy",
        prep_time: "15 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },

    // =========== MORE TEAM BONDING ===========
    {
        name: "Scavenger Hunt",
        description: "Organize a fun scavenger hunt around the office or neighborhood — or a virtual version for remote teams.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Create a list of 15-20 items or challenges to find/complete.",
            "Divide into teams of 3-5.",
            "Set a time limit (30-60 minutes).",
            "Teams take photos as proof of found items.",
            "First team to complete all items wins!"
        ]),
        materials: JSON.stringify(["Scavenger hunt list", "Smartphones for photos", "Prizes"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "1 hr",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Both",
        remote_compatible: 1
    },
    {
        name: "Volunteer Day",
        description: "Take the team out for a day of community service — food bank, park cleanup, or charity work.",
        category: "Team Bonding",
        steps: JSON.stringify([
            "Research local volunteer opportunities.",
            "Pick one that matches your team size.",
            "Coordinate transportation and logistics.",
            "Spend a half or full day volunteering together.",
            "Debrief over coffee or lunch afterward."
        ]),
        materials: JSON.stringify(["Transportation", "Volunteer supplies (varies)", "Lunch"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Medium",
        prep_time: "2 hrs",
        min_employees: 4,
        max_employees: 500,
        indoor_outdoor: "Outdoor",
        remote_compatible: 0
    },

    // =========== MORE WELLNESS ===========
    {
        name: "Walking Meetings",
        description: "Replace sit-down meetings with walking meetings to boost creativity and health.",
        category: "Wellness",
        steps: JSON.stringify([
            "Identify meetings that don't require a screen (1-on-1s, brainstorms).",
            "Invite colleagues for a walk-and-talk instead.",
            "For remote teams, encourage walking while on a phone call.",
            "Keep walks to 15-30 minutes."
        ]),
        materials: JSON.stringify(["Comfortable shoes"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "None",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Outdoor",
        remote_compatible: 1
    },

    // =========== MORE TRAINING ===========
    {
        name: "TED Talk Watch Party",
        description: "Watch a TED Talk together and discuss the key takeaways as a team.",
        category: "Training",
        steps: JSON.stringify([
            "Pick a relevant TED Talk (leadership, creativity, teamwork — 10-18 min).",
            "Watch it together in a meeting room or on a shared screen.",
            "Spend 15 minutes discussing: What resonated? How can we apply this?",
            "Optional: Have someone summarize and share notes with the team."
        ]),
        materials: JSON.stringify(["Projector or shared screen", "TED Talk link"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "10 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    // =========== SPORTS ===========
    {
        name: "Corporate Olympics",
        description: "A multi-event competition including relay races, tug-of-war, and fun office-friendly physical challenges.",
        category: "Sports",
        steps: JSON.stringify([
            "Divide the team into 4-5 balanced groups.",
            "Set up 5 stations: Sack race, Egg-and-spoon, Tug-of-war, Office chair relay, and Basketball shootout.",
            "Each team competes at each station to earn points.",
            "Tally the scores and host a medal ceremony."
        ]),
        materials: JSON.stringify(["Stopwatch", "Whistle", "Rope", "Sacks", "Plastic eggs and spoons"]),
        estimated_cost: "Medium",
        duration: "Half day",
        difficulty: "Hard",
        prep_time: "1 hr",
        min_employees: 10,
        max_employees: 500,
        indoor_outdoor: "Outdoor",
        remote_compatible: 0
    },
    {
        name: "Ping Pong Tournament",
        description: "A fast-paced single-elimination tournament for all skill levels.",
        category: "Sports",
        steps: JSON.stringify([
            "Create a bracket (use an online tool or whiteboard).",
            "Set up 1-2 ping pong tables in a common area.",
            "Play 11-point games to keep it moving fast.",
            "Finalists play a best-of-three series for the championship."
        ]),
        materials: JSON.stringify(["Ping pong tables", "Paddles", "Balls", "Bracket board"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "15 min",
        min_employees: 4,
        max_employees: 32,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },
    {
        name: "Mini-Golf Office Course",
        description: "Build a custom 9-hole mini-golf course using office supplies and navigate through the workplace.",
        category: "Sports",
        steps: JSON.stringify([
            "Each department designs and builds one 'hole' using boxes, books, and office supplies.",
            "Provide putters and golf balls to participants.",
            "Teams of 4 rotate through the course, keeping track of their strokes.",
            "Winner with the lowest score gets a small trophy."
        ]),
        materials: JSON.stringify(["Putters", "Golf balls", "Cardboard boxes", "Tape", "Obstacles"]),
        estimated_cost: "Low",
        duration: "2 hr",
        difficulty: "Medium",
        prep_time: "1 hr",
        min_employees: 4,
        max_employees: 100,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },
    {
        name: "Desktop Yoga Session",
        description: "A gentle series of stretches and poses focused on relieving office-related tension and improving posture.",
        category: "Sports",
        steps: JSON.stringify([
            "Hire an instructor or use a guided video.",
            "Focus on neck, shoulder, and back stretches that can be done at a desk.",
            "Hold each pose for 30-60 seconds while breathing deeply.",
            "End with a 5-minute guided meditation."
        ]),
        materials: JSON.stringify(["None", "Optional: Yoga mats"]),
        estimated_cost: "Low",
        duration: "30 min",
        difficulty: "Easy",
        prep_time: "5 min",
        min_employees: 2,
        max_employees: 500,
        indoor_outdoor: "Indoor",
        remote_compatible: 1
    },
    {
        name: "Indoor Cricket League",
        description: "A fun, modified version of cricket designed for indoor spaces with soft balls.",
        category: "Sports",
        steps: JSON.stringify([
            "Set up a small pitch using soft-tech or tennis balls.",
            "Divide into two teams of 6-8 players.",
            "Each team bats for 5 overs.",
            "Runs are scored by hitting specific wall areas or running between wickets."
        ]),
        materials: JSON.stringify(["Plastic bat", "Soft ball", "Wickets (or chairs)"]),
        estimated_cost: "Low",
        duration: "1 hr",
        difficulty: "Medium",
        prep_time: "15 min",
        min_employees: 8,
        max_employees: 20,
        indoor_outdoor: "Indoor",
        remote_compatible: 0
    },
];
