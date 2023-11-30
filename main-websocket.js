async function main() {
  let connected_and_ready = false;

  // connect to Deepgram

  const deepgramClient = deepgram.createClient(config.DEEPGRAM_KEY);
  const dgConnection = deepgramClient.listen.live(config.deepgramArgs);

  dgConnection.on(deepgram.LiveTranscriptionEvents.Open, () => {
    console.log("dgConnection ready");
    connected_and_ready = true;

    dgConnection.on(deepgram.LiveTranscriptionEvents.Transcript, (data) => {
      console.log("-> ", data);
      let text = data.channel.alternatives[0].transcript;
      let vad_gap = data.speech_final;
      if (text || vad_gap) {
        console.log(`${vad_gap ? "[vad end]" : "[interim]"} | ${text}}`);
      }
    });
  });

  dgConnection.on(deepgram.LiveTranscriptionEvents.Error, (error) => {
    console.log("dgConnection error", error);
    connected_and_ready = false;
  });

  dgConnection.on(deepgram.LiveTranscriptionEvents.Close, () => {
    console.log("dgConnection closed");
    connected_and_ready = false;
  });

  // setup mic audio source

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: { sampleRate: 16000, channelCount: 1 },
    video: false,
  });

  const micAudioSource = new MediaRecorder(micStream);
  micAudioSource.onstart = () => console.log("mic source started");
  micAudioSource.onstop = () => console.log("mic source stopped"); // shouldn't normally fire
  micAudioSource.ondataavailable = (event) => {
    // console.log(event.data);
    if (connected_and_ready) {
      dgConnection.send(event.data);
    }
  };
  micAudioSource.start(100);
}
