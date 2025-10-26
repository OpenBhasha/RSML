const RSML_TAGS = {
    // Speech Segment Tag
    "speech-segment": {
      attributes: ["start", "end", "lang", "verbatim", "normalized"],
      allowChildren: true,
      displayName: "Segment",
      class: "segment-tag"
    },

    // Noise Segment

    "noise-segment": {
        attributes: ["start", "end", "type", "intensity"], // e.g., "chatter", "background-noise"
        allowChildren: true,
        displayName: "Segment",
        class: "segment-tag"
      },

    // Pronunciation
    "mispronunciation": {
      attributes: ["original"],
      allowChildren: false,
      displayName: "Mispronunciation",
      class: "highlight-tag"
    },
  
    // Code-Mixing and Switching
    "code-mix": {
      attributes: ["lang", "script", "original"],
      allowChildren: true,
      displayName: "Code-Mix",
      class: "highlight-tag"
    },
  
    // Disfluencies
    "noise": {
      attributes: ["type"],  //Both hesitation sounds and noises
      allowChildren: false,
      displayName: "Noise",
      class: "disfluency-tag"
    },
  
    // Named Entities
    "entity": {
      attributes: [],
      allowChildren: true,
      displayName: "Entity",
      class: "entity-tag"
    }
  
  };

export { RSML_TAGS };