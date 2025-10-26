# RSML Pipeline

## VAD (Automation)
- Speech Segmentation 
    - Identifying Speech Segments & Background Noise Segments
    - <speech-segment>, <noise-segment>
    - With SileroVAD/Pyannote

## ASR + Correction (Verbatim Transcription)
- Verbatim Transcript with ASR 
- Correction for accuracy

## Noise Tagging (Automation)
- Identifying intermittent noise tags within speech segments
- <noise> tags
- Simple Audio Classifer

## Morphological Analysis (Splitting & Grouping) [Skipped]
- Split & Group tags for agglutinative languages (Sandhi & Samasas)
- <split>,<group>
- Using SLM + Speech Features like duration, pitch contours, etc

## Code-Mix Detection
- <code-mix> & <code-switch> 
- primarily for English mixing in native language
- Using SLM

## Pronunciation (Accent vs Mispronunciation) [Skipped]
- <accent>, <mispronunciation>
- Using SLM + Speech Features like pitch contours, MFCCs, ASR confidence, wav2vec embeddings, etc

## Disfluency Detection 
- <hesitation>
- <filler>, <false-start>, <repair>, <repition> [Skipped]
- Using SLM + Speech Features like pitch contours, MFCCs, ASR confidence, wav2vec embeddings, etc

## NER
- <person>, <org>, <loc>, <gpe>, <date>, <time>, <money>, <unit>, <brand>, <company>, etc
- Using SLM 

## Normalized Transcript
- Extract Normalized transcript from all of the previous steps

## Intent Extraction
- Extract Intent based on the speech segments of the same speech and context
- Using SLM

## Emotion Detection
- Emotion Detection with SLM
- Using SLM + Speech Features like pitch contours, MFCCs, ASR confidence, wav2vec embeddings, etc