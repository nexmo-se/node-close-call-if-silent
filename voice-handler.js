SAMPLE_RATE = 16000
CHUNK_SIZE = 640
Threshold = 15

SHORT_NORMALIZE = (1.0 / 32768.0)
swidth = 2

function rms(frame) { //Root mean Square: a function to check if the audio is silent. Commonly used in Audio stuff
  count = frame.byteLength / swidth
  //unpack a frame into individual Decimal Value
  shorts = new Int16Array(frame.buffer, frame.byteOffset, frame.length / Int16Array.BYTES_PER_ELEMENT)
  sum_squares = 0.0
  for (const sample of shorts) {
    n = sample * SHORT_NORMALIZE //get the level of a sample and normalize it a bit (increase levels)
    sum_squares += n * n //get square of level
  }
  rms_val = Math.pow(sum_squares / count, 0.5) //summ all levels and get mean
  //console.log(rms_val*10);
  return rms_val * 1000 //raise value a bit so it's easy to read 
}


module.exports = {
  close_when_silent: (ws, timeout=2) => {
    var end = 0;
    var session_id = null;
    var current = (Date.now() / 1000);
    var end = (Date.now() / 1000) + timeout

    ws.on('message', function message(audio) {
      if (audio.toString().includes("event")) { // skip the first event header message
        headers =  JSON.parse(audio.toString())
        console.log("Headers", headers)
        session_id = headers["session_id"]
        
      }
      //console.log(audio)
      if (Object.prototype.toString.call(audio)) rms_val = 0;
      rms_val = rms(audio);

      if (current <= end) {
        if (rms_val >= Threshold) 
        end = (Date.now() / 1000) + timeout
        current = (Date.now() / 1000);
      }
      else {
        console.log("Ending")
        ws.close();
      }
    });
  }

};
