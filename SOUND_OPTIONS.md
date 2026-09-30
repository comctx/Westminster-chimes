# Sound options

The featured menu contains 20 choices: original Westminster Tower Bells (the default), Tibetan singing bowl, wooden block, digital beep, gentle ping, wind chime, soft desk bell, cathedral bell, antique mantle clock, gentle school bell, hour-strike bell, ship’s watch bell, carillon tone, crystal bowl, water drop, bamboo tap, deep gong, Zen bell, ocean wave ping, and soft harp.

The five pre-existing alternatives remain under Other classic clocks: Big Ben, Whittington, St. Michael, Canterbury, and cuckoo. There are therefore 25 choices overall; no previous sound was removed.

The new sounds are original synthesized interpretations, not recordings of physical instruments. `chime-tones.js` supplies the same PCM synthesis for browser playback and generated notification WAVs. Most new choices play a short sound or phrase at each scheduled time. Hour-strike counts 1–12 on the hour. Ship’s bell uses paired 1–8 watch counts on the hour and half-hour, with a single bell at quarter-hours. The test button previews the 1 AM pattern.

Sound and schedule selections persist locally. Quiet Hours continues to block previews and exclude quiet times from the native notification schedule. The existing notification scheduling limit/refresh behavior is unchanged.

## Build and validation

`node generate-chimes.cjs www/sounds` generates 385 mono 16-bit PCM WAVs at 22050 Hz, each shorter than 30 seconds. This includes the original 88 recordings, 285 variants for the 19 added sounds, and 12 hour-specific ship half-hour variants. Codemagic bundles the shared JavaScript and checks all WAVs in the finished IPA. The next configured iOS build is 18.

Local checks cover JavaScript syntax, YAML parsing, all generated WAV formats/durations/levels, default and saved choices, notification filename coverage, overnight Quiet Hours scheduling, blocked previews during Quiet Hours, and watch/hour counts. Actual sound quality, lock-screen delivery, and Quiet Hours still need verification on an iPhone after building and installing the update.

## Multiple quiet schedules (build 19)

Sleep, Work, and Weekend are editable presets with separate enable switches, start/end times, and weekdays. Additional schedules can be added or removed. All matching schedules are combined: any match suppresses both automatic and test chimes. Overnight selections refer to the day the quiet period starts; equal times mean the entire selected calendar day. Schedules with no selected weekdays have no effect.

Existing quiet-hour settings migrate into Sleep; Work and Weekend start disabled. Schedules persist under `quietSchedulesV1`. The shared `quiet-schedules.js` evaluates both on-screen silence and native notification times. Native updates are serialized and cancel old notifications before rebuilding. Daily or weekly repeating schedules are used when they fit the iOS limit; otherwise the next 64 notifications are scheduled and the UI displays the coverage end and a reminder to reopen the app.

Run `node tests/quiet-schedules.cjs` for schedule boundary and migration tests. No vibration mode is included.
