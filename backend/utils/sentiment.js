import language from "@google-cloud/language";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// For ES modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key file
// In production, use environment variables or a secure way to store credentials
const keyFilePath = path.join(__dirname, "../config/google-credentials.json");
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || keyFilePath;

// Check if we're in development mode and if the credentials file exists
const isDevMode = process.env.NODE_ENV !== "production";
const hasCredentials = fs.existsSync(keyFilePath);

// Create client if credentials are available, otherwise use mock for development
let client;
if (
  hasCredentials &&
  (!isDevMode || (isDevMode && process.env.USE_REAL_SENTIMENT === "true"))
) {
  try {
    client = new language.LanguageServiceClient({
      keyFilename: keyFilename,
    });
    console.log(
      "Google Cloud Natural Language API client initialized successfully"
    );
  } catch (error) {
    console.error("Failed to initialize Google Cloud client:", error);
    client = null;
  }
} else {
  console.log(
    "Using mock sentiment analysis (development mode or missing credentials)"
  );
  client = null;
}

// Trait analysis map - maps keywords and phrases to specific traits
const traitKeywords = {
  // Critically Negative traits
  unreliable: [
    "unreliable",
    "undependable",
    "can't count on",
    "never on time",
    "miss deadlines",
    "absent",
    "disappear",
    "flaky",
    "inconsistent",
    "undependable",
    "fails to deliver",
    "unreliable",
    "untrustworthy",
  ],
  unmotivated: [
    "unmotivated",
    "lazy",
    "doesn't care",
    "apathetic",
    "lack of interest",
    "unwilling",
    "no drive",
    "disinterested",
    "lack of enthusiasm",
    "indifferent",
    "lacks motivation",
    "no ambition",
    "passive",
    "disengaged",
  ],
  "poor communicator": [
    "poor communication",
    "uncommunicative",
    "doesn't respond",
    "unclear",
    "confusing",
    "misunderstand",
    "miscommunication",
    "poor listener",
    "doesn't articulate",
    "hard to understand",
    "fails to express",
    "vague",
    "ambiguous",
    "lacks clarity",
  ],
  careless: [
    "careless",
    "reckless",
    "sloppy",
    "mistake",
    "error",
    "overlook",
    "didn't check",
    "negligent",
    "hasty",
    "inattentive",
    "unfocused",
    "disregards",
    "rush",
    "careless",
    "slipshod",
    "neglectful",
  ],
  "low attention to detail": [
    "misses details",
    "overlooks",
    "sloppy",
    "not thorough",
    "incomplete",
    "rough",
    "careless with details",
    "overlooks specifics",
    "misses small things",
    "imprecise",
    "lacks thoroughness",
    "superficial work",
    "cursory",
  ],
  "needs constant supervision": [
    "needs supervision",
    "can't work independently",
    "dependent",
    "needs guidance",
    "can't be left alone",
    "requires oversight",
    "always needs checking",
    "needs monitoring",
    "requires constant direction",
    "lacks autonomy",
    "dependent on instructions",
  ],

  // Negative traits
  inconsistent: [
    "inconsistent",
    "unpredictable",
    "varies",
    "sometimes",
    "not always",
    "hit or miss",
    "fluctuating",
    "irregular",
    "uneven",
    "erratic",
    "unreliable performance",
    "variable quality",
    "day-to-day variation",
  ],
  "needs guidance": [
    "needs guidance",
    "needs direction",
    "not independent",
    "requires help",
    "supervision",
    "needs assistance",
    "requires mentoring",
    "can't self-direct",
    "needs coaching",
    "depends on instructions",
    "lacks self-sufficiency",
  ],
  "skill gaps": [
    "lacks skills",
    "limited knowledge",
    "needs training",
    "inexperienced",
    "novice",
    "amateur",
    "lacking expertise",
    "insufficient knowledge",
    "below required level",
    "not properly trained",
    "out of depth",
    "lacks qualifications",
  ],
  "slow to improve": [
    "slow to learn",
    "slow progress",
    "stagnant",
    "not improving",
    "static",
    "resistant to change",
    "slow development",
    "unchanging",
    "fixed mindset",
    "doesn't grow",
    "slow learner",
    "struggles to adapt",
    "rigid",
  ],

  // Neutral traits
  "dependable but average": [
    "dependable",
    "average",
    "adequate",
    "satisfactory",
    "okay",
    "fine",
    "meets expectations",
    "acceptable",
    "moderate",
    "middle of the road",
    "ordinary",
    "standard",
    "serviceable",
    "competent but not outstanding",
  ],
  "follows instructions": [
    "follows instructions",
    "follows directions",
    "does what's asked",
    "completes tasks",
    "follows through",
    "adheres to guidelines",
    "follows protocol",
    "complies with requests",
    "follows procedures",
    "obeys directives",
    "respects guidelines",
  ],
  "limited initiative": [
    "limited initiative",
    "waits for instruction",
    "doesn't take initiative",
    "reactive",
    "passive",
    "rarely initiates",
    "follows rather than leads",
    "hesitant to start",
    "awaits directions",
    "seldom volunteers",
    "hesitant to act independently",
  ],
  "adequate teamwork": [
    "works with team",
    "gets along",
    "cooperates",
    "coordinates",
    "collaborates adequately",
    "functions in team",
    "participates in group work",
    "contributes to team",
    "works alongside others",
    "cordial with teammates",
  ],
  "minimal innovation": [
    "traditional",
    "conventional",
    "standard",
    "basic",
    "by the book",
    "straightforward",
    "follows established methods",
    "uses existing approaches",
    "lacks creativity",
    "applies standard solutions",
    "relies on proven methods",
  ],

  // Positive traits
  proactive: [
    "proactive",
    "takes initiative",
    "anticipates",
    "forward-thinking",
    "prepares ahead",
    "planning",
    "self-starter",
    "initiates action",
    "anticipates needs",
    "acts without prompting",
    "takes the lead",
    "doesn't wait to be told",
    "foresees issues",
    "prepares in advance",
  ],
  reliable: [
    "reliable",
    "dependable",
    "consistent",
    "punctual",
    "on time",
    "count on",
    "trust",
    "always there",
    "steady",
    "unfailing",
    "trustworthy",
    "delivers consistently",
    "meets deadlines",
    "follows through",
    "never disappoints",
    "always delivers",
  ],
  "good communicator": [
    "communicates well",
    "clear",
    "articulate",
    "responsive",
    "keeps me informed",
    "transparent",
    "expressive",
    "effective communicator",
    "conveys ideas clearly",
    "good listener",
    "clear explanations",
    "strong communicator",
    "articulate",
    "concise",
  ],
  "shows growth potential": [
    "growing",
    "improving",
    "learning",
    "developing",
    "potential",
    "promising",
    "evolving skills",
    "capacity to develop",
    "emerging talent",
    "showing progress",
    "on upward trajectory",
    "getting better",
    "advancing",
  ],
  "team-oriented": [
    "team player",
    "collaborative",
    "works well with others",
    "supports team",
    "helpful",
    "cooperative",
    "contributes to team",
    "puts team first",
    "strengthens team",
    "good teammate",
    "assists colleagues",
    "shares credit",
    "builds team spirit",
  ],

  // Critically Positive traits
  "highly creative": [
    "creative",
    "innovative",
    "original",
    "unique",
    "fresh ideas",
    "inventive",
    "imaginative",
    "thinks outside the box",
    "creative solutions",
    "innovative approach",
    "original thinking",
    "breakthrough ideas",
    "visionary",
    "ingenious",
    "pioneering",
  ],
  "excellent problem solver": [
    "problem solver",
    "analytical",
    "finds solutions",
    "resolves issues",
    "troubleshoot",
    "solves complex problems",
    "analytical thinker",
    "tackles difficulties",
    "overcomes obstacles",
    "works through challenges",
    "resolves difficulties",
    "effective solutions",
    "logical thinking",
    "strategic problem solver",
  ],
  "self-driven": [
    "self-driven",
    "self-motivated",
    "driven",
    "ambitious",
    "determined",
    "goal-oriented",
    "intrinsically motivated",
    "autonomous worker",
    "self-directed",
    "inner drive",
    "passionate about work",
    "highly motivated",
    "ambitious",
    "sets high goals",
  ],
  motivated: [
    "motivated",
    "enthusiastic",
    "passionate",
    "dedicated",
    "committed",
    "eager",
    "energetic about work",
    "highly engaged",
    "shows enthusiasm",
    "devoted",
    "invested in success",
    "passionate about outcomes",
    "puts in extra effort",
    "goes beyond requirements",
  ],
  "leadership qualities": [
    "leader",
    "leadership",
    "guides others",
    "takes charge",
    "directs",
    "mentors",
    "inspires",
    "influences others",
    "sets example",
    "provides direction",
    "motivates team",
    "strategic thinker",
    "brings out the best in others",
    "visionary leader",
    "develops team members",
  ],
  "detail-oriented": [
    "detail-oriented",
    "meticulous",
    "thorough",
    "precise",
    "accurate",
    "perfectionist",
    "attentive to details",
    "careful work",
    "excellent attention to detail",
    "misses nothing",
    "focused on specifics",
    "conscientious",
    "diligent",
    "exacting standards",
  ],
  "quality-focused": [
    "quality",
    "excellence",
    "high standards",
    "exceptional",
    "outstanding",
    "premium",
    "superior work",
    "focuses on quality",
    "maintains high standards",
    "produces excellent results",
    "delivers exceptional work",
    "no compromises on quality",
    "best-in-class",
    "gold standard",
  ],
  "exceptional performer": [
    "exceptional",
    "outstanding",
    "exemplary",
    "stellar",
    "top performer",
    "excellent",
    "remarkable",
    "extraordinary",
    "superior",
    "above and beyond",
    "excels",
    "outperforms",
    "stands out",
    "exceptional results",
  ],
  "valuable team member": [
    "asset to the team",
    "valuable",
    "indispensable",
    "vital member",
    "key contributor",
    "essential team member",
    "valuable addition",
    "makes team better",
    "strengthens the team",
    "team benefits from",
    "crucial to success",
  ],
  "consistently exceeds expectations": [
    "exceeds expectations",
    "goes above and beyond",
    "surpasses goals",
    "exceeds targets",
    "outperforms",
    "delivers more than required",
    "consistently over-delivers",
    "exceeds requirements",
    "surpasses standards",
  ],
  "impact-driven": [
    "impactful",
    "makes a difference",
    "significant contribution",
    "meaningful impact",
    "changes outcomes",
    "influential",
    "transformative effect",
    "drives results",
    "delivers impact",
    "undeniable impact",
    "significant effect",
  ],
  adaptable: [
    "adaptable",
    "flexible",
    "adjusts quickly",
    "versatile",
    "handles change well",
    "agile",
    "adapts to new situations",
    "copes with uncertainty",
    "resilient",
    "thrives in changing environments",
  ],
};

// Sentiment to trait category mapping
const sentimentToTraitCategories = {
  "critically negative": [
    "unreliable",
    "unmotivated",
    "poor communicator",
    "careless",
    "low attention to detail",
    "needs constant supervision",
  ],
  negative: ["inconsistent", "needs guidance", "skill gaps", "slow to improve"],
  neutral: [
    "dependable but average",
    "follows instructions",
    "limited initiative",
    "adequate teamwork",
    "minimal innovation",
  ],
  positive: [
    "proactive",
    "reliable",
    "good communicator",
    "shows growth potential",
    "team-oriented",
  ],
  "critically positive": [
    "highly creative",
    "excellent problem solver",
    "self-driven and motivated",
    "leadership qualities",
    "detail-oriented and quality-focused",
  ],
};

/**
 * Analyze text to deduce personality traits
 * @param {string} text - The text to analyze
 * @param {string} sentimentLabel - The sentiment label to filter relevant traits
 * @returns {string[]} Array of deduced traits
 */
export const analyzeTraits = (text, sentimentLabel) => {
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const deducedTraits = new Set();

  // Helper function to check for phrase proximity
  const containsRelatedPhrases = (text, phrases, proximityThreshold = 10) => {
    const words = text.split(/\s+/);

    for (let phrase of phrases) {
      const phraseWords = phrase.toLowerCase().split(/\s+/);
      if (phraseWords.length === 1) {
        // For single words, just check if they exist
        if (text.includes(phraseWords[0])) return true;
      } else {
        // For multi-word phrases, check if they exist as a phrase or if all words appear within proximity
        if (text.includes(phrase.toLowerCase())) return true;

        // Check for word proximity
        const positions = [];
        for (let word of phraseWords) {
          if (text.includes(word)) {
            // Find all occurrences
            let pos = text.indexOf(word);
            while (pos !== -1) {
              positions.push({ word, position: pos });
              pos = text.indexOf(word, pos + 1);
            }
          }
        }

        // Group by word positions to find words that appear close to each other
        if (positions.length >= phraseWords.length) {
          positions.sort((a, b) => a.position - b.position);

          for (let i = 0; i <= positions.length - phraseWords.length; i++) {
            // Check if a set of positions contains all phrase words within proximity
            const windowPositions = positions.slice(i, i + phraseWords.length);
            const uniqueWords = new Set(windowPositions.map((p) => p.word));

            // Check if window contains all unique words from the phrase
            if (uniqueWords.size === new Set(phraseWords).size) {
              // Check if words are within proximity
              const firstPos = windowPositions[0].position;
              const lastPos =
                windowPositions[windowPositions.length - 1].position;

              // If the distance between first and last word is reasonable for proximity
              if (
                lastPos - firstPos <
                proximityThreshold * phraseWords.length
              ) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  };

  // Get the relevant trait categories based on sentiment
  let relevantTraitCategories =
    sentimentToTraitCategories[sentimentLabel] || [];

  // For more thorough detection, also check adjacent sentiment categories
  if (sentimentLabel === "critically positive") {
    relevantTraitCategories = [
      ...relevantTraitCategories,
      ...sentimentToTraitCategories["positive"],
    ];
  } else if (sentimentLabel === "positive") {
    relevantTraitCategories = [
      ...relevantTraitCategories,
      ...sentimentToTraitCategories["critically positive"],
      ...sentimentToTraitCategories["neutral"],
    ];
  } else if (sentimentLabel === "neutral") {
    relevantTraitCategories = [
      ...relevantTraitCategories,
      ...sentimentToTraitCategories["positive"],
      ...sentimentToTraitCategories["negative"],
    ];
  } else if (sentimentLabel === "negative") {
    relevantTraitCategories = [
      ...relevantTraitCategories,
      ...sentimentToTraitCategories["critically negative"],
      ...sentimentToTraitCategories["neutral"],
    ];
  } else if (sentimentLabel === "critically negative") {
    relevantTraitCategories = [
      ...relevantTraitCategories,
      ...sentimentToTraitCategories["negative"],
    ];
  }

  // Remove duplicates
  relevantTraitCategories = [...new Set(relevantTraitCategories)];

  // Extra trait detections for common patterns in reviews
  // Check for phrases that indicate exceptional performance
  if (
    lowerText.includes("exceptional") ||
    lowerText.includes("outstanding") ||
    lowerText.includes("excellent") ||
    lowerText.includes("goes above and beyond") ||
    lowerText.includes("exceed") ||
    (lowerText.includes("above") && lowerText.includes("beyond"))
  ) {
    if (
      sentimentLabel === "critically positive" ||
      sentimentLabel === "positive"
    ) {
      deducedTraits.add("exceptional performer");
      deducedTraits.add("consistently exceeds expectations");
    }
  }

  // Check for phrases indicating team value
  if (
    lowerText.includes("team") ||
    lowerText.includes("contribute") ||
    lowerText.includes("asset")
  ) {
    if (
      (lowerText.includes("asset") ||
        lowerText.includes("valuable") ||
        lowerText.includes("contribut")) &&
      (sentimentLabel === "critically positive" ||
        sentimentLabel === "positive")
    ) {
      deducedTraits.add("valuable team member");
    }
  }

  // Check for creativity mentions
  if (
    lowerText.includes("creative") ||
    lowerText.includes("innovation") ||
    lowerText.includes("innovative") ||
    lowerText.includes("originality")
  ) {
    deducedTraits.add("highly creative");
  }

  // Check for problem-solving mentions
  if (
    lowerText.includes("problem") ||
    lowerText.includes("solution") ||
    lowerText.includes("solve") ||
    lowerText.includes("resolve") ||
    lowerText.includes("problem-solving") ||
    lowerText.includes("problem solving")
  ) {
    deducedTraits.add("excellent problem solver");
  }

  // Check for impact mentions
  if (
    lowerText.includes("impact") ||
    lowerText.includes("difference") ||
    lowerText.includes("influence") ||
    lowerText.includes("significant") ||
    lowerText.includes("undeniable")
  ) {
    deducedTraits.add("impact-driven");
  }

  // Loop through the relevant traits and their keywords
  for (const traitName of relevantTraitCategories) {
    const keywords = traitKeywords[traitName] || [];

    // Check if any keywords for this trait appear in the text using advanced detection
    if (containsRelatedPhrases(lowerText, keywords)) {
      deducedTraits.add(traitName);
    }
  }

  // Limit to a maximum of 5 traits to avoid overwhelming
  return Array.from(deducedTraits).slice(0, 5);
};

/**
 * Mock sentiment analysis for development without Google Cloud credentials
 * @param {string} text - The text to analyze
 * @returns {Object} A mock sentiment analysis result
 */
const mockSentimentAnalysis = (text) => {
  // Simple rule-based sentiment analysis
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "love",
    "helpful",
    "reliable",
    "trustworthy",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "unreliable",
    "untrustworthy",
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeCount++;
  });

  // Calculate a simple score between -1 and 1
  const wordCount = text.split(/\s+/).length;
  const score = (positiveCount - negativeCount) / Math.max(wordCount / 5, 1);
  const clampedScore = Math.max(-1, Math.min(1, score));
  const magnitude = Math.min(Math.abs(score) * 3, 10);

  let sentimentLabel = "neutral";
  if (clampedScore >= 0.5) {
    sentimentLabel = "positive";
    if (clampedScore >= 0.8 && magnitude >= 2.0) {
      sentimentLabel = "critically positive";
    }
  } else if (clampedScore <= -0.5) {
    sentimentLabel = "negative";
    if (clampedScore <= -0.8 && magnitude >= 2.0) {
      sentimentLabel = "critically negative";
    }
  }

  // Add traits
  const traits = analyzeTraits(text, sentimentLabel);

  return {
    score: clampedScore,
    magnitude: magnitude,
    sentimentLabel,
    traits,
  };
};

/**
 * Analyze the sentiment of a text
 * @param {string} text - The text to analyze
 * @returns {Object} The sentiment analysis result with score, magnitude, label and traits
 */
export const analyzeSentiment = async (text) => {
  try {
    // If no client is available, use mock analysis
    if (!client) {
      const mockResult = mockSentimentAnalysis(text);
      // Add trait analysis to the mock result
      mockResult.traits = analyzeTraits(text, mockResult.sentimentLabel);
      return mockResult;
    }

    const document = {
      content: text,
      type: "PLAIN_TEXT",
    };

    // Detects the sentiment of the text
    const [result] = await client.analyzeSentiment({ document });
    const sentiment = result.documentSentiment;

    // Convert numerical score to categorical label
    // Score ranges from -1.0 (negative) to 1.0 (positive)
    let sentimentLabel = "neutral";

    if (sentiment.score >= 0.5) {
      sentimentLabel = "positive";
      if (sentiment.score >= 0.8 && sentiment.magnitude >= 2.0) {
        sentimentLabel = "critically positive";
      }
    } else if (sentiment.score <= -0.5) {
      sentimentLabel = "negative";
      if (sentiment.score <= -0.8 && sentiment.magnitude >= 2.0) {
        sentimentLabel = "critically negative";
      }
    }

    // Analyze traits based on the text content and sentiment label
    const traits = analyzeTraits(text, sentimentLabel);

    return {
      score: sentiment.score,
      magnitude: sentiment.magnitude,
      sentimentLabel,
      traits,
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    // Use mock analysis as fallback if API call fails
    const mockResult = mockSentimentAnalysis(text);
    mockResult.traits = analyzeTraits(text, mockResult.sentimentLabel);
    return mockResult;
  }
};

export default analyzeSentiment;
