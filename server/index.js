const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { AssemblyAI } = require('assemblyai');

const twilio = require('twilio');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);
const aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = twilio.twiml.VoiceResponse;

// Reusable AssemblyAI Transcription trigger
async function submitTranscription(recordingId, audioUrl) {
  const baseUrl = process.env.WEBHOOK_URL || 'http://localhost:5001';
  const WEBHOOK_URL = baseUrl.endsWith('/') 
    ? `${baseUrl}api/webhook/assemblyai` 
    : `${baseUrl}/api/webhook/assemblyai`;

  console.log(`[TRANSCRIBE] Reusable trigger starting for recording ${recordingId}`);
  console.log(`[TRANSCRIBE] Audio URL: ${audioUrl}`);
  console.log(`[TRANSCRIBE] Webhook URL: ${WEBHOOK_URL}`);

  // Submit audio to AssemblyAI with ALL features enabled
  const transcript = await aai.transcripts.submit({
    audio_url: audioUrl,
    webhook_url: WEBHOOK_URL,
    webhook_auth_header_name: 'x-callvault-webhook-auth',
    webhook_auth_header_value: process.env.WEBHOOK_SECRET || 'secret',
    speech_models: ['universal-2'],
    speaker_labels: true,
    summarization: true,
    summary_model: 'informative',
    summary_type: 'bullets',
    sentiment_analysis: true,
    auto_highlights: true,
    entity_detection: true,
  });

  console.log(`[TRANSCRIBE] Submitted! AssemblyAI ID: ${transcript.id}`);

  // Update the recording in Supabase with the AssemblyAI ID
  const { error } = await supabase
    .from('recordings')
    .update({ 
      assembly_id: transcript.id,
      status: 'pending'
    })
    .eq('id', recordingId);

  if (error) {
    console.error('[TRANSCRIBE] Supabase update error:', error);
    throw error;
  }

  console.log(`[TRANSCRIBE] DB updated for ${recordingId}`);
  return transcript.id;
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CallVault Backend', webhook: process.env.WEBHOOK_URL });
});

// Endpoint to trigger AssemblyAI transcription manually
app.post('/api/transcribe', async (req, res) => {
  try {
    const { recordingId, audioUrl } = req.body;
    
    if (!recordingId || !audioUrl) {
      return res.status(400).json({ error: 'recordingId and audioUrl are required' });
    }

    const transcriptId = await submitTranscription(recordingId, audioUrl);
    res.json({ message: 'Transcription started', transcriptId });
  } catch (error) {
    console.error('[TRANSCRIBE ENDPOINT ERROR]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate Twilio Voice Access Tokens
app.get('/api/token', (req, res) => {
  try {
    const identity = req.query.identity || 'anonymous';
    
    const accessToken = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: identity }
    );
    
    const grant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true
    });
    accessToken.addGrant(grant);
    
    res.json({ token: accessToken.toJwt(), identity });
  } catch (err) {
    console.error('[TOKEN GENERATION ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to generate TwiML instructions when a call is dialed
app.post('/api/voice', (req, res) => {
  const to = req.body.To || req.query.To;
  const twiml = new VoiceResponse();

  console.log(`[TWILIO VOICE] Incoming call request to dial: ${to}`);

  if (to) {
    const baseUrl = process.env.WEBHOOK_URL || 'http://localhost:5001';
    const callbackUrl = baseUrl.endsWith('/') 
      ? `${baseUrl}api/webhook/recording` 
      : `${baseUrl}/api/webhook/recording`;

    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      record: 'record-from-answer',
      recordingStatusCallback: callbackUrl,
      recordingStatusCallbackMethod: 'POST'
    });
    
    dial.number(to);
  } else {
    twiml.say("No destination number provided.");
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Webhook fired by Twilio when the telecom-side recording completes
app.post('/api/webhook/recording', async (req, res) => {
  const { RecordingUrl, RecordingDuration, CallSid, To } = req.body;
  console.log(`[TWILIO RECORDING WEBHOOK] CallSid: ${CallSid}, Url: ${RecordingUrl}, Duration: ${RecordingDuration}, To: ${To}`);
  
  try {
    const phoneNumber = To || 'Real VoIP Call';
    // Direct link to direct audio file format (.mp3)
    const audioUrl = RecordingUrl + '.mp3';

    // Insert record in Supabase recordings
    const { data: dbData, error } = await supabase
      .from('recordings')
      .insert({
        phone_number: phoneNumber,
        file_url: audioUrl,
        duration_seconds: parseInt(RecordingDuration) || 0,
        status: 'pending',
      })
      .select()
      .single();
      
    if (error) {
      console.error('[TWILIO WEBHOOK] Supabase insert error:', error);
      throw error;
    }

    console.log(`[TWILIO WEBHOOK] Created Supabase record: ${dbData.id}. Triggering transcription...`);

    // Trigger AssemblyAI
    await submitTranscription(dbData.id, audioUrl);
    
  } catch (err) {
    console.error('[TWILIO WEBHOOK ERROR]', err.message);
  }
  
  res.sendStatus(200);
});

// AssemblyAI Webhook handler
app.post('/api/webhook/assemblyai', async (req, res) => {
  console.log(`[WEBHOOK] Received webhook — status: ${req.body.status}, transcript_id: ${req.body.transcript_id}`);

  const authHeader = req.headers['x-callvault-webhook-auth'];
  if (authHeader !== (process.env.WEBHOOK_SECRET || 'secret')) {
    console.log('[WEBHOOK] Unauthorized — bad auth header');
    return res.status(401).send('Unauthorized');
  }

  const { transcript_id, status } = req.body;

  if (status === 'completed') {
    try {
      // Fetch full transcript details from AssemblyAI
      console.log(`[WEBHOOK] Fetching full transcript from AssemblyAI...`);
      const transcript = await aai.transcripts.get(transcript_id);
      
      console.log(`[WEBHOOK] Got transcript. Text length: ${transcript.text?.length || 0}`);
      console.log(`[WEBHOOK] Summary: ${transcript.summary ? 'YES' : 'NO'}`);
      console.log(`[WEBHOOK] Sentiment results: ${transcript.sentiment_analysis_results?.length || 0} segments`);
      console.log(`[WEBHOOK] Highlights: ${transcript.auto_highlights_result?.results?.length || 0} items`);

      // ── Compute sentiment percentages ──
      let sentimentData = { positive: 0, negative: 0, neutral: 0 };
      if (transcript.sentiment_analysis_results && transcript.sentiment_analysis_results.length > 0) {
        const total = transcript.sentiment_analysis_results.length;
        const pos = transcript.sentiment_analysis_results.filter(s => s.sentiment === 'POSITIVE').length;
        const neg = transcript.sentiment_analysis_results.filter(s => s.sentiment === 'NEGATIVE').length;
        const neu = total - pos - neg;
        sentimentData = {
          positive: Math.round((pos / total) * 100),
          negative: Math.round((neg / total) * 100),
          neutral: Math.round((neu / total) * 100),
        };
      }

      // ── Extract key highlights as action items ──
      let actionItems = [];
      if (transcript.auto_highlights_result && transcript.auto_highlights_result.results) {
        actionItems = transcript.auto_highlights_result.results
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .map(h => ({ text: h.text, count: h.count, rank: h.rank }));
      }

      // ── Extract topics from entities ──
      let topics = [];
      if (transcript.entities && transcript.entities.length > 0) {
        topics = transcript.entities.slice(0, 15).map(e => ({
          text: e.text,
          type: e.entity_type,
        }));
      }

      // Update Supabase with all results
      const updateData = {
        status: 'analyzed',
        transcript_text: transcript.text || '',
        summary: transcript.summary || '',
        sentiment: JSON.stringify(sentimentData),
        action_items: actionItems,
        topics: topics,
      };

      console.log(`[WEBHOOK] Updating DB with analyzed data...`);
      const { error } = await supabase
        .from('recordings')
        .update(updateData)
        .eq('assembly_id', transcript_id);
        
      if (error) {
        console.error('[WEBHOOK] Supabase Update Error:', error);
      } else {
        console.log(`[WEBHOOK] ✅ Successfully updated recording for transcript ${transcript_id}`);
      }
      
    } catch (err) {
      console.error('[WEBHOOK] Processing error:', err.message);
    }
  } else if (status === 'error') {
    console.log(`[WEBHOOK] ❌ Transcription failed for ${transcript_id}`);
    await supabase
      .from('recordings')
      .update({ status: 'error' })
      .eq('assembly_id', transcript_id);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`CallVault Server running on port ${PORT}`);
  console.log(`Webhook URL: ${process.env.WEBHOOK_URL}`);
});
