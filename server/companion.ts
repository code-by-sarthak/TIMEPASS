export interface CompanionProfile {
  id: string;
  displayName: string;
  gender: 'Girls' | 'Boys';
  region: string;
  avatarUrl: string;
  interests: string[];
  vibe: string;
}

export const COMPANION_PROFILES: CompanionProfile[] = [
  {
    id: 'comp_kavya',
    displayName: 'Kavya',
    gender: 'Girls',
    region: 'Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    interests: ['Bollywood', 'Music', 'Movies', 'Photography'],
    vibe: 'Warm, spontaneous & loves late night chats'
  },
  {
    id: 'comp_ananya',
    displayName: 'Ananya',
    gender: 'Girls',
    region: 'Bangalore',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    interests: ['Coding', 'Coffee', 'Travel', 'Anime'],
    vibe: 'Tech enthusiast with a spontaneous travel bug'
  },
  {
    id: 'comp_rohan',
    displayName: 'Rohan',
    gender: 'Boys',
    region: 'Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    interests: ['Gaming', 'Chai', 'Music', 'Cricket'],
    vibe: 'Chai lover, witty banter & gaming'
  },
  {
    id: 'comp_siddharth',
    displayName: 'Siddharth',
    gender: 'Boys',
    region: 'Pune',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    interests: ['Bollywood', 'Fitness', 'Movies', 'Guitar'],
    vibe: 'Bollywood buff and fitness freak'
  },
  {
    id: 'comp_isha',
    displayName: 'Isha',
    gender: 'Girls',
    region: 'Chandigarh',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    interests: ['Fashion', 'Music', 'Travel', 'Memes'],
    vibe: 'Energetic, loves Punjabi beats & memes'
  },
  {
    id: 'comp_aryan',
    displayName: 'Aryan',
    gender: 'Boys',
    region: 'Jaipur',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    interests: ['Travel', 'Photography', 'Chai', 'Bollywood'],
    vibe: 'Roadtripper and chill conversationalist'
  }
];

export function getCompanionReply(userMessage: string, profile: CompanionProfile, messageCount: number): string {
  const text = userMessage.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|hie|heyy|hola|namaste|yo|hii)/i.test(text)) {
    const greetings = [
      `Hey there! How's your night going? ✨`,
      `Hii! Happy to match with you. What are you up to tonight? 😊`,
      `Hey! Finally someone interesting. Where are you chatting from? 📍`,
      `Hii! How has your day been so far? 🌟`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Identity / Gender / Age / Location
  if (/m or f|gender|who are you|asl|age|where are you/i.test(text)) {
    return `I'm ${profile.displayName}, 21, from ${profile.region}! Just doing some chill timepass here haha. What about you?`;
  }

  // Location / City
  if (/where are you from|which city|where do you live|location/i.test(text)) {
    return `I'm based in ${profile.region}! Weather is super nice here today. Which city are you from? 📍`;
  }

  // Chai / Coffee Icebreaker
  if (/chai|coffee|tea/i.test(text)) {
    return `100% Chai for me! Late night masala chai with biscuits hits totally different. Are you a chai or coffee person? ☕`;
  }

  // Pizza Icebreaker
  if (/pizza|pineapple/i.test(text)) {
    return `Strictly NO pineapple on pizza haha! Margherita with extra jalapeños and cheese is the real winner. What's your go-to? 🍕`;
  }

  // Bollywood / Movies / Cinema
  if (/movie|bollywood|actor|film|watch|series|netflix/i.test(text)) {
    return `Yeh Jawaani Hai Deewani and Jab We Met are pure comfort movies for me! Do you have a favorite movie you can rewatch anytime? 🎬`;
  }

  // Songs / Music / Singer
  if (/song|music|singer|arijit|jubin|kk|listen|playlist/i.test(text)) {
    return `Currently obsessed with 'Tum Hi Ho' and 'Raataan Lambiyan'! Original Bollywood melodies are unmatched. What genre do you listen to the most? 🎵`;
  }

  // Day rating / Mood / Vibe
  if (/\b(10|9|8|7|6|5|4|3|2|1)\b/.test(text) && /rate|vibe|day/i.test(text)) {
    return `Solid rating! My day was definitely an 8/10, especially now having a nice conversation here. What made your day special? ✨`;
  }

  // Emojis / Laughs
  if (/haha|hehe|lol|rofl|😂|🤣|🔥|❤️|✨/i.test(text)) {
    const laughter = [
      `Haha totally! 😂 What's the funniest thing that happened to you this week?`,
      `Haha glad we agree! Tell me something crazy on your bucket list! 🚀`,
      `Haha right?! By the way, are you a night owl or an early bird? 🌙`
    ];
    return laughter[Math.floor(Math.random() * laughter.length)];
  }

  // Travel / Places
  if (/travel|mountain|beach|vacation|trip|flight/i.test(text)) {
    return `Mountains for the peace, but beaches for the sunset vibes! If you could pack your bags and fly anywhere right now, where to? ✈️`;
  }

  // Work / Study
  if (/work|study|college|job|school|coding/i.test(text)) {
    return `Nice! I'm balancing studies and side projects right now. It gets hectic sometimes, which is why chatting here is such a good breath of fresh air! What do you do? 💡`;
  }

  // Goodbye / Sleep
  if (/bye|goodnight|sleep|gn|tata|cya/i.test(text)) {
    return `Aw it was so nice talking to you! Sleep tight and have wonderful dreams. Take care! ✨👋`;
  }

  // Conversational fallbacks by count
  const fallbacks = [
    `That's so interesting! What do you usually do to unwind on weekends? ☕`,
    `Haha I feel that! Tell me, what's one song that never gets old for you? 🎶`,
    `Totally agree with you on that! Are you studying or working full-time?`,
    `That's awesome. If you had one superpower for 24 hours, what would you pick? ⚡`,
    `Haha you have such a cool vibe! What's your secret comfort food? 😋`,
    `So true! What's the best memory you've made this year so far? 🌟`
  ];

  return fallbacks[messageCount % fallbacks.length];
}
