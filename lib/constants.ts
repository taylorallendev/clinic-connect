// export const DEEPGRAM_CONFIG = {
//   // Using Nova-3 model for highest accuracy with medical terminology
//   model: "nova-3",

//   // Enable speaker diarization to distinguish between vet and client
//   diarize: true,

//   // Enable multichannel for better speaker separation
//   multichannel: true,

//   // Provide real-time updates as the conversation progresses
//   interim_results: true,

//   // Apply formatting for better readability in note generation
//   smart_format: true,

//   // Add punctuation for natural reading
//   punctuate: true,

//   // Convert numbers to numerical format for dosages and measurements
//   numerals: true,

//   // Recognize filler words which might indicate uncertainty in symptoms
//   filler_words: true,

//   // English language
//   language: "en",

//   // Audio encoding format
//   encoding: "linear16",

//   // Number of audio channels from input device
//   channels: 1,

//   // Sample rate for high-quality audio capture
//   sample_rate: 16000,

//   // Enable VAD events to detect when speech starts/stops
//   vad_events: true,

//   // Set utterance_end to detect natural pauses between speakers
//   utterance_end: "1000",

//   // Specify endpointing to finalize transcription segments
//   endpointing: 200,
// };

export const DEEPGRAM_CONFIG = {
  model: "nova-3",
  interim_results: true,
  smart_format: true,
  filler_words: true,
  utterance_end_ms: 3000,
};
