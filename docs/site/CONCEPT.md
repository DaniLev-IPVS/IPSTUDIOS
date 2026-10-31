# IP Studios website: creative concept and build plan

Status: BUILT, first pass (31 Oct 2026). Hero video generated with Seedance 2.5 and the site runs locally. Blender blocking built for all seven sections (`docs/hero/blocking/`), revised after Daniel's review of the first stills. Site code not started.

## 1. The idea in one paragraph

The whole site lives on the stage from deck slide 2: a dark reflective floor fading into infinite wine-black space, with a faint sphere of phone screens far in the distance. Characters walk onto that stage one at a time, always behind the copy, and do things together as the visitor scrolls. Tung walks in first, alone, behind the big centred cover lockup; scrolling is locked until he settles. From then on every section adds characters until the full lineup stands together for Team, and the Contact section ends the scroll on an idle loop. The scene is one continuous hero video (Blender blocking restyled by Seedance 2.5), scrubbed by scroll, with the site's copy layered over it.

## 2. Site map (deck slides in brackets)

| # | Section | Built from | Copy placement | Message |
| --- | --- | --- | --- | --- |
| 1 | Cover | 1 | Big centred lockup + tagline | IP Studios. Tung walks in behind the text. Scroll locked until he settles. |
| 2 | The World | 2 + 3 | Centred, mid-frame: title, two lines, icon row | Italian Brainrot and meme culture in general. Characters upstage, behind the copy. |
| 3 | Proof and Opportunity | 6, a little of 5 | Enters from the right, parks right half, vertically centred | Meme IP ranks with the giants, $0 marketing. Group drifts left and fades; Tung stays. |
| 4 | The Problem | 7 (+ the fork from 8) | Enters from the left, upper-left third | Viral peak, decay, nobody captures the value. Tung alone on his platform. |
| 5 | The Vision | 15, with 11 generalized and 12 as method | Two columns, left and right, wrapping the stage | The IP Factory: a round stage that rises and rotates with everyone on it. |
| 6 | Team | 9 + 10 | Six circles (photo, name, one line) each above a character | Founders and advisors. |
| 7 | Contact | cover framing | Centred title, subtext, Contact Us button | Tung centre behind the text, the others idling at the edges. Scroll ends; idle loop. |

Removed from the site: slide 13 (the raise) and slide 14 (Mementum Lab). Slide 16 becomes the footer.

## 3. The stage and background

- Infinite space: wine-to-black radial, no hard horizon, the floor fading into the dark.
- No laser V. Far in the distance, barely visible: a sphere of phone screens stacked in cube-like clusters, as if the stage sits inside a globe of people scrolling reels (the Matrix TV wall, 2026 edition).
- The floor is never static: slow light sweeps, reflections, ripples on each step and tap.
- The copy layer is always the front plane. Characters may cross behind the text while moving, but never park there: when the copy is at rest, every character settles below or beside the text block with clear air, so the text always reads.

## 4. Cast

Eight characters appear in the deck. Names in quotes are the ones the deck prints; the others are described until Daniel confirms names.

1. Tung Tung Tung Sahur (wooden log, baseball bat)
2. "Ballerina Cappuccina" (coffee-cup head, tutu)
3. Coffee-cup ninja (slide 2, headband and twin blades)
4. "Tralalero Tralala" (shark in sneakers)
5. "Brr Brr Patapim" (moss-and-root creature)
6. "Tim Cheese" (rat in a suit)
7. Banana gorilla (slide 2)
8. Watermelon zebra (slide 2)

## 4b. Character script, section by section

24 fps, 16:9. Each section clip stays under 20 seconds for Seedance edit stability. Storyboard: https://claude.ai/artifact/Vk2MjpTc9CkJFzeVFFjuw2

### S1 Cover (0:00 to 0:06, autoplays on load, scroll locked)
- Big centred lockup and tagline already up. Tung walks in from the right, far upstage, passes behind the text looking out at the empty stage, then comes forward and settles lower, centre-right, his whole figure under the text block. Scroll unlocks when he settles.
- Camera: static, low (about chest height) and tilted up a few degrees, so the horizon sits a third of the way up the frame and every character lives in the lower half. The top half is clear for copy. This low, tilted-up framing holds for the whole site.

### S2 The World (0:06 to 0:21)
- Cappuccina pirouettes in from the left, Patapim lumbers in from the right, Tralalero runs in from the bottom of frame. Tung watches.
- They settle in a loose line in the lower half of the frame, heads well below the copy. Copy sits centred in the upper-middle: title, two lines, icon row. The camera pulls back a touch to open the gap.
- Camera: slow pull back.

### S3 Proof and Opportunity (0:21 to 0:36)
- Copy slides in from the right and parks on the right half, vertically centred.
- Tim Cheese enters from the left with a blank sign; the ninja lands from above on the left. The whole group drifts left and fades out at the left edge.
- Tung stays centre-left. A flat disc surfaces under him first (visible on the floor), then it lifts him up on a low platform.
- Camera: slow drift right with the text, slight crane.

### S4 The Problem (0:36 to 0:48)
- Copy comes in from the left, upper-left third.
- The stage becomes a 3D graph: a perspective grid in space (time across, attention up). The rise to the peak is a hot white laser from the lower left up to Tung's stage, which sits at the peak. At the split it forks: hot red laser for path A (up), white laser for path B (down). Tung alone on his stage under one downlight; the others are gone.
- Camera: slow push in, slight tilt down.

### S5 The Vision (0:48 to 1:03)
- Lights return. Tung's platform lowers back to the floor, slides to centre and widens into a flat round disc. Everyone walks onto the flat disc from the sides (gorilla and zebra enter from off-frame left and right). Then the disc rises with everyone on it and starts to rotate: the IP Factory. The group is dead centre.
- Copy in two columns, left and right, wrapping the stage.
- Camera: slow half orbit, slightly low.

### S6 Team (1:03 to 1:11)
- Stage lowers back to the floor with everyone on it, then they step off into a line facing out. The disc sinks away.
- Six circles (photo, name, one line) hang directly above six of the characters; the two outer characters carry none.
- Camera: front on, wide, holds.

### S7 Contact (after 1:11, idle loop, scroll ends)
- Back to the cover composition: centred title, subtext, Contact Us button. From the Team line everyone walks straight to their idle spot, nobody leaves frame. Tung off-centre right and a step closer to camera, not blocking the text; the others sit, lean and bounce at the edges and back.
- Scroll ends; the video becomes an 8 second idle loop.
- Camera: static, same as the cover.

## 4c. Resting frames and the clip plan

Every section ends on a resting frame: the camera has stopped, the copy appears, the visitor reads. During the rest the characters keep idling (breathing, looking around, small hand motions) but nobody travels. When the visitor scrolls on, the motion resumes from that exact frame.

The Blender timeline (24 fps, frames 1 to 2800) is cut into motion clips (M) and rest clips (R). There are no cuts anywhere: the camera is one continuous path, and the graph section fades its grid and lasers in and out while the camera swings.

| Clip | Frames | Length | What happens |
| --- | --- | --- | --- |
| M1 Cover (autoplay, scroll locked) | 1 to 144 | 6.0 s | Tung walks in and settles. |
| R1 rest | 145 to 264 | 5.0 s | Cover copy. |
| M2 World | 265 to 624 | 15.0 s | Three walk-ins, camera pulls back. |
| R2 rest | 625 to 744 | 5.0 s | World copy. |
| M3 Proof | 745 to 1050 | 12.75 s | Giants rise far back, group drifts left, flat disc surfaces and lifts Tung. |
| R3 rest | 1051 to 1194 | 6.0 s | Proof copy. |
| M4 Problem | 1195 to 1512 | 13.25 s | Grid fades in, lights drop, camera swings and lands as the white laser is halfway to Tung, fork draws, slow push in. |
| R4 rest | 1513 to 1632 | 5.0 s | Problem copy. |
| M5 Vision | 1633 to 2053 | 17.5 s | Lasers and grid fade out, lights return, camera swings front; platform lowers, widens, everyone walks on, stage rises and spins, half orbit. |
| R5 rest | 2054 to 2173 | 5.0 s | Vision copy, stage holding at the end of the orbit. |
| M6 Team | 2174 to 2325 | 6.3 s | Stage lowers, everyone steps off into the line, camera returns front. |
| R6 rest | 2326 to 2484 | 6.6 s | Team circles. |
| M7 Contact | 2485 to 2613 | 5.4 s | Everyone walks straight to idle spots, camera back to the cover framing. |
| R7 loop | 2614 to 2800 | 7.8 s | Idle loop, scroll ends. |

Seedance plan: each M clip is one EDIT task (all between 4 and 20 s). Each R clip is a second task from a static-camera source and gets looped on the site. The last frame of an R clip is the first frame of the next M clip, so the hand-off is seamless.

## 5. Production pipeline

### Stage A: Blender blocking (this machine, Blender 5.2.1, via Blender MCP)
- One .blend at `docs/hero/blocking/ipstudios-hero-blocking.blend` (not committed until Daniel says so).
- Stage: glossy dark floor, gradient backdrop, three pink emissive lines, soft key light.
- Eight humanoid block figures (capsule body, cube head, distinct heights and widths per character, a text label floating above each).
- Keyframed walk-ins, turns, fades, the platform and the rising rotating stage, all on one timeline with a marker per section.
- One camera with the moves above, kept low and tilted up.
- Idle life on every figure: noise modifiers on the root tilt and sway, arms, legs, heads, the bat, the fin and the tutu, so Seedance reads them as active even when parked.
- Output: 1280x720 24 fps playblasts per clip in the table above (seven motion clips and seven rest clips) plus review stills.

### Stage B: character identity (Vibecreate)
- Clean reference images for all eight characters (front, three-quarter, full body on neutral ground), generated with the image tool from the deck's art or supplied by Daniel.
- Each registered in the Vibecreate asset library so Seedance addresses them as "Image N" with no real-face filter issues.

### Stage C: Seedance 2.5 (Vibecreate)
- Per section clip: an EDIT task with the Blender playblast as the source video. Prompt: replace each block figure with its character reference, keep camera, timing and positions, restyle the stage to the slide 2 look.
- Edit keeps the source's length and aspect ratio (so 16:9 desktop first; a 9:16 mobile version needs a second Blender render).
- Seedance 2.5 limits that shape this: 30 s max per task, edits under 20 s are most stable, output is MOV.
- Iterate per section, then stitch the seven clips.

### Stage D: site build (Next.js, after the video exists)
- Fixed full-bleed video layer, scroll scrubbed per section (GSAP ScrollTrigger or equivalent), copy in a foreground layer, cover beat played once with scroll locked, Contact section ends scroll and plays the idle loop.
- Frame-sequence fallback for Safari if video scrubbing stutters.

## 6. Order of work

1. Daniel confirms this plan.
2. Install Blender MCP (addon in Blender 5.2, server via uvx, registered for Claude Code).
3. Build the blocking in Blender, render the seven playblasts, review stills with Daniel.
4. Character reference set and asset registration.
5. Seedance edits per section, iterate, stitch.
6. Build the site around the finished hero video.

## 7. What was built (31 Oct 2026)

- **Character reference:** one lineup image of all eight characters, generated from deck crops (`docs/hero/refs/character-lineup.jpg`). It is the single identity reference for every Seedance edit.
- **Seedance 2.5 edits:** one EDIT task per section pair (motion clip plus its rest clip, 11 to 22.5 s) so each section is continuous inside itself. Finals in `docs/hero/seedance/P1..P7`; rejected takes in `docs/hero/seedance/rejected/`. The instruction pattern that works: replace each labelled block, pin positions by timestamp, describe the restyle of the background, and say Image 1 is for appearance only (otherwise Seedance copies the lineup composition). Uploads must be under about 4.5 MB.
- **Encoding:** `python3 -I scripts/encode_hero.py` splits each pair at its motion/rest boundary, concatenates the motion parts into `public/hero/motion.mp4` (keyframe every 4 frames for scrubbing), writes ping-pong rest loops `r1..r7.mp4`, and writes `src/hero/manifest.json` with measured timings.
- **Site:** `src/components/HeroStage.tsx`. M1 autoplays with scroll locked, rests loop while copy is up, motion clips scrub with scroll. Copy is positioned in percentages of the video frame (container units), measured on the Seedance rest frames. Portrait screens stack the copy at the top and pan the video crop per section.

### Known gaps
- Contact email is a placeholder (`hello@ipstudios.com` in `src/content.ts`).
- Seedance kept the Team line larger and tighter than the blocking; the team circles were fitted to the actual frame rather than re-generating.
- `motion.mp4` is about 30 MB; a lower-bitrate mobile encode would help on cellular.
- Mobile uses the same 16:9 video cropped; a 9:16 render would need a second Blender camera pass.
